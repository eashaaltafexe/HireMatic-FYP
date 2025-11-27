import { NextResponse } from 'next/server';
import { dbConnect, Application } from '@/data-access';

export async function DELETE() {
  try {
    await dbConnect();
    
    // Find applications without evaluation data
    const applicationsWithoutEvaluation = await Application.find({
      $or: [
        { evaluation: { $exists: false } },
        { evaluation: null }
      ]
    }).populate('jobId', 'title company').populate('userId', 'name email');
    
    console.log('Found applications without evaluation:', applicationsWithoutEvaluation.length);
    
    if (applicationsWithoutEvaluation.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No applications without evaluation found',
        deletedCount: 0
      });
    }
    
    // Log applications that will be deleted
    const applicationInfo = applicationsWithoutEvaluation.map(app => ({
      id: app._id,
      candidate: app.userId?.name || 'Unknown',
      job: app.jobId?.title || 'Unknown Job',
      status: app.status,
      appliedDate: app.appliedDate,
      hasEvaluation: !!app.evaluation
    }));
    
    console.log('Applications to be deleted (no evaluation):', applicationInfo);
    
    // Delete applications without evaluation
    const deleteResult = await Application.deleteMany({
      $or: [
        { evaluation: { $exists: false } },
        { evaluation: null }
      ]
    });
    
    console.log('✅ Deleted applications without evaluation:', deleteResult.deletedCount);
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} applications without evaluation data`,
      deletedCount: deleteResult.deletedCount,
      deletedApplications: applicationInfo
    });
    
  } catch (error: any) {
    console.error('Error deleting applications:', error);
    return NextResponse.json({ 
      error: 'Failed to delete applications',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to view applications without evaluation
export async function GET() {
  try {
    await dbConnect();
    
    const applicationsWithoutEvaluation = await Application.find({
      $or: [
        { evaluation: { $exists: false } },
        { evaluation: null }
      ]
    }).populate('jobId', 'title company').populate('userId', 'name email');
    
    const applicationInfo = applicationsWithoutEvaluation.map(app => ({
      id: app._id,
      candidate: app.userId?.name || 'Unknown',
      job: app.jobId?.title || 'Unknown Job',
      status: app.status,
      appliedDate: app.appliedDate,
      hasParsingData: !!app.parsedResume,
      parsingStatus: app.parsedResume?.parsingStatus
    }));
    
    return NextResponse.json({
      success: true,
      applicationsWithoutEvaluation: applicationInfo,
      totalCount: applicationsWithoutEvaluation.length,
      message: `Found ${applicationsWithoutEvaluation.length} applications without evaluation data`
    });
    
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch applications',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}