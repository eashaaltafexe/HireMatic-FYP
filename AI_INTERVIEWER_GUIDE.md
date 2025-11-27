# AI Interviewer Implementation Guide

## Overview
The AI Interviewer feature integrates an intelligent, voice-enabled interview bot into the HireMatic platform. It uses Gemini AI to conduct interviews with candidates, ask questions, evaluate answers, and provide real-time feedback.

## Architecture

### Components Created

1. **AI Interviewer Service** (`src/layers/2-business-logic/ai-services/aiInterviewer.ts`)
   - Manages interview flow and question sequencing
   - Detects candidate intent (answer, repeat, clarify)
   - Evaluates answers using Gemini AI
   - Provides transition feedback and final evaluation

2. **AI Interviewer Panel** (`src/components/AIInterviewerPanel.tsx`)
   - React component with voice recognition and TTS
   - Real-time transcript display
   - Progress tracking
   - Interview controls (record, submit, repeat)

3. **API Endpoints**
   - `/api/interviews/ai-interviewer` - Manages AI interview sessions
   - `/api/interviews/answers` - Saves interview responses to database

4. **Database Schema Update**
   - Added `interviewSession` field to Application model
   - Stores questions, answers, evaluations, and timestamps

## Features

### 1. Voice-Enabled Interview
- **Speech Recognition**: Web Speech API for voice input
- **Text-to-Speech**: Browser SpeechSynthesis API for AI responses
- **Voice Controls**: 
  - Start/stop recording button
  - Stop speaking button (interrupt AI)
  - Voice enable/disable toggle

### 2. Intelligent Question Flow
- **Sequential Questions**: Asks one question at a time
- **Wait for Answer**: Processes response before moving to next question
- **Repeat Capability**: Detects repeat requests and re-speaks question
- **Clarification**: Provides helpful clarification without giving answers
- **No Skipping**: Ensures all questions are asked

### 3. AI-Powered Evaluation
- **Real-time Scoring**: Each answer evaluated on 0-100 scale
- **Feedback Generation**: Constructive feedback for each response
- **Key Points Extraction**: Identifies main points in answers
- **Overall Assessment**: Final evaluation with average score

### 4. Interview Session Management
- **Progress Tracking**: Shows current question number and percentage
- **Session State**: Maintains conversation context
- **Auto-save**: Saves all answers to database on completion

## Implementation Details

### Environment Variables
```env
GEMINI_INTERVIEWER_API_KEY=AIzaSyBYnNfKbJS43Wdgiy68Mr8fSF9ICgbciFs
```

### Interview Page Layout
- **Left Side (2/3)**: Agora video call with interviewer
- **Right Side (1/3)**: AI Interviewer panel with questions

### Question Flow Logic
```
1. Initialize interview with generated questions
2. Speak welcome message + first question
3. Listen for candidate response
4. Detect intent:
   - "repeat" → Re-speak current question
   - "clarify" → Provide helpful explanation
   - Default → Evaluate as answer
5. If answer:
   - Evaluate with AI (score 0-100)
   - Store answer with evaluation
   - Move to next question
   - Speak transition + next question
6. Repeat until all questions answered
7. Calculate overall score
8. Save to database
```

### Voice Recognition Flow
```
User clicks "Start Recording"
  ↓
Microphone activated
  ↓
Speech transcribed in real-time
  ↓
Transcript displayed
  ↓
User clicks "Submit Answer"
  ↓
Sent to AI for processing
  ↓
AI responds with evaluation
  ↓
Text-to-Speech speaks response
  ↓
Next question displayed
```

## API Usage

### Initialize Interview
```javascript
POST /api/interviews/ai-interviewer
{
  "action": "initialize",
  "interviewId": "interview_id",
  "applicationId": "app_id",
  "questions": [...],
  "jobTitle": "Software Engineer",
  "candidateName": "John Doe"
}

Response:
{
  "success": true,
  "data": {
    "message": "Welcome message...",
    "action": "start",
    "question": { id, text, type, difficulty },
    "progress": { current: 0, total: 10, percentage: 0 }
  }
}
```

### Process Response
```javascript
POST /api/interviews/ai-interviewer
{
  "action": "respond",
  "interviewId": "interview_id",
  "applicationId": "app_id",
  "candidateInput": "My answer is..."
}

Response:
{
  "success": true,
  "data": {
    "message": "AI response...",
    "action": "move_next" | "repeat" | "clarify" | "complete",
    "progress": { current: 1, total: 10, percentage: 10 },
    "completed": false
  }
}
```

### Save Answers
```javascript
POST /api/interviews/answers
{
  "applicationId": "app_id",
  "answers": [
    {
      "questionId": 1,
      "questionText": "...",
      "answer": "...",
      "timestamp": "2024-11-16T...",
      "evaluation": {
        "score": 85,
        "feedback": "...",
        "keyPoints": ["..."]
      }
    }
  ],
  "overallScore": 82,
  "overallFeedback": "..."
}
```

## Database Schema

### Application Model - interviewSession Field
```javascript
interviewSession: {
  startedAt: Date,
  completedAt: Date,
  answers: [{
    questionId: Number,
    questionText: String,
    answer: String,
    timestamp: Date,
    evaluation: {
      score: Number,
      feedback: String,
      keyPoints: [String]
    }
  }],
  overallScore: Number,
  overallFeedback: String,
  aiInterviewerId: String  // "gemini-pro"
}
```

## Browser Compatibility

### Speech Recognition (Web Speech API)
- ✅ Chrome/Edge (best support)
- ✅ Safari (partial support)
- ❌ Firefox (not supported)
- **Fallback**: Text input always available

### Text-to-Speech (SpeechSynthesis API)
- ✅ All modern browsers
- **Controls**: Stop speaking button, volume toggle

## User Experience Features

### Visual Indicators
- 🔴 Red pulsing "Recording" button
- 🔊 "Stop Speaking" button when AI talks
- 📊 Progress bar (Question X of Y, percentage)
- ✅ Completion screen with final score
- 💬 Real-time transcript display

### Accessibility
- Keyboard navigation
- Voice and text input modes
- Clear visual feedback
- Screen reader compatible

## Testing Workflow

1. **Resume Upload & Shortlist**
   - Upload resume
   - AI parses and scores
   - If score ≥ 60%, auto-generate questions

2. **Schedule Interview**
   - HR schedules interview
   - Interview link sent to candidate

3. **Join Interview**
   - Candidate clicks link
   - Agora video initializes (left side)
   - AI Interviewer loads (right side)
   - Questions fetched from database

4. **Conduct Interview**
   - AI speaks welcome + first question
   - Candidate records answer
   - AI evaluates and moves to next
   - Repeat for all questions

5. **Complete Interview**
   - Final evaluation shown
   - Answers auto-saved to database
   - Application status updated

## Troubleshooting

### Issue: Voice recognition not working
**Solution**: 
- Check browser compatibility (use Chrome/Edge)
- Ensure HTTPS connection
- Grant microphone permissions
- Fallback: Use text input

### Issue: AI not speaking
**Solution**:
- Check voice toggle is ON
- Ensure browser supports SpeechSynthesis
- Check system volume
- Click "Stop Speaking" if stuck

### Issue: Questions not loading
**Solution**:
- Verify questions were generated during shortlist
- Check `/api/applications/[id]/questions` returns data
- Run `scripts/generate-questions-shortlisted.js` to backfill

### Issue: Answers not saving
**Solution**:
- Check `/api/interviews/answers` endpoint
- Verify applicationId in interview data
- Check Application model has interviewSession field
- Check browser console for errors

## Performance Considerations

- **Memory**: Active interviews stored in-memory Map
- **Cleanup**: Sessions deleted after completion
- **API Limits**: Gemini AI rate limits apply
- **Optimization**: Questions fetched once, cached client-side

## Security

- **Authentication**: JWT token required
- **Authorization**: Candidate can only join own interviews
- **Data Privacy**: Answers encrypted in transit (HTTPS)
- **API Key**: Separate interviewer key for isolation

## Future Enhancements

1. **Video Analysis**: Analyze candidate facial expressions
2. **Follow-up Questions**: Dynamic questions based on answers
3. **Multi-language Support**: Conduct interviews in different languages
4. **Recording Playback**: Review interview recordings
5. **Live Scoring Dashboard**: Real-time scores for HR/Admin

## Quick Reference

### Start Interview
```bash
# Candidate opens interview link
/interview/[interviewId]

# System automatically:
1. Fetches Agora credentials
2. Loads generated questions
3. Initializes AI Interviewer
4. Starts video call
```

### Files Modified/Created
```
Created:
- src/layers/2-business-logic/ai-services/aiInterviewer.ts
- src/components/AIInterviewerPanel.tsx
- src/app/api/interviews/ai-interviewer/route.ts
- src/app/api/interviews/answers/route.ts

Modified:
- src/app/interview/[id]/page.tsx
- src/layers/1-data-access/models/Application.ts
- src/app/api/interviews/join/route.ts
- .env.local

Dependencies Added:
- @google/generative-ai
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API key is set correctly
3. Ensure questions exist in database
4. Test voice permissions in browser
5. Check network connectivity

---

**Last Updated**: November 16, 2025
**Version**: 1.0
**Status**: Production Ready ✅
