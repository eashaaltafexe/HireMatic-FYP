import fs from 'fs/promises';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ParsedResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
    location?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationYear: string;
    gpa?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  rawText: string;
  confidence: number;
}

async function extractTextFromResume(filePath: string, fileType: string): Promise<string> {
  const extension = fileType.toLowerCase();
  switch (extension) {
    case 'pdf': {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      return pdfData.text;
    }
    case 'doc':
    case 'docx':
      const mammoth = (await import('mammoth')).default;
      const docResult = await mammoth.extractRawText({ path: filePath });
      return docResult.value;
    case 'txt':
      return await fs.readFile(filePath, 'utf-8');
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function parseResumeWithGemini(resumeText: string): Promise<ParsedResumeData> {
  console.log('🤖 Gemini AI: Parsing resume with expert AI...');
  console.log('📝 Resume text length:', resumeText.length);

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not configured');
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const prompt = `You are an expert resume parser with years of experience in HR and recruitment. Analyze the following resume text and extract ALL information in a structured JSON format. Be thorough and accurate.

RESUME TEXT:
${resumeText}

INSTRUCTIONS:
1. Extract personal information (name, email, phone, location, LinkedIn, GitHub, website)
2. Create a professional summary if one exists
3. List ALL work experience with company, position, duration, and detailed description
4. List ALL education with institution, degree, field, graduation year, and GPA if mentioned
5. Categorize skills into technical, soft skills, and languages
6. List certifications with name, issuer, and date
7. List projects with name, description, technologies used, and URL if available

IMPORTANT: Return ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, Country",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "website": "website.com"
  },
  "summary": "Professional summary from resume",
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "duration": "Jan 2020 - Present",
      "description": "Detailed job responsibilities and achievements",
      "location": "City, Country"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "graduationYear": "2020",
      "gpa": "3.8"
    }
  ],
  "skills": {
    "technical": ["JavaScript", "Python", "React", "Node.js"],
    "soft": ["Leadership", "Communication", "Problem Solving"],
    "languages": ["English", "Spanish"]
  },
  "certifications": [
    {
      "name": "AWS Certified Developer",
      "issuer": "Amazon Web Services",
      "date": "2023"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description and impact",
      "technologies": ["React", "Node.js", "MongoDB"],
      "url": "github.com/user/project"
    }
  ]
}

Return ONLY the JSON object, nothing else.`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    }
  };

  console.log('📤 Sending request to Gemini AI...');
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('📥 Received response from Gemini AI');

  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!generatedText) {
    console.error('❌ No text in Gemini response');
    throw new Error('No response from Gemini AI');
  }

  console.log('📝 Gemini response length:', generatedText.length);

  let cleanedText = generatedText.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/```\n?/g, '');
  }

  const parsedData = JSON.parse(cleanedText);
  console.log('✅ Successfully parsed JSON from Gemini AI');

  return {
    personalInfo: {
      name: parsedData.personalInfo?.name || '',
      email: parsedData.personalInfo?.email || '',
      phone: parsedData.personalInfo?.phone || '',
      location: parsedData.personalInfo?.location || '',
      linkedin: parsedData.personalInfo?.linkedin || '',
      github: parsedData.personalInfo?.github || '',
      website: parsedData.personalInfo?.website || ''
    },
    summary: parsedData.summary || '',
    experience: parsedData.experience || [],
    education: parsedData.education || [],
    skills: {
      technical: parsedData.skills?.technical || [],
      soft: parsedData.skills?.soft || [],
      languages: parsedData.skills?.languages || []
    },
    certifications: parsedData.certifications || [],
    projects: parsedData.projects || [],
    rawText: resumeText,
    confidence: 0.95
  };
}

export async function parseResume(filePath: string, fileType: string): Promise<ParsedResumeData> {
  console.log('📄 Starting resume parsing...');
  console.log('📁 File path:', filePath);
  console.log('📄 File type:', fileType);
  
  const rawText = await extractTextFromResume(filePath, fileType);
  console.log('📄 Extracted text length:', rawText.length);
  
  if (!rawText || rawText.trim().length === 0) {
    throw new Error('No text could be extracted from the resume file');
  }

  const geminiResult = await parseResumeWithGemini(rawText);
  console.log('✅ Resume parsed successfully with Gemini AI:', {
    name: geminiResult.personalInfo.name,
    email: geminiResult.personalInfo.email,
    experienceCount: geminiResult.experience.length,
    educationCount: geminiResult.education.length,
    technicalSkillsCount: geminiResult.skills.technical.length,
    confidence: geminiResult.confidence
  });
  return geminiResult;
}
