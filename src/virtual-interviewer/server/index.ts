import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { setupTranscribeWebSocket } from './transcribeWs';
import GeminiInterviewerService from '../services/geminiService';
import LocalStorageService from '../services/localStorageService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({ dest: path.join(__dirname, '../temp/uploads/') });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve recordings directory
app.use('/recordings', express.static(path.join(__dirname, '../recordings')));

// Store active interview sessions
const interviewSessions = new Map<string, GeminiInterviewerService>();

// Initialize local storage service
const localStorageService = new LocalStorageService();

/**
 * API Routes
 */

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Virtual Interviewer Server Running',
    timestamp: new Date().toISOString(),
    activeSessions: interviewSessions.size
  });
});

// Get all recordings
app.get('/api/recordings', (req, res) => {
  try {
    const recordings = localStorageService.getAllRecordings();
    res.json({ 
      success: true,
      count: recordings.length,
      recordings: recordings.map(r => ({
        fileName: r.fileName,
        size: r.size,
        createdAt: r.createdAt,
        url: `/recordings/${r.fileName}`
      }))
    });
  } catch (error: any) {
    console.error('[Recording] List error:', error);
    res.status(500).json({ 
      error: 'Failed to list recordings',
      details: error.message 
    });
  }
});

// Delete a recording
app.delete('/api/recordings/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const deleted = localStorageService.deleteRecording(fileName);
    
    if (deleted) {
      res.json({ 
        success: true,
        message: 'Recording deleted successfully'
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'Recording not found'
      });
    }
  } catch (error: any) {
    console.error('[Recording] Delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete recording',
      details: error.message 
    });
  }
});

// Initialize a new interview session
app.post('/api/interview/init', async (req, res) => {
  try {
    const { sessionId, jobTitle, candidateName, questions } = req.body;

    if (!sessionId || !jobTitle || !questions) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, jobTitle, questions' 
      });
    }

    const geminiService = new GeminiInterviewerService();
    const initResult = await geminiService.initializeInterview(
      jobTitle, 
      candidateName || 'Candidate', 
      questions
    );

    interviewSessions.set(sessionId, geminiService);

    res.json({ 
      success: true, 
      message: 'Interview session initialized',
      sessionId,
      greeting: initResult.greeting
    });
  } catch (error: any) {
    console.error('[API] Error initializing interview:', error);
    res.status(500).json({ 
      error: 'Failed to initialize interview',
      details: error.message 
    });
  }
});

// Process an answer with Gemini AI
app.post('/api/interview/process-answer', async (req, res) => {
  try {
    const { sessionId, questionText, answer, questionNumber } = req.body;

    if (!sessionId || !questionText || !answer) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, questionText, answer' 
      });
    }

    const geminiService = interviewSessions.get(sessionId);
    if (!geminiService) {
      return res.status(404).json({ 
        error: 'Interview session not found. Please initialize first.' 
      });
    }

    const feedback = await geminiService.processAnswer(
      questionText, 
      answer, 
      questionNumber || 1
    );

    res.json({ 
      success: true, 
      feedback 
    });
  } catch (error: any) {
    console.error('[API] Error processing answer:', error);
    res.status(500).json({ 
      error: 'Failed to process answer',
      details: error.message 
    });
  }
});

// Get next interviewer response (conversational flow)
app.post('/api/interview/next-response', async (req, res) => {
  try {
    const { sessionId, candidateAnswer } = req.body;

    if (!sessionId || !candidateAnswer) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, candidateAnswer' 
      });
    }

    const geminiService = interviewSessions.get(sessionId);
    if (!geminiService) {
      return res.status(404).json({ 
        error: 'Interview session not found. Please initialize first.' 
      });
    }

    const result = await geminiService.getNextResponse(candidateAnswer);

    res.json({ 
      success: true, 
      ...result
    });
  } catch (error: any) {
    console.error('[API] Error getting next response:', error);
    res.status(500).json({ 
      error: 'Failed to get next response',
      details: error.message 
    });
  }
});

// Analyze answer quality
app.post('/api/interview/analyze-answer', async (req, res) => {
  try {
    const { sessionId, questionText, answer } = req.body;

    const geminiService = interviewSessions.get(sessionId);
    if (!geminiService) {
      return res.status(404).json({ 
        error: 'Interview session not found' 
      });
    }

    const analysis = await geminiService.analyzeAnswer(questionText, answer);

    res.json({ 
      success: true, 
      analysis 
    });
  } catch (error: any) {
    console.error('[API] Error analyzing answer:', error);
    res.status(500).json({ 
      error: 'Failed to analyze answer',
      details: error.message 
    });
  }
});

// Generate interview summary
app.post('/api/interview/summary', async (req, res) => {
  try {
    const { sessionId, transcript } = req.body;

    const geminiService = interviewSessions.get(sessionId);
    if (!geminiService) {
      return res.status(404).json({ 
        error: 'Interview session not found' 
      });
    }

    const summary = await geminiService.generateInterviewSummary(transcript);

    // Cleanup session
    interviewSessions.delete(sessionId);

    res.json({ 
      success: true, 
      summary 
    });
  } catch (error: any) {
    console.error('[API] Error generating summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      details: error.message 
    });
  }
});

// Test Gemini API connection
app.get('/api/test-gemini', async (req, res) => {
  try {
    const geminiService = new GeminiInterviewerService();
    await geminiService.initializeInterview(
      'Software Engineer',
      'Test Candidate',
      [{ id: 1, text: 'Tell me about yourself' }]
    );

    res.json({ 
      success: true, 
      message: 'Gemini API connection successful!' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: 'Gemini API connection failed',
      details: error.message 
    });
  }
});

// Generate Agora token for video call
app.post('/api/agora/token', async (req, res) => {
  try {
    const { channelName, uid, role } = req.body;

    if (!channelName) {
      return res.status(400).json({ 
        error: 'Channel name is required' 
      });
    }

    const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || 'ed29fd24322948eeb653746119ce7183';
    const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'f1cbab9561764bf8b3fc9b2ad44be158';

    // Check if certificate is configured
    if (!AGORA_APP_CERTIFICATE) {
      return res.json({ 
        success: true,
        token: null,
        channel: channelName,
        uid: uid || 0,
        appId: AGORA_APP_ID,
        message: 'No certificate configured - using null token (testing mode)'
      });
    }

    // Generate RTC token with agora-access-token
    const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
    
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    const uidNumber = uid || 0;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uidNumber,
      role === 'audience' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER,
      privilegeExpiredTs
    );
    
    console.log(`[Agora Token] Generated for channel: ${channelName}, uid: ${uidNumber}`);
    
    res.json({ 
      success: true,
      token,
      channel: channelName,
      uid: uidNumber,
      appId: AGORA_APP_ID,
      expiresAt: privilegeExpiredTs
    });
  } catch (error: any) {
    console.error('[API] Error generating Agora token:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      details: error.message 
    });
  }
});

// Start recording
// Upload browser recording
app.post('/api/recording/upload-browser', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { channelName } = req.body;
    const filePath = req.file.path;
    const fileName = `${channelName || 'interview'}_${Date.now()}.webm`;

    console.log(`[Recording] Saving browser recording locally: ${fileName}`);

    // Save to local storage instead of Google Drive
    const result = await localStorageService.saveRecording(filePath, fileName);

    // Clean up uploaded file from temp folder
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Recording] Cleaned up temp file: ${filePath}`);
    }

    console.log(`[Recording] ✅ Recording saved successfully: ${result.savedPath}`);

    res.json({
      success: true,
      message: 'Recording saved successfully',
      savedPath: result.savedPath,
      url: result.url
    });
  } catch (error: any) {
    console.error('[Recording] Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to save recording',
      details: error.message 
    });
  }
});

// Create HTTP server
const httpServer = createServer(app);

// Setup WebSocket for transcription
setupTranscribeWebSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🎙️  Virtual Interviewer Server Started     ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║   📡 Server:      http://localhost:${PORT}       ║`);
  console.log(`║   🔌 WebSocket:   ws://localhost:${PORT}/ws    ║`);
  console.log('║   🤖 AI Engine:   Gemini Pro                  ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║   Available Endpoints:                        ║');
  console.log('║   GET  /api/health                            ║');
  console.log('║   GET  /api/test-gemini                       ║');
  console.log('║   POST /api/interview/init                    ║');
  console.log('║   POST /api/interview/next-response           ║');
  console.log('║   POST /api/interview/process-answer          ║');
  console.log('║   POST /api/interview/analyze-answer          ║');
  console.log('║   POST /api/interview/summary                 ║');
  console.log('║   POST /api/recording/start                   ║');
  console.log('║   POST /api/recording/stop                    ║');
  console.log('║   GET  /api/recording/status/:channelName     ║');
  console.log('╚════════════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
