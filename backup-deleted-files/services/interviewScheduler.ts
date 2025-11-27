import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface InterviewSlot {
  date: Date;
  duration: number; // minutes
  type: 'AI' | 'Human' | 'Panel';
  interviewerId?: string;
}

export interface ScheduledInterview {
  id: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  slot: InterviewSlot;
  link: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  createdAt: Date;
  reminderSent: boolean;
}

/**
 * Generate available interview slots
 * This is a simplified version - in production you'd check actual calendar availability
 */
export function generateAvailableSlots(startDate: Date = new Date(), daysAhead: number = 14): InterviewSlot[] {
  const slots: InterviewSlot[] = [];
  const currentDate = new Date(startDate);
  
  // Skip weekends and generate slots for next 2 weeks
  for (let day = 1; day <= daysAhead; day++) {
    currentDate.setDate(startDate.getDate() + day);
    
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
    
    // Generate time slots: 9 AM to 5 PM, every hour
    for (let hour = 9; hour <= 17; hour++) {
      const slotDate = new Date(currentDate);
      slotDate.setHours(hour, 0, 0, 0);
      
      // Skip past times
      if (slotDate <= new Date()) continue;
      
      slots.push({
        date: slotDate,
        duration: 45, // 45 minutes for AI interview
        type: 'AI'
      });
    }
  }
  
  return slots.slice(0, 20); // Return first 20 available slots
}

/**
 * Find the best available interview slot
 * This uses a simple algorithm - in production you'd consider candidate preferences, timezone, etc.
 */
export function findBestSlot(availableSlots: InterviewSlot[]): InterviewSlot | null {
  if (availableSlots.length === 0) return null;
  
  // For now, just return the earliest available slot
  // In production, you might consider:
  // - Candidate's preferred time zones
  // - Business hours in candidate's location
  // - Interviewer availability
  // - Load balancing across time slots
  
  return availableSlots[0];
}

/**
 * Generate unique interview link
 */
export function generateInterviewLink(applicationId: string, candidateId: string): string {
  const interviewId = uuidv4();
  const token = crypto.randomBytes(32).toString('hex');
  
  // In production, you'd store this token securely and validate it
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/interview/${interviewId}?token=${token}&candidate=${candidateId}&application=${applicationId}`;
}

/**
 * Schedule an interview automatically
 */
export async function scheduleInterview(
  applicationId: string,
  candidateId: string,
  jobId: string
): Promise<ScheduledInterview | null> {
  console.log('📅 Scheduling interview for application:', applicationId);
  
  try {
    // Get available slots
    const availableSlots = generateAvailableSlots();
    
    if (availableSlots.length === 0) {
      console.error('❌ No available interview slots found');
      return null;
    }
    
    // Find best slot
    const bestSlot = findBestSlot(availableSlots);
    
    if (!bestSlot) {
      console.error('❌ Could not find suitable interview slot');
      return null;
    }
    
    // Generate interview link
    const interviewLink = generateInterviewLink(applicationId, candidateId);
    
    // Create scheduled interview record
    const scheduledInterview: ScheduledInterview = {
      id: uuidv4(),
      applicationId,
      candidateId,
      jobId,
      slot: bestSlot,
      link: interviewLink,
      status: 'scheduled',
      createdAt: new Date(),
      reminderSent: false
    };
    
    console.log('✅ Interview scheduled successfully:', {
      date: bestSlot.date.toISOString(),
      type: bestSlot.type,
      duration: bestSlot.duration,
      link: interviewLink
    });
    
    return scheduledInterview;
    
  } catch (error) {
    console.error('❌ Error scheduling interview:', error);
    return null;
  }
}

/**
 * Check if interview reminder should be sent
 */
export function shouldSendReminder(interview: ScheduledInterview): boolean {
  if (interview.reminderSent) return false;
  
  const now = new Date();
  const interviewDate = new Date(interview.slot.date);
  const hoursUntilInterview = (interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Send reminder 24 hours before interview
  return hoursUntilInterview <= 24 && hoursUntilInterview > 0;
}

/**
 * Generate interview reminder message
 */
export function generateReminderMessage(interview: ScheduledInterview, candidateName: string, jobTitle: string): string {
  const interviewDate = new Date(interview.slot.date);
  const formattedDate = interviewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `Hi ${candidateName}, this is a reminder that you have an AI interview scheduled for the ${jobTitle} position tomorrow (${formattedDate}) at ${formattedTime}. Please join using this link: ${interview.link}. Good luck!`;
}
