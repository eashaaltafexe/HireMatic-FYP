import { ParsedResumeData } from './geminiResumeParser';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ScreeningResult {
  isShortlisted: boolean;
  score: number;
  reasoning: string;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: number;
  educationMatch: number;
  overallFit: number;
  mlConfidence?: number;
  parsingMethod: 'gemini-ai';
}

export interface JobRequirements {
  requiredSkills: string[];
  preferredSkills: string[];
  minimumExperience: number;
  educationLevel: string;
  department: string;
  jobTitle?: string;
  jobDescription?: string;
}

export async function screenResumeWithAI(
  resumeData: ParsedResumeData,
  jobRequirements: JobRequirements
): Promise<ScreeningResult> {
  console.log('🤖 AI Screening: Starting Gemini-powered resume analysis...');
  
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not configured, using basic screening');
    return basicScreening(resumeData, jobRequirements);
  }

  try {
    const prompt = `You are an expert HR recruiter and technical screening specialist with deep knowledge of different job domains and skill requirements. You must perform STRICT skill matching and domain alignment.

CANDIDATE RESUME:
Name: ${resumeData.personalInfo.name}
Email: ${resumeData.personalInfo.email}
Location: ${resumeData.personalInfo.location}

Summary: ${resumeData.summary}

Experience:
${resumeData.experience.map(exp => `- ${exp.position} at ${exp.company} (${exp.duration}): ${exp.description}`).join('\n')}

Education:
${resumeData.education.map(edu => `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.graduationYear})`).join('\n')}

Technical Skills: ${resumeData.skills.technical.join(', ')}
Soft Skills: ${resumeData.skills.soft.join(', ')}
Languages: ${resumeData.skills.languages.join(', ')}

Certifications: ${resumeData.certifications.map(cert => cert.name).join(', ')}

Projects: ${resumeData.projects.map(proj => proj.name).join(', ')}

JOB REQUIREMENTS:
Position: ${jobRequirements.jobTitle || 'Not specified'}
Department: ${jobRequirements.department}
Required Skills: ${jobRequirements.requiredSkills.join(', ')}
Preferred Skills: ${jobRequirements.preferredSkills.join(', ')}
Minimum Experience: ${jobRequirements.minimumExperience} years
Education Level: ${jobRequirements.educationLevel}
Job Description: ${jobRequirements.jobDescription || 'Not provided'}

CRITICAL SCREENING RULES (MUST FOLLOW):

1. **DOMAIN ALIGNMENT** (Most Important):
   - Compare the job's domain/field with the candidate's expertise
   - Example: AI Engineer job requires AI/ML skills (TensorFlow, PyTorch, NLP, Computer Vision)
   - Example: Software Engineer (Web) requires web dev skills (React, Node.js, Angular, Vue.js)
   - Example: Data Scientist requires data skills (Python, R, SQL, Statistics, ML)
   - If the candidate's primary skills are from a DIFFERENT domain, they should NOT be shortlisted
   - A "Software Engineer" with only web development experience should score LOW for an "AI Engineer" role

2. **REQUIRED SKILLS MATCHING** (Strict):
   - Count how many REQUIRED skills the candidate has
   - Each missing required skill should reduce score by 15-20 points
   - If candidate is missing MORE THAN 50% of required skills → Automatically NOT shortlisted (score < 50)
   - Look for EXACT skill matches or very close equivalents (e.g., React.js = ReactJS)
   - Do NOT give credit for unrelated skills (e.g., HTML/CSS doesn't count for Machine Learning)

3. **EXPERIENCE RELEVANCE**:
   - Check if candidate's work experience is in the SAME domain as the job
   - Generic "Software Development" doesn't qualify for specialized roles (AI, Data Science, DevOps)
   - Candidate must have RELEVANT experience, not just total years
   - If experience is in a different field, score should be 30 or below

4. **SCORING GUIDELINES**:
   - 90-100: Perfect match, all required skills + preferred skills + relevant experience
   - 70-89: Good match, most required skills + some preferred skills + relevant experience
   - 50-69: Partial match, some required skills but missing key ones OR wrong domain
   - 30-49: Poor match, few required skills OR completely different domain
   - 0-29: No match, candidate is from entirely different field

5. **SHORTLISTING THRESHOLD**:
   - Score >= 70 → Shortlisted (ONLY if domain matches AND has most required skills)
   - Score < 70 → Rejected (Missing critical skills OR wrong domain)

EXAMPLES:
- AI Engineer job + Software Engineer (Web Dev) candidate → Score: 20-35 → NOT shortlisted
- AI Engineer job + ML Engineer with TensorFlow/PyTorch → Score: 80-95 → Shortlisted
- Frontend Developer job + Backend Developer → Score: 40-60 → NOT shortlisted
- Full Stack Developer job + Frontend Developer → Score: 65-80 → May be shortlisted if has some backend

TASK:
1. First, identify the job's primary domain (AI/ML, Web Development, Data Science, DevOps, etc.)
2. Identify the candidate's primary domain based on their skills and experience
3. If domains DON'T match → Score should be 20-40 → NOT shortlisted
4. If domains match → Check required skills percentage match
5. Calculate final score based on domain match (40%), required skills (40%), experience (20%)
6. Be VERY STRICT - only shortlist candidates who truly fit the role

IMPORTANT: Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "isShortlisted": false,
  "score": 35,
  "reasoning": "Candidate is a Software Engineer with web development expertise (React, Node.js), but this AI Engineer role requires AI/ML skills (TensorFlow, PyTorch, NLP). Domain mismatch. Missing critical AI/ML skills.",
  "matchedSkills": ["Python", "Git"],
  "missingSkills": ["TensorFlow", "PyTorch", "NLP", "Computer Vision", "Machine Learning"],
  "experienceMatch": 30,
  "educationMatch": 70,
  "overallFit": 35
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
        temperature: 0.2,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1024,
      }
    };

    console.log('📤 Sending screening request to Gemini AI...');
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
    console.log('📥 Received screening response from Gemini AI');

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('❌ No text in Gemini response');
      throw new Error('No response from Gemini AI');
    }

    let cleanedText = generatedText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    const screeningData = JSON.parse(cleanedText);
    console.log('✅ Successfully parsed screening result from Gemini AI');

    const result: ScreeningResult = {
      isShortlisted: screeningData.isShortlisted || false,
      score: screeningData.score || 0,
      reasoning: screeningData.reasoning || 'No reasoning provided',
      matchedSkills: screeningData.matchedSkills || [],
      missingSkills: screeningData.missingSkills || [],
      experienceMatch: screeningData.experienceMatch || 0,
      educationMatch: screeningData.educationMatch || 0,
      overallFit: screeningData.overallFit || screeningData.score || 0,
      mlConfidence: resumeData.confidence,
      parsingMethod: 'gemini-ai'
    };

    console.log('🤖 AI Screening Result:', {
      candidate: resumeData.personalInfo.name,
      shortlisted: result.isShortlisted,
      score: result.score,
      matchedSkills: result.matchedSkills.length,
      missingSkills: result.missingSkills.length
    });

    return result;

  } catch (error) {
    console.error('❌ Gemini screening failed, falling back to basic screening:', error);
    return basicScreening(resumeData, jobRequirements);
  }
}

function basicScreening(
  resumeData: ParsedResumeData,
  jobRequirements: JobRequirements
): ScreeningResult {
  console.log('📊 Using basic screening algorithm...');
  
  const candidateSkills = [
    ...resumeData.skills.technical,
    ...resumeData.skills.soft,
    ...resumeData.skills.languages
  ].map(skill => skill.toLowerCase());
  
  const requiredSkillsLower = jobRequirements.requiredSkills.map(s => s.toLowerCase());
  const preferredSkillsLower = jobRequirements.preferredSkills.map(s => s.toLowerCase());
  
  const matchedRequired = requiredSkillsLower.filter(skill => 
    candidateSkills.some(candidateSkill => candidateSkill.includes(skill))
  );
  
  const matchedPreferred = preferredSkillsLower.filter(skill => 
    candidateSkills.some(candidateSkill => candidateSkill.includes(skill))
  );
  
  const missingRequired = requiredSkillsLower.filter(skill => 
    !candidateSkills.some(candidateSkill => candidateSkill.includes(skill))
  );
  
  const candidateExperience = resumeData.experience.length;
  const experienceMatch = Math.min(100, (candidateExperience / Math.max(jobRequirements.minimumExperience, 1)) * 100);
  
  const educationMatch = resumeData.education.length > 0 ? 85 : 60;
  
  const skillMatchPercentage = requiredSkillsLower.length > 0 
    ? (matchedRequired.length / requiredSkillsLower.length) * 100 
    : 50;
    
  const preferredSkillBonus = preferredSkillsLower.length > 0 
    ? (matchedPreferred.length / preferredSkillsLower.length) * 20 
    : 0;
  
  const baseScore = (skillMatchPercentage * 0.5) + (experienceMatch * 0.3) + (educationMatch * 0.2);
  const overallFit = Math.min(100, Math.max(0, baseScore + preferredSkillBonus));
  
  const minRequiredMatches = requiredSkillsLower.length > 0 ? Math.ceil(requiredSkillsLower.length * 0.6) : 0;
  const isShortlisted = overallFit >= 70 && (matchedRequired.length >= minRequiredMatches || requiredSkillsLower.length === 0);
  
  const validScore = isNaN(overallFit) ? 0 : Math.round(overallFit);
  const validExperienceMatch = isNaN(experienceMatch) ? 0 : Math.round(experienceMatch);
  const validEducationMatch = isNaN(educationMatch) ? 60 : Math.round(educationMatch);

  return {
    isShortlisted,
    score: validScore,
    reasoning: generateReasoning(isShortlisted, matchedRequired, missingRequired, validExperienceMatch, validEducationMatch),
    matchedSkills: [...matchedRequired, ...matchedPreferred],
    missingSkills: missingRequired,
    experienceMatch: validExperienceMatch,
    educationMatch: validEducationMatch,
    overallFit: validScore,
    mlConfidence: resumeData.confidence || 0,
    parsingMethod: 'gemini-ai'
  };
}

function generateReasoning(
  isShortlisted: boolean,
  matchedSkills: string[],
  missingSkills: string[],
  experienceMatch: number,
  educationMatch: number
): string {
  if (isShortlisted) {
    return `Candidate shortlisted based on strong skill alignment (${matchedSkills.length} matched skills), ` +
           `${experienceMatch.toFixed(0)}% experience match, and ${educationMatch.toFixed(0)}% education match. ` +
           `Shows good potential for the role.`;
  } else {
    const reasons = [];
    if (matchedSkills.length < 3) reasons.push('insufficient skill matches');
    if (experienceMatch < 50) reasons.push('limited relevant experience');
    if (missingSkills.length > 2) reasons.push(`missing key skills: ${missingSkills.slice(0, 3).join(', ')}`);
    
    return `Candidate not shortlisted due to: ${reasons.join(', ')}. ` +
           `Consider for future opportunities or suggest skill development.`;
  }
}

export async function getJobRequirements(jobId: string): Promise<JobRequirements> {
  try {
    const { Job } = await import('@/data-access');
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      console.warn(`Job ${jobId} not found, using default requirements`);
      return {
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        preferredSkills: ['TypeScript', 'Next.js', 'AWS', 'Docker'],
        minimumExperience: 2,
        educationLevel: 'Bachelor',
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        jobDescription: ''
      };
    }
    
    const allSkills = job.skills || [];
    const splitIndex = Math.ceil(allSkills.length * 0.7);
    const requiredSkills = allSkills.slice(0, splitIndex);
    const preferredSkills = allSkills.slice(splitIndex);
    
    const minimumExperience = job.experienceLevel?.match(/\d+/)?.[0] ? parseInt(job.experienceLevel.match(/\d+/)[0]) : 1;
    const educationLevel = 'Bachelor';
    const department = job.department || 'General';
    
    console.log(`📋 Job Requirements for ${job.title}:`, {
      requiredSkills: requiredSkills.length,
      preferredSkills: preferredSkills.length,
      minimumExperience,
      educationLevel,
      department
    });
    
    return {
      requiredSkills,
      preferredSkills,
      minimumExperience,
      educationLevel,
      department,
      jobTitle: job.title,
      jobDescription: job.description
    };
  } catch (error) {
    console.error('Error fetching job requirements:', error);
    return {
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      preferredSkills: ['TypeScript', 'Next.js', 'AWS', 'Docker'],
      minimumExperience: 2,
      educationLevel: 'Bachelor',
      department: 'Engineering',
      jobTitle: 'Software Engineer',
      jobDescription: ''
    };
  }
}
