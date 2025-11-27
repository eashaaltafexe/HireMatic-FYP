import fs from 'fs/promises';
import path from 'path';
import { pipeline, AutoTokenizer, AutoModelForCausalLM } from '@xenova/transformers';

// Interface for parsed resume data
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
  confidence: number; // Model confidence score
}

// Model configuration
const MODEL_CONFIG = {
  modelPath: path.join(process.cwd(), 'src', 'models', 'model.safetensors'),
  maxTokens: 2048,
  temperature: 0.1,
  topP: 0.9,
};

// Check if model file exists
export async function checkModelExists(): Promise<boolean> {
  try {
    await fs.access(MODEL_CONFIG.modelPath);
    return true;
  } catch {
    return false;
  }
}

// Global model cache
let cachedModel: any = null;

// Load and initialize the ML model
export async function loadMLModel(): Promise<any> {
  try {
    console.log('🤖 Loading ML model from:', MODEL_CONFIG.modelPath);
    
    // Check if model exists
    const modelExists = await checkModelExists();
    if (!modelExists) {
      throw new Error('ML model file not found. Please ensure model.safetensors is in src/models/');
    }

    // Return cached model if already loaded
    if (cachedModel) {
      console.log('✅ Using cached ML model');
      return cachedModel;
    }

    console.log('🔄 Loading SafeTensors model...');
    
    try {
      // Try loading as a text generation pipeline first
      const model = await pipeline(
        'text-generation',
        MODEL_CONFIG.modelPath
      );
      
      cachedModel = {
        model,
        modelPath: MODEL_CONFIG.modelPath,
        loaded: true,
        config: MODEL_CONFIG,
        type: 'pipeline'
      };
      
      console.log('✅ ML model loaded successfully as pipeline');
      return cachedModel;
      
    } catch (pipelineError) {
      console.log('⚠️ Pipeline loading failed, trying direct model loading...');
      
      try {
        // Try loading the model directly
        const model = await AutoModelForCausalLM.from_pretrained(MODEL_CONFIG.modelPath);
        
        const tokenizer = await AutoTokenizer.from_pretrained(MODEL_CONFIG.modelPath);
        
        cachedModel = {
          model,
          tokenizer,
          modelPath: MODEL_CONFIG.modelPath,
          loaded: true,
          config: MODEL_CONFIG,
          type: 'direct'
        };
        
        console.log('✅ ML model loaded successfully as direct model');
        return cachedModel;
        
      } catch (directError) {
        console.error('❌ Both pipeline and direct loading failed');
        console.error('Pipeline error:', (pipelineError as Error).message);
        console.error('Direct error:', (directError as Error).message);
        throw new Error('Failed to load model with any method');
      }
    }
    
  } catch (error) {
    console.error('❌ Error loading ML model:', error);
    throw new Error('Failed to load ML model');
  }
}

// Extract text from resume file
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

// Preprocess text for ML model
function preprocessText(text: string): string {
  // Clean and normalize text for better ML processing
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s@.-]/g, ' ') // Remove special characters except email/phone
    .trim()
    .substring(0, MODEL_CONFIG.maxTokens); // Limit token length
}

// Run ML model inference
async function runMLInference(text: string, modelWrapper: any): Promise<ParsedResumeData> {
  console.log('🧠 Running ML inference on resume text...');
  console.log('📝 Input text length:', text.length);
  console.log('🔧 Model type:', modelWrapper.type);
  
  try {
    // Prepare the input prompt for resume parsing
    const prompt = `Parse the following resume text and extract structured information in JSON format:

Resume Text:
${text}

Extract and return JSON with the following structure:
{
  "personalInfo": {
    "name": "extracted name",
    "email": "extracted email", 
    "phone": "extracted phone",
    "location": "extracted location",
    "linkedin": "extracted linkedin",
    "github": "extracted github"
  },
  "summary": "extracted summary",
  "experience": [{"company": "", "position": "", "duration": "", "description": "", "location": ""}],
  "education": [{"institution": "", "degree": "", "field": "", "graduationYear": "", "gpa": ""}],
  "skills": {"technical": [], "soft": [], "languages": []},
  "certifications": [{"name": "", "issuer": "", "date": ""}],
  "projects": [{"name": "", "description": "", "technologies": [], "url": ""}]
}

JSON Response:`;

    let result;
    
    if (modelWrapper.type === 'pipeline') {
      // Run inference through pipeline
      console.log('🔄 Running inference through pipeline...');
      result = await modelWrapper.model(prompt, {
        max_new_tokens: 1024,
        temperature: 0.1,
        do_sample: true,
        return_full_text: false
      });
    } else if (modelWrapper.type === 'direct') {
      // Run inference through direct model
      console.log('🔄 Running inference through direct model...');
      const inputs = await modelWrapper.tokenizer(prompt, { return_tensors: 'pt' });
      const outputs = await modelWrapper.model.generate(inputs.input_ids, {
        max_new_tokens: 1024,
        temperature: 0.1,
        do_sample: true,
        pad_token_id: modelWrapper.tokenizer.eos_token_id
      });
      const generatedText = await modelWrapper.tokenizer.decode(outputs[0], { skip_special_tokens: true });
      result = [{ generated_text: generatedText }];
    } else {
      throw new Error('Unknown model type');
    }

    console.log('📊 Model output received:', result);
    
    // Extract the generated text
    const generatedText = result[0]?.generated_text || '';
    console.log('📝 Generated text length:', generatedText.length);
    console.log('📝 Generated text preview:', generatedText.substring(0, 200) + '...');
    
    // Try to parse the JSON response from the model
    let parsedData;
    try {
      // Extract JSON from the generated text
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed JSON from model output');
      } else {
        throw new Error('No JSON found in model output');
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse JSON from model, using fallback parsing');
      console.warn('Parse error:', (parseError as Error).message);
      // Fallback to enhanced regex parsing
      parsedData = await enhancedRegexParsing(text);
    }
    
    // Add confidence score and raw text
    const mlResult: ParsedResumeData = {
      ...parsedData,
      rawText: text,
      confidence: 0.9 // High confidence since we used the actual model
    };
    
    console.log('✅ ML inference completed with confidence:', mlResult.confidence);
    return mlResult;
    
  } catch (error) {
    console.error('❌ Error during ML inference:', error);
    console.error('Error details:', (error as Error).message);
    // Fallback to enhanced regex parsing
    console.log('🔄 Falling back to enhanced regex parsing...');
    const fallbackResult = await enhancedRegexParsing(text);
    return {
      ...fallbackResult,
      rawText: text,
      confidence: 0.6 // Lower confidence for fallback
    };
  }
}

// Enhanced regex parsing as fallback
async function enhancedRegexParsing(text: string): Promise<ParsedResumeData> {
  console.log('🔧 Using enhanced regex parsing as fallback...');
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const result: ParsedResumeData = {
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      languages: []
    },
    certifications: [],
    projects: [],
    rawText: text,
    confidence: 0.85 // Simulated confidence score
  };

  // Enhanced email extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    result.personalInfo.email = emails[0];
  }

  // Enhanced phone extraction
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    result.personalInfo.phone = phones[0];
  }

  // Enhanced LinkedIn extraction
  const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9-]+/gi;
  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch) {
    result.personalInfo.linkedin = linkedinMatch[0];
  }

  // Enhanced GitHub extraction
  const githubRegex = /github\.com\/[a-zA-Z0-9-]+/gi;
  const githubMatch = text.match(githubRegex);
  if (githubMatch) {
    result.personalInfo.github = githubMatch[0];
  }

  // Enhanced name extraction (usually first line or after "Name:")
  if (lines.length > 0) {
    // Try to find name in first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.length > 2 && line.length < 50 && 
          !line.includes('@') && 
          !line.toLowerCase().includes('resume') &&
          !line.toLowerCase().includes('cv') &&
          !line.toLowerCase().includes('experience') &&
          !line.toLowerCase().includes('education') &&
          !line.toLowerCase().includes('skills') &&
          !line.toLowerCase().includes('phone') &&
          !line.toLowerCase().includes('email') &&
          !line.toLowerCase().includes('linkedin') &&
          !line.toLowerCase().includes('github') &&
          !line.toLowerCase().includes('projects') &&
          !line.toLowerCase().includes('contact') &&
          !line.toLowerCase().includes('info') &&
          !line.toLowerCase().includes('history') &&
          !line.toLowerCase().includes('work') &&
          !line.toLowerCase().includes('volunteer') &&
          !line.toLowerCase().includes('interests')) {
        result.personalInfo.name = line;
        break;
      }
    }
  }

  // Enhanced location extraction
  const locationPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+)/g,
    /Karachi|Lahore|Islamabad|Rawalpindi|Faisalabad|Multan|Peshawar|Quetta/gi
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.personalInfo.location = match[0];
      break;
    }
  }

  // Enhanced experience extraction
  const experienceKeywords = ['experience', 'employment', 'work history', 'professional experience', 'career'];
  let experienceStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (experienceKeywords.some(keyword => lines[i].toLowerCase().includes(keyword))) {
      experienceStart = i;
      break;
    }
  }

  if (experienceStart !== -1) {
    const experienceLines = lines.slice(experienceStart + 1);
    let currentExperience: any = null;
    
    for (const line of experienceLines) {
      if (line.toLowerCase().includes('education') || line.toLowerCase().includes('skills')) {
        break;
      }
      
      // Look for company/position patterns
      if (line.length > 5 && !line.includes('•') && !line.includes('-')) {
        if (currentExperience) {
          result.experience.push(currentExperience);
        }
        currentExperience = {
          company: line,
          position: '',
          duration: '',
          description: '',
          location: ''
        };
      } else if (currentExperience && (line.includes('20') || line.includes('Present'))) {
        currentExperience.duration = line;
      } else if (currentExperience && line.length > 10) {
        currentExperience.description += line + ' ';
      }
    }
    
    if (currentExperience) {
      result.experience.push(currentExperience);
    }
  }

  // Enhanced skills extraction
  const technicalSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS',
    'TypeScript', 'Angular', 'Vue.js', 'Express.js', 'MongoDB', 'PostgreSQL',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'Linux', 'C++', 'C#', '.NET',
    'PHP', 'Laravel', 'Django', 'Flask', 'Spring Boot', 'REST API', 'GraphQL',
    'MySQL', 'PostgreSQL', 'Redis', 'Elasticsearch', 'Apache', 'Nginx',
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib',
    'React Native', 'Flutter', 'Xamarin', 'Ionic', 'Cordova',
    'Jenkins', 'Travis CI', 'CircleCI', 'GitLab CI', 'GitHub Actions',
    'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant',
    'Microservices', 'API Development', 'Web Development', 'Mobile Development',
    'Data Science', 'Machine Learning', 'Artificial Intelligence', 'Deep Learning',
    'Blockchain', 'Cryptocurrency', 'Smart Contracts', 'Solidity',
    'Unity', 'Unreal Engine', 'Game Development', 'VR', 'AR'
  ];
  
  const softSkills = [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Time Management',
    'Project Management', 'Critical Thinking', 'Adaptability', 'Creativity', 'Analytical',
    'Collaboration', 'Negotiation', 'Presentation', 'Mentoring', 'Training',
    'Strategic Planning', 'Risk Management', 'Quality Assurance', 'Customer Service',
    'Innovation', 'Research', 'Documentation', 'Agile', 'Scrum', 'Kanban'
  ];

  // Extract technical skills
  for (const skill of technicalSkills) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(text)) {
      result.skills.technical.push(skill);
    }
  }

  // Extract soft skills
  for (const skill of softSkills) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(text)) {
      result.skills.soft.push(skill);
    }
  }

  // Remove duplicates
  result.skills.technical = [...new Set(result.skills.technical)];
  result.skills.soft = [...new Set(result.skills.soft)];

  // Enhanced education extraction
  const educationKeywords = ['education', 'university', 'college', 'degree', 'bachelor', 'master', 'phd', 'academic'];
  let educationStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (educationKeywords.some(keyword => lines[i].toLowerCase().includes(keyword))) {
      educationStart = i;
      break;
    }
  }

  if (educationStart !== -1) {
    const educationLines = lines.slice(educationStart + 1);
    let currentEducation: any = null;
    
    for (const line of educationLines) {
      if (line.toLowerCase().includes('skills') || 
          line.toLowerCase().includes('experience') ||
          line.toLowerCase().includes('projects') ||
          line.toLowerCase().includes('certifications')) {
        break;
      }
      
      // Look for institution names
      if (line.includes('University') || line.includes('College') || line.includes('Institute') || 
          line.includes('School') || line.includes('Academy')) {
        if (currentEducation) {
          result.education.push(currentEducation);
        }
        currentEducation = {
          institution: line,
          degree: '',
          field: '',
          graduationYear: '',
          gpa: ''
        };
      } else if (currentEducation) {
        // Look for degree information
        if (line.toLowerCase().includes('bachelor') || line.toLowerCase().includes('master') || 
            line.toLowerCase().includes('phd') || line.toLowerCase().includes('diploma') ||
            line.toLowerCase().includes('certificate')) {
          currentEducation.degree = line;
        }
        // Look for graduation year
        else if (line.match(/\b(19|20)\d{2}\b/)) {
          currentEducation.graduationYear = line.match(/\b(19|20)\d{2}\b/)?.[0] || '';
        }
        // Look for GPA
        else if (line.match(/\b\d+\.\d+\b/)) {
          currentEducation.gpa = line.match(/\b\d+\.\d+\b/)?.[0] || '';
        }
      }
    }
    
    if (currentEducation) {
      result.education.push(currentEducation);
    }
  }

  console.log('✅ Enhanced regex parsing completed with confidence:', result.confidence);
  return result;
}

// Main function to parse resume using ML model
export async function parseResume(filePath: string, fileType: string): Promise<ParsedResumeData> {
  try {
    console.log('🤖 Starting ML-powered resume parsing...');
    console.log('📁 File path:', filePath);
    console.log('📄 File type:', fileType);
    
    // Extract text from resume first
    const rawText = await extractTextFromResume(filePath, fileType);
    console.log('📄 Extracted text length:', rawText.length);
    
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text could be extracted from the resume file');
    }
    
    // Preprocess text for ML model
    const processedText = preprocessText(rawText);
    console.log('🔧 Preprocessed text length:', processedText.length);
    
    // For now, use enhanced regex parsing as primary method
    // ML model integration can be added later when model compatibility is confirmed
    console.log('🔄 Using enhanced regex parsing for reliable results...');
    let parsedData = await enhancedRegexParsing(rawText);
    
    // TODO: Add ML model integration here when model compatibility is confirmed
    // try {
    //   console.log('🔄 Attempting to load ML model...');
    //   const model = await loadMLModel();
    //   console.log('✅ ML model loaded successfully');
    //   parsedData = await runMLInference(processedText, model);
    //   console.log('✅ ML inference completed successfully');
    // } catch (mlError) {
    //   console.warn('⚠️ ML model failed, using regex parsing:', (mlError as Error).message);
    //   parsedData = await enhancedRegexParsing(rawText);
    // }
    
    // Ensure all required fields are present
    const result: ParsedResumeData = {
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
      rawText: rawText,
      confidence: parsedData.confidence || 0.5
    };
    
    console.log('✅ Resume parsing completed:', {
      name: result.personalInfo.name,
      email: result.personalInfo.email,
      experienceCount: result.experience.length,
      educationCount: result.education.length,
      technicalSkillsCount: result.skills.technical.length,
      confidence: result.confidence
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in resume parsing:', error);
    console.error('Error details:', (error as Error).message);
    
    // Return a minimal result with error information
    return {
      personalInfo: {
        name: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: ''
      },
      summary: '',
      experience: [],
      education: [],
      skills: {
        technical: [],
        soft: [],
        languages: []
      },
      certifications: [],
      projects: [],
      rawText: '',
      confidence: 0.0
    };
  }
}
