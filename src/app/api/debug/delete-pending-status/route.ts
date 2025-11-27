import { NextResponse } from 'next/server';
import { dbConnect, Application } from '@/data-access';

export async function DELETE() {
  try {
    await dbConnect();
    
    // Find all pending applications
    const pendingApplications = await Application.find({
      status: 'Pending'
    }).populate('jobId', 'title company').populate('userId', 'name email');
    
    console.log('Found pending applications:', pendingApplications.length);
    
    if (pendingApplications.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending applications found',
        deletedCount: 0
      });
    }
    
    // Log applications that will be deleted
    const applicationInfo = pendingApplications.map(app => ({
      id: app._id,
      candidate: app.userId?.name || 'Unknown',
      job: app.jobId?.title || 'Unknown Job',
      status: app.status,
      appliedDate: app.appliedDate
    }));
    
    console.log('Applications to be deleted (Pending):', applicationInfo);
    
    // Delete pending applications
    const deleteResult = await Application.deleteMany({
      status: 'Pending'
    });
    
    console.log('✅ Deleted pending applications:', deleteResult.deletedCount);
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} pending applications`,
      deletedCount: deleteResult.deletedCount,
      deletedApplications: applicationInfo
    });
    
  } catch (error: any) {
    console.error('Error deleting pending applications:', error);
    return NextResponse.json({ 
      error: 'Failed to delete pending applications',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to view pending applications
export async function GET() {
  try {
    await dbConnect();
    
    const pendingApplications = await Application.find({
      status: 'Pending'
    }).populate('jobId', 'title company').populate('userId', 'name email');
    
    const applicationInfo = pendingApplications.map(app => ({
      id: app._id,
      candidate: app.userId?.name || 'Unknown',
      job: app.jobId?.title || 'Unknown Job',
      status: app.status,
      appliedDate: app.appliedDate,
      hasEvaluation: !!app.evaluation
    }));
    
    return NextResponse.json({
      success: true,
      pendingApplications: applicationInfo,
      totalCount: pendingApplications.length,
      message: `Found ${pendingApplications.length} pending applications`
    });
    
  } catch (error: any) {
    console.error('Error fetching pending applications:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch pending applications',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}