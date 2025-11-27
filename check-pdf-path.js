require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkPdfPath() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to:', uri?.split('@')[1] || 'MongoDB');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('test');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check each collection for data
    console.log('\n📊 Collection counts:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }
    
    // Try to find interview data in any collection with 'interview' in the name
    const interviewCollections = collections.filter(c => c.name.toLowerCase().includes('interview'));
    
    if (interviewCollections.length > 0) {
      console.log('\n🔍 Interview-related collections:');
      for (const col of interviewCollections) {
        const sample = await db.collection(col.name).findOne({});
        console.log(`\n${col.name}:`);
        console.log(JSON.stringify(sample, null, 2).substring(0, 500));
      }
    }
  } finally {
    await client.close();
  }
}

checkPdfPath().catch(console.error);
