const { MongoClient } = require('mongodb');

async function checkApplications() {
  const uri = 'mongodb+srv://fazeelabtl:fazeelabtl64@cluster0.oysmirb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('test');
    const collection = db.collection('applications');
    
    // Get all applications
    const allApps = await collection.find({}).toArray();
    console.log('Total applications:', allApps.length);
    
    // Check for applications with evaluation data
    const appsWithEvaluation = await collection.find({
      evaluation: { $exists: true, $ne: null }
    }).toArray();
    
    console.log('Applications with evaluation:', appsWithEvaluation.length);
    
    if (appsWithEvaluation.length > 0) {
      console.log('Sample evaluation data:');
      appsWithEvaluation.forEach((app, index) => {
        console.log(`App ${index + 1}:`, {
          id: app._id,
          status: app.status,
          score: app.evaluation?.score,
          feedback: app.evaluation?.feedback?.substring(0, 100) + '...'
        });
      });
    }
    
    // Check applications without evaluation
    const appsWithoutEvaluation = await collection.find({
      $or: [
        { evaluation: { $exists: false } },
        { evaluation: null }
      ]
    }).toArray();
    
    console.log('Applications without evaluation:', appsWithoutEvaluation.length);
    
    if (appsWithoutEvaluation.length > 0) {
      console.log('Sample apps without evaluation:');
      appsWithoutEvaluation.slice(0, 3).forEach((app, index) => {
        console.log(`App ${index + 1}:`, {
          id: app._id,
          status: app.status,
          hasParsingData: !!app.parsedResume,
          parsingStatus: app.parsedResume?.parsingStatus
        });
      });
    }
    
    await client.close();
  } catch (error) {
    console.error('Error checking applications:', error);
  }
}

checkApplications();