/**
 * Chatbot API Route
 * POST /api/chatbot
 */
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getChatbotResponse } from '@/business-logic';
import ChatMessage from '@/data-access/models/ChatMessage';
import { connectDB } from '@/data-access';

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

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (optional - allow guest users too)
    const decoded = await verifyToken(request);
    const userId = decoded?.userId || 'guest';
    const userRole = decoded?.role || 'general';

    const body = await request.json();
    const { message, sessionId, conversationHistory } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('[Chatbot] Processing message from user:', userId, 'Role:', userRole);
    console.log('[Chatbot] Message:', message);
    console.log('[Chatbot] Session ID:', sessionId);

    // Get chatbot response from Gemini AI
    console.log('[Chatbot] Calling getChatbotResponse...');
    const chatbotResponse = await getChatbotResponse({
      userQuery: message,
      userRole: userRole as 'admin' | 'hr' | 'candidate' | 'general',
      conversationHistory: conversationHistory || []
    });
    console.log('[Chatbot] Response received from AI:', chatbotResponse.message.substring(0, 100));

    // Save to database if user is authenticated
    if (decoded && sessionId) {
      try {
        await connectDB();
        
        await ChatMessage.create({
          userId: userId,
          userRole: userRole,
          message: message,
          response: chatbotResponse.message,
          sessionId: sessionId,
          timestamp: new Date()
        });
        
        console.log('[Chatbot] Message saved to database');
      } catch (dbError) {
        console.error('[Chatbot] Error saving to database:', dbError);
        // Don't fail the request if DB save fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: chatbotResponse.message,
        confidence: chatbotResponse.confidence,
        suggestedActions: chatbotResponse.suggestedActions,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Chatbot] ❌ Error processing message:', error);
    console.error('[Chatbot] ❌ Error type:', typeof error);
    console.error('[Chatbot] ❌ Error details:', error instanceof Error ? error.message : JSON.stringify(error));
    console.error('[Chatbot] ❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error
      },
      { status: 500 }
    );
  }
}

// GET conversation history
export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectDB();

    const query: any = { userId: decoded.userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const messages = await ChatMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        count: messages.length
      }
    });

  } catch (error) {
    console.error('[Chatbot] Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation history' },
      { status: 500 }
    );
  }
}
