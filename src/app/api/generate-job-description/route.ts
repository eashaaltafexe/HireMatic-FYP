import { NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, experienceLevel, skills, department } = body;

    // Build the prompt
    const prompt = `Write a concise, finalized job description (9-10 lines) for a '${title}' role in the ${department} department. 
    The candidate should have ${experienceLevel.toLowerCase()} level experience. 
    Required technical skills include: ${skills.join(', ')}.
    Focus on responsibilities, qualifications, and what makes this role unique.
    Avoid using placeholder text.`;

    // Build the payload for Gemini API
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    // Send request to Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const jobDescription = data.candidates[0].content.parts[0].text;

    return NextResponse.json({ jobDescription });
  } catch (error) {
    console.error('Error generating job description:', error);
    return NextResponse.json(
      { error: 'Failed to generate job description' },
      { status: 500 }
    );
  }
} 