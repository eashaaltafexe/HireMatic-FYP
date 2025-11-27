require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkInterviews() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('test');
    
    // Find completed interviews
    const completed = await db.collection('interviews').find({
      status: 'completed'
    }).limit(5).toArray();
    
    console.log(`\n✅ Found ${completed.length} completed interviews:\n`);
    
    completed.forEach((interview, i) => {
      console.log(`${i + 1}. Interview ID: ${interview.interviewId || interview._id}`);
      console.log(`   Candidate ID: ${interview.candidateId}`);
      console.log(`   Application ID: ${interview.applicationId}`);
      console.log(`   Status: ${interview.status}`);
      console.log(`   Evaluated: ${interview.evaluated ? 'Yes' : 'No'}`);
      console.log(`   Overall Score: ${interview.overallScore || 'Not scored'}`);
      console.log(`   PDF Path: ${interview.pdfPath ? `"${interview.pdfPath}"` : 'Not generated'}`);
      console.log(`   Answers: ${interview.answers?.length || 0} answers`);
      console.log('');
    });
    
    // Also check for any with PDF paths
    const withPdf = await db.collection('interviews').find({
      pdfPath: { $exists: true }
    }).toArray();
    
    console.log(`\n📄 Interviews with PDF paths: ${withPdf.length}`);
    
  } finally {
    await client.close();
  }
}

checkInterviews().catch(console.error);
