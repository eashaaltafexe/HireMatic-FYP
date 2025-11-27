require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function fixPdfPaths() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('test');
    
    // Find applications with PDF paths that start with "public/"
    const apps = await db.collection('applications').find({
      'interviewSession.pdfPath': { $regex: '^public/' }
    }).toArray();
    
    console.log(`\nFound ${apps.length} applications with incorrect PDF paths\n`);
    
    for (const app of apps) {
      const oldPath = app.interviewSession.pdfPath;
      const newPath = oldPath.replace(/^public\//, ''); // Remove "public/" prefix
      
      const result = await db.collection('applications').updateOne(
        { _id: app._id },
        { $set: { 'interviewSession.pdfPath': newPath } }
      );
      
      console.log(`✓ Fixed: "${oldPath}" → "${newPath}"`);
    }
    
    console.log(`\n✅ Updated ${apps.length} PDF paths`);
    
  } finally {
    await client.close();
  }
}

fixPdfPaths().catch(console.error);
