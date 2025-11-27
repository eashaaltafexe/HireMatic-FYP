import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'hr' | 'candidate';
  title?: string;
  department?: string;
  company?: string;
  profileImage?: string;
  resume?: {
    url: string;
    name: string;
    uploadDate: Date;
  };
  skills?: string[];
  experience?: {
    title: string;
    company: string;
    location: string;
    startDate: Date;
    endDate: Date;
    current: boolean;
    description: string;
  }[];
  education?: {
    degree: string;
    institution: string;
    field: string;
    graduationYear: number;
    grade: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  resetToken?: string;
  resetTokenExpiry?: number;
  emailVerified?: boolean;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['candidate', 'hr', 'admin'],
    default: 'candidate'
  },
  title: String,
  department: String,
  company: String,
  profileImage: String,
  resume: {
    url: String,
    name: String,
    uploadDate: Date
  },
  skills: [String],
  experience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  education: [{
    degree: String,
    institution: String,
    field: String,
    graduationYear: Number,
    grade: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Number,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
});

// Update timestamp before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 