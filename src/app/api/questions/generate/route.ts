import { NextRequest, NextResponse } from 'next/server';
import { storeGeneratedQuestions } from '@/layers/2-business-logic/ai-services/autoQuestionGenerator';

/**
 * API Route to generate interview questions using GPT-2 model
 * POST /api/questions/generate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, num_questions = 10, applicationId } = body;

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      );
    }

    // Call the Python FastAPI service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}/generate-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        num_questions: Math.min(Math.max(num_questions, 10), 15), // Clamp between 10-15
      }),
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { success: false, error: data.error },
        { status: 500 }
      );
    }

    // If applicationId is provided, store the questions in the database
    if (applicationId && data.questions && data.questions.length > 0) {
      console.log(`Storing ${data.questions.length} questions for application ${applicationId}`);
      
      const questionsToStore = data.questions.map((q: any, index: number) => ({
        id: index + 1,
        text: q.text,
        type: q.type || 'technical',
        difficulty: q.difficulty || 'medium',
        jobField: role,
        generatedAt: new Date()
      }));

      const stored = await storeGeneratedQuestions(applicationId, questionsToStore);
      
      if (stored) {
        console.log(`✅ Successfully stored questions for application ${applicationId}`);
      } else {
        console.warn(`⚠️ Failed to store questions for application ${applicationId}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        role: data.role,
        questions: data.questions,
        count: data.count,
      },
    });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate questions',
        details: 'Make sure the Python service is running on port 8000'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch generated questions for shortlisted candidates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role parameter is required' },
        { status: 400 }
      );
    }

    // Call the Python FastAPI service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}/generate-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        num_questions: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        role: data.role,
        questions: data.questions,
        count: data.count,
      },
    });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch questions',
        details: 'Make sure the Python service is running on port 8000'
      },
      { status: 500 }
    );
  }
}
