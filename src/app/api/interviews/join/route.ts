import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, Interview } from '@/data-access';
import { jwtVerify } from 'jose';
import { AgoraService } from '@/application';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

async function verifyToken(request: NextRequest): Promise<JwtPayload | null> {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
    const { payload } = await jwtVerify(token, secret);
    
    const jwtPayload = payload as any;
    return {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      role: jwtPayload.role
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// POST /api/interviews/join - Create/Join Daily.co room for interview
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId } = await request.json();

    if (!interviewId) {
      return NextResponse.json({ error: 'Interview ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Get interview details - look up by interviewId field, not _id
    const interview = await Interview.findOne({ interviewId: interviewId })
      .populate('jobId', 'title company department')
      .lean() as any;

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Verify the user is authorized to join this interview
    if (interview.candidateId !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to join this interview' }, { status: 403 });
    }

    // Generate channel name from interview ID
    const channelName = AgoraService.generateChannelName(
      interview.interviewId || interview._id.toString()
    );
    const userName = interview.candidateMetadata?.fullName || decoded.email || 'Candidate';
    
    console.log('Generating Agora credentials:', {
      channelName,
      userName,
      userId: decoded.userId,
      interviewId: interview._id
    });

    try {
      // Generate Agora credentials for the user
      const agoraCredentials = AgoraService.generateCredentials({
        channelName: channelName,
        userId: decoded.userId,
        role: 'publisher', // All participants can publish audio/video
        expirationTimeInSeconds: 24 * 60 * 60 // 24 hours
      });

      // Update interview with Agora channel info
      const interviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview/${interview._id}`;
      
      await Interview.findByIdAndUpdate(interview._id, {
        link: interviewUrl,
        'slot.agoraChannel': channelName
      });

      return NextResponse.json({
        success: true,
        agora: {
          appId: agoraCredentials.appId,
          channel: agoraCredentials.channel,
          token: agoraCredentials.token,
          uid: agoraCredentials.uid
        },
        interviewUrl: interviewUrl,
        channelName: channelName,
        userName: userName,
        interview: {
          id: interview._id,
          interviewId: interview.interviewId,
          jobTitle: (interview.jobId as any)?.title || 'Interview',
          date: interview.slot.date,
          duration: interview.slot.duration,
          applicationId: interview.applicationId
        }
      });

    } catch (agoraError: any) {
      console.error('Agora error:', agoraError);
      return NextResponse.json({ 
        error: 'Failed to generate video credentials',
        details: agoraError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error joining interview:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

