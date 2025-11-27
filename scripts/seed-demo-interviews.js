/**
 * Seed Demo Interviews for Testing
 * 
 * This script creates sample interview bookings to test the AI interviewer
 * scheduling system and availability checking.
 * 
 * Usage: node scripts/seed-demo-interviews.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const Interview = require('../src/models/Interview').default;
const Job = require('../src/models/Job').default;
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hirematic';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function seedDemoInterviews() {
  try {
    // Find or create demo jobs
    let job = await Job.findOne({ title: 'Data Scientist' });
    
    if (!job) {
      job = await Job.create({
        title: 'Data Scientist',
        department: 'Engineering',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        location: 'Remote',
        description: 'We are looking for an experienced Data Scientist...',
        skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
        status: 'published'
      });
      console.log('✅ Created demo job: Data Scientist');
    }

    // Create demo interviews for the next 3 days
    const demoInterviews = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1); // Start from tomorrow

    // Day 1 - Tomorrow (3 interviews)
    const day1 = new Date(baseDate);
    day1.setHours(9, 0, 0, 0);
    
    demoInterviews.push({
      candidateName: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      phone: '+1 555-0101',
      date: new Date(day1),
      timeSlot: '09:00'
    });

    day1.setHours(11, 0, 0, 0);
    demoInterviews.push({
      candidateName: 'Bob Smith',
      email: 'bob.smith@example.com',
      phone: '+1 555-0102',
      date: new Date(day1),
      timeSlot: '11:00'
    });

    day1.setHours(14, 0, 0, 0);
    demoInterviews.push({
      candidateName: 'Carol Williams',
      email: 'carol.williams@example.com',
      phone: '+1 555-0103',
      date: new Date(day1),
      timeSlot: '14:00'
    });

    // Day 2 - Day after tomorrow (2 interviews)
    const day2 = new Date(baseDate);
    day2.setDate(day2.getDate() + 1);
    day2.setHours(10, 0, 0, 0);
    
    demoInterviews.push({
      candidateName: 'David Brown',
      email: 'david.brown@example.com',
      phone: '+1 555-0104',
      date: new Date(day2),
      timeSlot: '10:00'
    });

    day2.setHours(15, 0, 0, 0);
    demoInterviews.push({
      candidateName: 'Emma Davis',
      email: 'emma.davis@example.com',
      phone: '+1 555-0105',
      date: new Date(day2),
      timeSlot: '15:00'
    });

    // Day 3 - 3 days from now (1 interview)
    const day3 = new Date(baseDate);
    day3.setDate(day3.getDate() + 2);
    day3.setHours(9, 0, 0, 0);
    
    demoInterviews.push({
      candidateName: 'Frank Miller',
      email: 'frank.miller@example.com',
      phone: '+1 555-0106',
      date: new Date(day3),
      timeSlot: '09:00'
    });

    // Create interview records
    let createdCount = 0;
    
    for (const demo of demoInterviews) {
      const interviewId = `INT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const secureToken = crypto.randomBytes(32).toString('hex');
      const interviewLink = `http://localhost:3000/interview/${interviewId}?token=${secureToken}&email=${encodeURIComponent(demo.email)}`;

      const interview = new Interview({
        applicationId: `APP-DEMO-${Date.now()}`,
        candidateId: `CANDIDATE-${crypto.randomBytes(8).toString('hex')}`,
        jobId: job._id,
        interviewId: interviewId,
        slot: {
          date: demo.date,
          duration: 45,
          type: 'AI',
          aiInterviewerStatus: 'available'
        },
        link: interviewLink,
        token: secureToken,
        status: 'scheduled',
        confirmationStatus: 'confirmed',
        candidateMetadata: {
          fullName: demo.candidateName,
          email: demo.email,
          phone: demo.phone
        },
        notifications: [
          {
            type: 'scheduled',
            sentAt: new Date(),
            channel: 'email',
            status: 'sent'
          }
        ]
      });

      await interview.save();
      createdCount++;
      
      console.log(`✅ Created interview: ${demo.candidateName} - ${demo.date.toLocaleString()}`);
    }

    console.log(`\n🎉 Successfully created ${createdCount} demo interviews!`);
    console.log('\nDemo Schedule Summary:');
    console.log('======================');
    console.log(`Tomorrow (${baseDate.toLocaleDateString()}): 3 interviews`);
    console.log(`Day after (${new Date(baseDate.getTime() + 86400000).toLocaleDateString()}): 2 interviews`);
    console.log(`In 3 days (${new Date(baseDate.getTime() + 172800000).toLocaleDateString()}): 1 interview`);
    console.log('\nYou can now test:');
    console.log('1. Visit http://localhost:3000/schedule-interview');
    console.log('2. Try to book a slot that conflicts with demo data');
    console.log('3. Visit http://localhost:3000/admin/scheduled-interviews to view all');

  } catch (error) {
    console.error('❌ Error seeding demo interviews:', error);
  }
}

async function clearDemoInterviews() {
  try {
    const result = await Interview.deleteMany({
      applicationId: { $regex: /^APP-DEMO/ }
    });
    console.log(`🗑️  Cleared ${result.deletedCount} demo interviews`);
  } catch (error) {
    console.error('❌ Error clearing demo interviews:', error);
  }
}

async function main() {
  await connectDB();

  const args = process.argv.slice(2);
  
  if (args.includes('--clear')) {
    await clearDemoInterviews();
  } else {
    await seedDemoInterviews();
  }

  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});




