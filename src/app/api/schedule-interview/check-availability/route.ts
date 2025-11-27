import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Interview } from '@/data-access';

// Time slots configuration
const TIME_SLOTS = [
  { value: '09:00', display: '09:00 AM' },
  { value: '10:00', display: '10:00 AM' },
  { value: '11:00', display: '11:00 AM' },
  { value: '14:00', display: '02:00 PM' },
  { value: '15:00', display: '03:00 PM' },
  { value: '16:00', display: '04:00 PM' }
];

// AI Interviewer capacity settings
const MAX_CONCURRENT_INTERVIEWS = 1; // AI can only handle 1 interview at a time
const INTERVIEW_DURATION_MINUTES = 45; // Standard interview duration

interface BookedSlot {
  startTime: Date;
  endTime: Date;
}

// POST /api/schedule-interview/check-availability
export async function POST(request: NextRequest) {
  try {
    const { date, positionId } = await request.json();

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Parse the selected date
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Get start and end of day
    const dayStart = new Date(selectedDate);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Find all interviews scheduled for this date that are not cancelled
    const bookedInterviews = await Interview.find({
      'slot.date': {
        $gte: dayStart,
        $lte: dayEnd
      },
      'slot.type': 'AI', // Only check AI interviews
      status: { $in: ['scheduled', 'confirmed'] } // Only active interviews
    }).select('slot.date slot.duration');

    // Create a map of booked time slots with buffer
    const bookedSlots: BookedSlot[] = bookedInterviews.map(interview => {
      const startTime = new Date(interview.slot.date);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + interview.slot.duration);
      
      return { startTime, endTime };
    });

    // Check availability for each time slot
    const availabilityResults = TIME_SLOTS.map(slot => {
      // Create datetime for this slot
      const [hours, minutes] = slot.value.split(':').map(Number);
      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
      
      const slotEndTime = new Date(slotDateTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + INTERVIEW_DURATION_MINUTES);

      // Check if this slot conflicts with any booked interview
      const isAvailable = !bookedSlots.some(booked => {
        // Check for overlap: slot starts before booked ends AND slot ends after booked starts
        return (
          slotDateTime < booked.endTime && slotEndTime > booked.startTime
        );
      });

      return {
        time: slot.value,
        displayTime: slot.display,
        available: isAvailable,
        dateTime: slotDateTime.toISOString()
      };
    });

    // Filter out past time slots if the selected date is today
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    const filteredSlots = availabilityResults.map(slot => {
      if (isToday) {
        const slotDateTime = new Date(slot.dateTime);
        // Add 2 hours buffer for same-day scheduling
        const minScheduleTime = new Date(now);
        minScheduleTime.setHours(minScheduleTime.getHours() + 2);
        
        if (slotDateTime < minScheduleTime) {
          return { ...slot, available: false };
        }
      }
      return slot;
    });

    return NextResponse.json({
      success: true,
      date: date,
      slots: filteredSlots,
      bookedCount: bookedSlots.length,
      availableCount: filteredSlots.filter(s => s.available).length
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


