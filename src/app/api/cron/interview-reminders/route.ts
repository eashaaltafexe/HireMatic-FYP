import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Application, User, Job } from '@/data-access';
import { sendInterviewNotifications } from '@/application';

/**
 * Cron job to send interview reminders
 * This should be called by a cron service (like Vercel Cron, AWS EventBridge, etc.)
 * or run periodically to check for upcoming interviews
 */
export async function GET() {
  try {
    console.log('🔄 Running interview reminder cron job...');
    
    await dbConnect();
    
    // Find applications with interviews scheduled in the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const upcomingInterviews = await Application.find({
      'interview.date': {
        $gte: now,
        $lte: tomorrow
      },
      status: 'Interview Scheduled',
      // Only send reminder if not already sent
      'notifications': {
        $not: {
          $elemMatch: {
            message: { $regex: /reminder/i },
            date: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
          }
        }
      }
    })
    .populate('userId', 'name email phone')
    .populate('jobId', 'title company');
    
    console.log(`📅 Found ${upcomingInterviews.length} interviews requiring reminders`);
    
    let remindersSent = 0;
    let remindersSkipped = 0;
    
    for (const application of upcomingInterviews) {
      try {
        const candidate = application.userId as any;
        const job = application.jobId as any;
        
        if (!candidate || !job || !application.interview) {
          console.log(`⚠️ Skipping application ${application._id} - missing data`);
          remindersSkipped++;
          continue;
        }
        
        // Check if reminder was already sent recently (double-check)
        const recentReminder = application.notifications?.find((notif: any) => 
          notif.message.toLowerCase().includes('reminder') &&
          notif.date > new Date(now.getTime() - 24 * 60 * 60 * 1000)
        );
        
        if (recentReminder) {
          console.log(`⏭️ Skipping application ${application._id} - reminder already sent`);
          remindersSkipped++;
          continue;
        }
        
        // Send reminder notifications
        const notificationData = {
          candidateId: candidate._id.toString(),
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          candidatePhone: candidate.phone,
          jobTitle: job.title,
          companyName: job.company,
          interviewDate: new Date(application.interview.date),
          interviewLink: application.interview.link,
          type: 'interview_reminder' as const
        };
        
        const notificationResults = await sendInterviewNotifications(notificationData);
        
        // Add in-app reminder notification
        application.notifications.push({
          message: `⏰ Reminder: Your AI interview for ${job.title} is tomorrow at ${new Date(application.interview.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Don't forget to join!`,
          date: new Date(),
          read: false
        });
        
        // Add timeline entry
        application.timeline.push({
          date: new Date(),
          status: 'Reminder Sent',
          description: `Interview reminder sent via email, SMS, and in-app notification`
        });
        
        await application.save();
        
        console.log(`✅ Reminder sent for application ${application._id}:`, {
          candidate: candidate.name,
          job: job.title,
          interviewDate: application.interview.date,
          notifications: notificationResults
        });
        
        remindersSent++;
        
      } catch (error) {
        console.error(`❌ Error sending reminder for application ${application._id}:`, error);
        remindersSkipped++;
      }
    }
    
    const summary = {
      totalInterviews: upcomingInterviews.length,
      remindersSent,
      remindersSkipped,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Interview reminder cron job completed:', summary);
    
    return NextResponse.json({
      success: true,
      message: 'Interview reminders processed successfully',
      data: summary
    });
    
  } catch (error: any) {
    console.error('❌ Interview reminder cron job failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process interview reminders'
    }, { status: 500 });
  }
}

/**
 * Manual trigger for testing (POST request)
 */
export async function POST() {
  console.log('🧪 Manual trigger for interview reminders');
  return GET();
}
