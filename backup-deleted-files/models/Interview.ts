import mongoose, { Document, Schema } from 'mongoose';

export interface IInterview extends Document {
  _id: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  interviewId: string;
  slot: {
    date: Date;
    duration: number;
    type: 'AI' | 'Human' | 'Panel';
    interviewerId?: string;
  };
  link: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
  confirmationStatus: 'pending' | 'confirmed' | 'declined' | 'rescheduled';
  rescheduleRequests: Array<{
    requestedDate: Date;
    reason: string;
    status: 'pending' | 'approved' | 'declined';
    requestedAt: Date;
  }>;
  notifications: Array<{
    type: 'scheduled' | 'reminder' | 'confirmation' | 'reschedule' | 'cancellation';
    sentAt: Date;
    channel: 'email' | 'sms' | 'in-app';
    status: 'sent' | 'delivered' | 'failed';
  }>;
  createdAt: Date;
  updatedAt: Date;
  reminderSent: boolean;
  token: string; // Secure token for interview access
}

const InterviewSchema = new Schema<IInterview>({
  applicationId: {
    type: String,
    required: true,
    ref: 'Application'
  },
  candidateId: {
    type: String,
    required: true,
    ref: 'User'
  },
  jobId: {
    type: String,
    required: true,
    ref: 'Job'
  },
  interviewId: {
    type: String,
    required: true,
    unique: true
  },
  slot: {
    date: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      default: 45
    },
    type: {
      type: String,
      enum: ['AI', 'Human', 'Panel'],
      required: true
    },
    interviewerId: {
      type: String,
      ref: 'User'
    }
  },
  link: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled'
  },
  confirmationStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'declined', 'rescheduled'],
    default: 'pending'
  },
  rescheduleRequests: [{
    requestedDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['scheduled', 'reminder', 'confirmation', 'reschedule', 'cancellation'],
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'in-app'],
      required: true
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }],
  reminderSent: {
    type: Boolean,
    default: false
  },
  token: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
InterviewSchema.index({ candidateId: 1, status: 1 });
InterviewSchema.index({ applicationId: 1 });
InterviewSchema.index({ 'slot.date': 1 });
InterviewSchema.index({ token: 1 });

export default mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
