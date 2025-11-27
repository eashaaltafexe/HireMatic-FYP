/**
 * Data Access Layer - Chatbot Message Model
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  userId: string;
  userRole: 'admin' | 'hr' | 'candidate' | 'general';
  message: string;
  response: string;
  timestamp: Date;
  sessionId: string;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  userRole: {
    type: String,
    enum: ['admin', 'hr', 'candidate', 'general'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
ChatMessageSchema.index({ userId: 1, sessionId: 1 });
ChatMessageSchema.index({ timestamp: -1 });

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
