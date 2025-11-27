import { ScheduledInterview } from './interviewScheduler';

export interface NotificationData {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  companyName: string;
  interviewDate: Date;
  interviewLink: string;
  type: 'interview_scheduled' | 'interview_reminder' | 'interview_completed';
}

export interface NotificationResult {
  email: { sent: boolean; error?: string };
  inApp: { sent: boolean; error?: string };
  sms: { sent: boolean; error?: string };
}

/**
 * Send email notification
 * This is a demo implementation - in production you'd use services like SendGrid, AWS SES, etc.
 */
async function sendEmailNotification(data: NotificationData): Promise<{ sent: boolean; error?: string }> {
  try {
    console.log('📧 Sending email notification to:', data.candidateEmail);
    
    const emailContent = generateEmailContent(data);
    
    // Demo: Just log the email content
    // In production, you would integrate with an email service
    console.log('Email Subject:', emailContent.subject);
    console.log('Email Body:', emailContent.body);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, assume email is always sent successfully
    console.log('✅ Email sent successfully');
    return { sent: true };
    
  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send in-app notification
 */
async function sendInAppNotification(data: NotificationData): Promise<{ sent: boolean; error?: string }> {
  try {
    console.log('🔔 Sending in-app notification to candidate:', data.candidateId);
    
    const message = generateInAppMessage(data);
    
    // In production, you would save this to the database
    // For now, we'll just log it
    console.log('In-app notification:', message);
    
    // This would typically be saved to the Application.notifications array
    // or a separate Notifications collection
    
    console.log('✅ In-app notification created');
    return { sent: true };
    
  } catch (error: any) {
    console.error('❌ In-app notification failed:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send SMS notification
 * This is a demo implementation - in production you'd use services like Twilio, AWS SNS, etc.
 */
async function sendSMSNotification(data: NotificationData): Promise<{ sent: boolean; error?: string }> {
  try {
    if (!data.candidatePhone) {
      return { sent: false, error: 'No phone number provided' };
    }
    
    console.log('📱 Sending SMS notification to:', data.candidatePhone);
    
    const smsContent = generateSMSContent(data);
    
    // Demo: Just log the SMS content
    // In production, you would integrate with an SMS service
    console.log('SMS Content:', smsContent);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ SMS sent successfully');
    return { sent: true };
    
  } catch (error: any) {
    console.error('❌ SMS sending failed:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send all notifications (email + in-app + SMS)
 */
export async function sendInterviewNotifications(data: NotificationData): Promise<NotificationResult> {
  console.log('🚀 Sending interview notifications for:', data.candidateName);
  
  // Send all notifications in parallel
  const [emailResult, inAppResult, smsResult] = await Promise.all([
    sendEmailNotification(data),
    sendInAppNotification(data),
    sendSMSNotification(data)
  ]);
  
  const result: NotificationResult = {
    email: emailResult,
    inApp: inAppResult,
    sms: smsResult
  };
  
  console.log('📊 Notification results:', result);
  return result;
}

/**
 * Generic notification function for API compatibility
 */
export async function sendNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}): Promise<void> {
  try {
    console.log(`📢 Sending ${params.type} notification to user ${params.userId}`);
    console.log(`Title: ${params.title}`);
    console.log(`Message: ${params.message}`);
    
    // In production, this would create an in-app notification record
    // and potentially send email/SMS based on user preferences
    
    // For now, just log the notification
    console.log('✅ Notification sent successfully');
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    throw error;
  }
}

/**
 * Generate email content based on notification type
 */
function generateEmailContent(data: NotificationData): { subject: string; body: string } {
  const formattedDate = data.interviewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = data.interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  switch (data.type) {
    case 'interview_scheduled':
      return {
        subject: `Interview Scheduled - ${data.jobTitle} at ${data.companyName}`,
        body: `
Dear ${data.candidateName},

Congratulations! Your application for the ${data.jobTitle} position at ${data.companyName} has been reviewed and you've been selected for an AI-powered interview.

Interview Details:
📅 Date: ${formattedDate}
🕐 Time: ${formattedTime}
💻 Type: AI Interview (45 minutes)
🔗 Join Link: ${data.interviewLink}

What to expect:
• This is an AI-powered interview that will assess your technical and soft skills
• Please ensure you have a stable internet connection and a quiet environment
• The interview will be recorded for evaluation purposes
• You'll receive your results within 24 hours

Tips for success:
• Test your camera and microphone beforehand
• Prepare examples of your work and achievements
• Be ready to discuss your experience and skills
• Speak clearly and confidently

If you need to reschedule or have any questions, please contact us immediately.

Best of luck!

The ${data.companyName} Hiring Team
        `
      };
      
    case 'interview_reminder':
      return {
        subject: `Reminder: Interview Tomorrow - ${data.jobTitle}`,
        body: `
Dear ${data.candidateName},

This is a friendly reminder that you have an AI interview scheduled for tomorrow.

Interview Details:
📅 Date: ${formattedDate}
🕐 Time: ${formattedTime}
💻 Type: AI Interview
🔗 Join Link: ${data.interviewLink}

Please make sure you're ready 10 minutes before the scheduled time.

Good luck!

The ${data.companyName} Hiring Team
        `
      };
      
    default:
      return {
        subject: `Update on your application - ${data.jobTitle}`,
        body: `Dear ${data.candidateName}, we have an update on your application for ${data.jobTitle}.`
      };
  }
}

/**
 * Generate in-app notification message
 */
function generateInAppMessage(data: NotificationData): string {
  const formattedDate = data.interviewDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = data.interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  switch (data.type) {
    case 'interview_scheduled':
      return `🎉 Great news! Your AI interview for ${data.jobTitle} is scheduled for ${formattedDate} at ${formattedTime}. Click to view details.`;
      
    case 'interview_reminder':
      return `⏰ Reminder: Your AI interview for ${data.jobTitle} is tomorrow at ${formattedTime}. Don't forget to join!`;
      
    default:
      return `📋 Update on your ${data.jobTitle} application.`;
  }
}

/**
 * Generate SMS content
 */
function generateSMSContent(data: NotificationData): string {
  const formattedDate = data.interviewDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = data.interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  switch (data.type) {
    case 'interview_scheduled':
      return `Hi ${data.candidateName}! Your AI interview for ${data.jobTitle} is scheduled for ${formattedDate} at ${formattedTime}. Join here: ${data.interviewLink}`;
      
    case 'interview_reminder':
      return `Reminder: Your AI interview for ${data.jobTitle} is tomorrow at ${formattedTime}. Join: ${data.interviewLink}`;
      
    default:
      return `Update on your ${data.jobTitle} application at ${data.companyName}.`;
  }
}
