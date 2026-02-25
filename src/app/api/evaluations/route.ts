import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://hirematice_admin:DXVAd5aXWLuTeCR9@cluster0.6hifgaj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = 'test';

export async function GET() {
  let client;
  try {
    console.log('📊 [Evaluations API] Fetching evaluations...');
    client = await MongoClient.connect(MONGO_URI);
    const db = client.db(DB_NAME);
    
    // First, check all applications with interview sessions
    const allAppsWithInterview = await db.collection('applications').find({
      'interviewSession': { $exists: true }
    }).toArray();
    console.log('📋 [Evaluations API] Total applications with interviews:', allAppsWithInterview.length);
    
    // Check how many are evaluated
    const evaluatedCount = allAppsWithInterview.filter(app => app.interviewSession?.evaluated === true).length;
    console.log('✅ [Evaluations API] Evaluated applications:', evaluatedCount);
    console.log('⏳ [Evaluations API] Pending evaluations:', allAppsWithInterview.length - evaluatedCount);
    
    // Fetch evaluated applications
    let applications = await db.collection('applications').find({
      'interviewSession.evaluated': true
    }).toArray();
    
    // FALLBACK: If no evaluated apps, show completed interviews that are pending evaluation
    if (applications.length === 0) {
      console.log('⚠️ [Evaluations API] No evaluated apps found, checking for completed interviews...');
      applications = await db.collection('applications').find({
        'interviewSession.completedAt': { $exists: true }
      }).toArray();
      console.log('📋 [Evaluations API] Found', applications.length, 'completed interviews (pending evaluation)');
    }
    
    console.log('📦 [Evaluations API] Returning', applications.length, 'evaluations');

    // Fetch all jobs to populate position names
    const jobs = await db.collection('jobs').find({}).toArray();
    const jobsMap = new Map(jobs.map(job => [job._id.toString(), job]));

    // Map MongoDB data to frontend format
    const evaluations = await Promise.all(applications.map(async app => {
      const session = app.interviewSession || {};
      
      // Get job details
      let position = 'Unknown Position';
      let company = 'HireMatic';
      
      if (app.jobId) {
        const jobIdStr = typeof app.jobId === 'string' ? app.jobId : app.jobId.toString();
        const job = jobsMap.get(jobIdStr);
        
        if (job) {
          position = job.title || job.position || 'Unknown Position';
          company = job.company && job.company !== 'N/A' ? job.company : 'HireMatic';
        }
      }
      
      // Determine status and hiring decision
      let status = 'In Progress';
      let hiringDecision = null;
      
      if (session.evaluated) {
        status = 'Completed';
        // Determine hiring decision based on score
        if (session.overallScore >= 70) {
          hiringDecision = 'RECOMMENDED';
        } else {
          hiringDecision = 'NOT RECOMMENDED';
        }
      } else if (session.completedAt) {
        status = 'Pending Evaluation';
      }
      
      return {
        _id: app._id,
        position: position,
        company: company,
        date: session.completedAt ? new Date(session.completedAt).toISOString().slice(0, 10) : '-',
        interviewer: 'TalkHire AI',
        overallScore: session.overallScore || 0,
        status: status,
        hiringDecision: hiringDecision,
        feedback: session.overallFeedback || 'Evaluation in progress...',
        pdfPath: session.pdfPath || session.pdfReportPath || '',
        // You can add categories and recommendations if available in your schema
      };
    }));

    return NextResponse.json(evaluations);
  } catch (err) {
    console.error('Error fetching evaluations:', err);
    return NextResponse.json([], { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
