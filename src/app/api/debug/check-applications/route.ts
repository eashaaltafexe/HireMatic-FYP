import { NextResponse } from 'next/server';
import { dbConnect, Application } from '@/data-access';

export async function GET() {
  try {
    await dbConnect();
    
    // Find all applications with evaluation data
    const applicationsWithEvaluation = await Application.find({
      evaluation: { $exists: true, $ne: null }
    }).populate('jobId', 'title company').populate('userId', 'name email');
    
    console.log('Applications with evaluation found:', applicationsWithEvaluation.length);
    
    // Find all applications (to compare)
    const allApplications = await Application.find({}).populate('jobId', 'title company').populate('userId', 'name email');
    
    console.log('Total applications found:', allApplications.length);
    
    // Check for applications with parsed resume data
    const applicationsWithParsedResumes = await Application.find({
      'parsedResume.parsingStatus': 'success'
    }).populate('jobId', 'title company').populate('userId', 'name email');
    
    console.log('Applications with successfully parsed resumes:', applicationsWithParsedResumes.length);
    
    return NextResponse.json({
      totalApplications: allApplications.length,
      applicationsWithEvaluation: applicationsWithEvaluation.length,
      applicationsWithParsedResumes: applicationsWithParsedResumes.length,
      evaluatedApplications: applicationsWithEvaluation.map(app => ({
        id: app._id,
        candidate: app.userId?.name || 'Unknown',
        job: app.jobId?.title || 'Unknown',
        status: app.status,
        score: app.evaluation?.score,
        feedback: app.evaluation?.feedback?.substring(0, 100) + '...',
        evaluationDate: app.evaluation?.evaluationDate,
        parsingStatus: app.parsedResume?.parsingStatus
      })),
      sampleApplications: allApplications.slice(0, 3).map(app => ({
        id: app._id,
        candidate: app.userId?.name || 'Unknown',
        job: app.jobId?.title || 'Unknown',
        status: app.status,
        hasEvaluation: !!app.evaluation,
        hasParsingData: !!app.parsedResume,
        parsingStatus: app.parsedResume?.parsingStatus
      }))
    });
    
  } catch (error: any) {
    console.error('Error checking applications:', error);
    return NextResponse.json({ 
      error: 'Failed to check applications',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}