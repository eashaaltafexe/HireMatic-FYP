import { ParsedResumeData } from '@/services/resumeParser';

export interface ScreeningResult {
  isShortlisted: boolean;
  score: number;
  reasoning: string;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: number; // 0-100
  educationMatch: number; // 0-100
  overallFit: number; // 0-100
  mlConfidence?: number; // ML model confidence score
  parsingMethod: 'ml'; // Using ML parsing method
}

export interface JobRequirements {
  requiredSkills: string[];
  preferredSkills: string[];
  minimumExperience: number; // years
  educationLevel: string;
  department: string;
}

/**
 * Demo AI Resume Screening Function
 * This is a simplified version that will be replaced with your Colab model later
 */
export async function screenResumeWithAI(
  resumeData: ParsedResumeData,
  jobRequirements: JobRequirements
): Promise<ScreeningResult> {
  console.log('🤖 AI Screening: Starting resume analysis...');
  
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Extract candidate skills (case-insensitive)
  const candidateSkills = [
    ...resumeData.skills.technical,
    ...resumeData.skills.soft,
    ...resumeData.skills.languages
  ].map(skill => skill.toLowerCase());
  
  // Check skill matches
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
  
  // Calculate experience match
  const candidateExperience = resumeData.experience.length;
  const experienceMatch = Math.min(100, (candidateExperience / jobRequirements.minimumExperience) * 100);
  
  // Calculate education match (simplified)
  const educationMatch = resumeData.education.length > 0 ? 85 : 60;
  
  // Calculate skill match percentage
  const skillMatchPercentage = (matchedRequired.length / requiredSkillsLower.length) * 100;
  const preferredSkillBonus = (matchedPreferred.length / preferredSkillsLower.length) * 20;
  
  // Calculate overall fit
  const overallFit = Math.min(100, 
    (skillMatchPercentage * 0.5) + 
    (experienceMatch * 0.3) + 
    (educationMatch * 0.2) + 
    preferredSkillBonus
  );
  
  // Determine if candidate should be shortlisted
  const isShortlisted = overallFit >= 70 && matchedRequired.length >= Math.ceil(requiredSkillsLower.length * 0.6);
  
  // Get ML confidence from parsed data
  const mlConfidence = resumeData.confidence;
  const parsingMethod: 'ml' = 'ml';

  const result: ScreeningResult = {
    isShortlisted,
    score: Math.round(overallFit),
    reasoning: generateReasoning(isShortlisted, matchedRequired, missingRequired, experienceMatch, educationMatch),
    matchedSkills: [...matchedRequired, ...matchedPreferred],
    missingSkills: missingRequired,
    experienceMatch: Math.round(experienceMatch),
    educationMatch: Math.round(educationMatch),
    overallFit: Math.round(overallFit),
    mlConfidence,
    parsingMethod
  };
  
  console.log('🤖 AI Screening Result:', {
    candidate: resumeData.personalInfo.name,
    shortlisted: isShortlisted,
    score: result.score,
    matchedSkills: result.matchedSkills.length,
    missingSkills: result.missingSkills.length,
    parsingMethod: result.parsingMethod,
    mlConfidence: result.mlConfidence
  });
  
  return result;
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

/**
 * Get job requirements from job posting
 * This would typically fetch from the Job model
 */
export async function getJobRequirements(jobId: string): Promise<JobRequirements> {
  // This is a demo implementation
  // In production, you would fetch actual job requirements from the database
  return {
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    preferredSkills: ['TypeScript', 'Next.js', 'AWS', 'Docker'],
    minimumExperience: 2,
    educationLevel: 'Bachelor',
    department: 'Engineering'
  };
}
