import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide job title'],
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  department: {
    type: String,
    required: [true, 'Please provide department'],
  },
  employmentType: {
    type: String,
    required: [true, 'Please provide employment type'],
  },
  experienceLevel: {
    type: String,
    required: [true, 'Please provide experience level'],
  },
  location: {
    type: String,
    required: [true, 'Please provide location'],
  },
  salaryRange: {
    type: String,
  },
  description: {
    type: String,
    required: [true, 'Please provide job description'],
  },
  skills: {
    type: [String],
    default: [],
  },
  applicationDeadline: {
    type: Date,
  },
  numberOfPositions: {
    type: Number,
    default: 1,
  },
  hiringManager: {
    type: String,
  },
  contactEmail: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
  },
  evaluationCriteria: {
    technicalSkills: { type: Number, default: 30 },
    experience: { type: Number, default: 25 },
    education: { type: Number, default: 15 },
    communicationSkills: { type: Number, default: 20 },
    culturalFit: { type: Number, default: 10 },
    custom: { type: String },
  },
  minimumScore: {
    type: String,
    default: '70% - Good Match',
  },
  autoScreening: {
    type: String,
    default: 'Auto-screen based on criteria',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
JobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Job || mongoose.model('Job', JobSchema); 