import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Interview Scheduled', 'Rejected', 'Accepted'],
    default: 'Pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  coverLetter: {
    type: String,
    default: ''
  },
  parsedResume: {
    personalInfo: {
      name: String,
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
      website: String
    },
    summary: String,
    experience: [{
      company: String,
      position: String,
      duration: String,
      description: String,
      location: String
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      graduationYear: String,
      gpa: String
    }],
    skills: {
      technical: [String],
      soft: [String],
      languages: [String]
    },
    certifications: [{
      name: String,
      issuer: String,
      date: String
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String
    }],
    rawText: String,
    parsingStatus: {
      type: String,
      enum: ['pending', 'success', 'failed', 'disabled'],
      default: 'pending'
    },
    parsingError: String,
    confidence: {
      type: Number,
      default: 0
    }
  },
  interview: {
    date: Date,
    link: String,
    type: String,
    notes: String
  },
  evaluation: {
    score: Number,
    feedback: String,
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    evaluationDate: Date
  },
  timeline: [{
    date: {
      type: Date,
      default: Date.now
    },
    status: String,
    description: String
  }],
  notifications: [{
    message: String,
    date: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }]
});

// Update lastUpdate timestamp before saving
applicationSchema.pre('save', function(next) {
  this.lastUpdate = new Date();
  next();
});

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

export default Application; 