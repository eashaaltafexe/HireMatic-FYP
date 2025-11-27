import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://hirematice_admin:DXVAd5aXWLuTeCR9@cluster0.6hifgaj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = 'test';

export async function GET() {
  let client;
  try {
    client = await MongoClient.connect(MONGO_URI);
    const db = client.db(DB_NAME);
    const applications = await db.collection('applications').find({
      'interviewSession.evaluated': true
    }).toArray();

    // Map MongoDB data to frontend format
    const evaluations = applications.map(app => {
      const session = app.interviewSession || {};
      return {
        _id: app._id,
        position: app.jobId || 'Unknown Position',
        company: app.company || '-',
        date: session.completedAt ? new Date(session.completedAt).toISOString().slice(0, 10) : '-',
        interviewer: session.aiInterviewerId || '-',
        overallScore: session.overallScore || 0,
        status: session.evaluated ? 'Completed' : 'In Progress',
        feedback: session.overallFeedback || '',
        pdfPath: session.pdfPath || '',
        // You can add categories and recommendations if available in your schema
      };
    });

    return NextResponse.json(evaluations);
  } catch (err) {
    return NextResponse.json([], { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
