/**
 * Generate questions for existing shortlisted candidates
 * This script finds all shortlisted applications and generates questions for them
 */

const mongoose = require('mongoose');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hirematic';

// Application Schema
const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  status: String,
  evaluation: {
    score: Number,
    feedback: String,
  },
  generatedQuestions: [{
    id: Number,
    text: String,
    type: String,
    difficulty: String,
    jobField: String,
    generatedAt: Date,
  }],
  timeline: [{
    date: Date,
    status: String,
    description: String,
  }],
}, { strict: false });

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Job = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({}, { strict: false }));

// Extract job field from title
function extractJobField(jobTitle) {
  const title = jobTitle.toLowerCase();
  
  if (title.includes('software') || title.includes('developer') || title.includes('programmer')) {
    return 'software engineer';
  } else if (title.includes('data scientist') || title.includes('ml engineer')) {
    return 'data scientist';
  } else if (title.includes('frontend') || title.includes('front-end')) {
    return 'frontend developer';
  } else if (title.includes('backend') || title.includes('back-end')) {
    return 'backend developer';
  } else if (title.includes('devops') || title.includes('sre')) {
    return 'devops engineer';
  } else if (title.includes('machine learning') || title.includes('ai engineer')) {
    return 'machine learning engineer';
  } else if (title.includes('full stack') || title.includes('fullstack')) {
    return 'full stack developer';
  } else if (title.includes('product manager') || title.includes('pm')) {
    return 'product manager';
  }
  
  return 'software engineer';
}

// Generate questions via Python service
async function generateQuestions(jobField) {
  try {
    const postData = JSON.stringify({
      role: jobField,
      num_questions: 10,
    });

    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/generate-multiple',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.error) {
              reject(new Error(result.error));
            } else {
              const questions = result.questions.map(q => ({
                ...q,
                jobField,
                generatedAt: new Date(),
              }));
              resolve(questions);
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('Error generating questions:', error.message);
    return null;
  }
}

async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find shortlisted candidates (score >= 70 and no questions yet)
    console.log('🔍 Finding shortlisted candidates...');
    
    // First, let's see ALL shortlisted candidates
    const allShortlisted = await Application.find({
      'evaluation.score': { $gte: 70 }
    })
    .populate('userId', 'name email')
    .populate('jobId', 'title department')
    .limit(10);
    
    console.log(`📊 Total shortlisted candidates: ${allShortlisted.length}`);
    
    if (allShortlisted.length > 0) {
      console.log('\n📋 Shortlisted Candidates:');
      allShortlisted.forEach((app, index) => {
        const hasQuestions = app.generatedQuestions && app.generatedQuestions.length > 0;
        console.log(`   ${index + 1}. ${app.userId?.name || 'Unknown'} - ${app.jobId?.title || 'Unknown'} (${app.evaluation?.score}%) - Questions: ${hasQuestions ? app.generatedQuestions.length : 'None'}`);
      });
    }
    
    const shortlistedApps = allShortlisted.filter(app => {
      return !app.generatedQuestions || app.generatedQuestions.length === 0;
    });

    console.log(`\n📊 Found ${shortlistedApps.length} shortlisted candidates WITHOUT questions\n`);

    if (shortlistedApps.length === 0) {
      console.log('ℹ️  No shortlisted candidates found needing questions');
      await mongoose.disconnect();
      return;
    }

    // Generate questions for each
    for (const app of shortlistedApps) {
      console.log('─'.repeat(60));
      console.log(`👤 Candidate: ${app.userId?.name || 'Unknown'}`);
      console.log(`💼 Job: ${app.jobId?.title || 'Unknown'}`);
      console.log(`📊 Score: ${app.evaluation?.score}%`);
      
      const jobField = extractJobField(app.jobId?.title || '');
      console.log(`🎯 Job Field: ${jobField}`);
      
      console.log('🤖 Generating questions...');
      const questions = await generateQuestions(jobField);
      
      if (questions && questions.length > 0) {
        // Use native MongoDB driver to bypass Mongoose schema validation
        const db = mongoose.connection.db;
        const applicationsCollection = db.collection('applications');
        
        await applicationsCollection.updateOne(
          { _id: app._id },
          {
            $set: { generatedQuestions: questions },
            $push: {
              timeline: {
                date: new Date(),
                status: 'Questions Generated',
                description: `${questions.length} AI-generated interview questions created for ${jobField}`,
              }
            }
          }
        );
        
        console.log(`✅ Generated and stored ${questions.length} questions`);
        console.log(`   Sample: "${questions[0].text.substring(0, 60)}..."\n`);
      } else {
        console.log('❌ Failed to generate questions\n');
      }
    }

    console.log('─'.repeat(60));
    console.log('🎉 Question generation complete!');
    console.log(`✅ Processed ${shortlistedApps.length} applications`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

main();
