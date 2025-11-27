import { NextResponse } from 'next/server';
import { dbConnect, Application } from '@/data-access';

export async function GET() {
  try {
    await dbConnect();
    
    // Get all applications with populated job data
    const applications = await Application.find({})
      .populate('jobId', 'title company')
      .populate('userId', 'name email')
      .sort({ appliedDate: -1 });
    
    console.log('=== APPLICATION DEBUG INFO ===');
    console.log('Total applications found:', applications.length);
    
    const result = applications.map((app, index) => {
      const hasEvaluation = !!app.evaluation;
      const evaluationData = app.evaluation ? {
        score: app.evaluation.score,
        feedback: app.evaluation.feedback?.substring(0, 100),
        evaluationDate: app.evaluation.evaluationDate
      } : null;
      
      console.log(`App ${index + 1}:`, {
        id: app._id,
        job: app.jobId?.title || 'No job',
        candidate: app.userId?.name || 'No candidate',
        status: app.status,
        hasEvaluation,
        evaluationScore: evaluationData?.score,
        hasParsingData: !!app.parsedResume,
        parsingStatus: app.parsedResume?.parsingStatus
      });
      
      return {
        id: app._id,
        jobTitle: app.jobId?.title || 'Unknown Job',
        candidateName: app.userId?.name || 'Unknown Candidate',
        status: app.status,
        appliedDate: app.appliedDate,
        hasEvaluation,
        evaluation: evaluationData,
        hasParsingData: !!app.parsedResume,
        parsingStatus: app.parsedResume?.parsingStatus,
        timelineEvents: app.timeline?.length || 0
      };
    });
    
    const stats = {
      total: applications.length,
      withEvaluation: applications.filter(app => app.evaluation).length,
      withoutEvaluation: applications.filter(app => !app.evaluation).length,
      withParsingData: applications.filter(app => app.parsedResume).length,
      byStatus: applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    console.log('=== STATISTICS ===');
    console.log('Stats:', stats);
    
    return NextResponse.json({
      success: true,
      stats,
      applications: result,
      message: `Found ${applications.length} applications, ${stats.withEvaluation} have evaluation data`
    });
    
  } catch (error: any) {
    console.error('Debug applications error:', error);
    return NextResponse.json({
      error: 'Failed to debug applications',
      details: error.message
    }, { status: 500 });
  }
}