require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkApplications() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('test');
    
    // Find applications with interview sessions
    const apps = await db.collection('applications').find({
      interviewSession: { $exists: true }
    }).limit(3).toArray();
    
    console.log(`\n📋 Found ${apps.length} applications with interview sessions:\n`);
    
    apps.forEach((app, i) => {
      console.log(`${i + 1}. Application ID: ${app.applicationId || app._id}`);
      console.log(`   Candidate: ${app.candidateName || app.candidate?.name || 'Unknown'}`);
      console.log(`   Job: ${app.jobTitle || app.jobId}`);
      console.log(`   Interview Session:`);
      const session = app.interviewSession || {};
      console.log(`     - Status: ${session.status}`);
      console.log(`     - Evaluated: ${session.evaluated || false}`);
      console.log(`     - Overall Score: ${session.overallScore || 'Not scored'}`);
      console.log(`     - PDF Path: ${session.pdfPath || 'Not generated'}`);
      console.log(`     - Answers: ${session.answers?.length || 0} answers`);
      
      if (session.answers && session.answers.length > 0) {
        console.log(`     - First answer preview: "${session.answers[0].answer?.substring(0, 50)}..."`);
      }
      console.log('');
    });
    
  } finally {
    await client.close();
  }
}

checkApplications().catch(console.error);
