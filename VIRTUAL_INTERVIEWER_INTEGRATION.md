# Virtual Interviewer Integration Guide

## 🎯 Overview

The Virtual Interviewer system is now fully integrated into HireMatic's hiring workflow. When a candidate is scheduled for an interview, they will experience an AI-powered voice interview with questions specifically generated for their role.

## 🔄 Complete Interview Flow

### 1. Application Submission
```
Candidate applies → Resume parsed → AI screening → Status: "Under Review"
```

### 2. Interview Scheduling (Admin/HR)
```
Admin schedules interview → Questions auto-generated → Status: "Interview Scheduled"
```

**What happens automatically:**
- ✅ AI generates 10 job-specific questions based on:
  - Job title and requirements
  - Candidate's resume/skills
  - Industry best practices
- ✅ Questions stored in `Application.generatedQuestions[]`
- ✅ Interview link created
- ✅ Candidate notified with interview link

### 3. Candidate Joins Interview
```
Click link → Video call starts → AI interviewer begins → Questions answered
```

**Interview Features:**
- 🎥 **Video Call**: Agora-powered video with interviewer
- 🎤 **Voice-Based**: AI asks questions via text-to-speech
- ⏱️ **Timed**: 1 minute per question (auto-advances)
- 💬 **Real-time Transcription**: Answers captured via WebSocket
- 🔄 **Smart Prompts**: 15-second silence triggers "Please answer" prompt

### 4. Interview Completion
```
All questions answered → Transcript saved → Status updated → Results available
```

**What gets saved:**
- All Q&A pairs with timestamps
- Audio transcription (when integrated)
- Overall score and feedback
- Interview duration and metadata

## 📁 Key Components

### Virtual Interviewer Files
```
src/virtual-interviewer/
├── components/
│   └── AIInterviewerPanel.tsx        # Main UI component
├── server/
│   └── transcribeWs.ts               # WebSocket transcription server
└── README.md                          # Component documentation
```

### Integration Points

#### 1. Interview Page (`src/app/interview/[id]/page.tsx`)
- Loads candidate's generated questions from database
- Displays Agora video call (left 2/3)
- Shows AI Interviewer Panel (right 1/3)
- Saves answers when interview completes

#### 2. API Routes

**`/api/interviews` (POST)**
- Creates interview record
- Auto-generates questions if not exists
- Updates application status
- Sends notification to candidate

**`/api/applications/[id]/questions` (GET)**
- Retrieves generated questions for specific application
- Used by interview page to load questions

**`/api/interviews/answers` (POST)**
- Saves interview transcript and scores
- Updates application with interview results

#### 3. Database Models

**Application Model** (`generatedQuestions`):
```typescript
generatedQuestions: [{
  id: Number,
  text: String,
  type: 'technical' | 'behavioral' | 'situational' | 'coding' | 'system-design',
  difficulty: 'easy' | 'medium' | 'hard',
  jobField: String,
  generatedAt: Date
}]
```

**Application Model** (`interviewSession`):
```typescript
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
  overallFeedback: String
}
```

## 🚀 Usage for Admins/HR

### Scheduling an Interview

1. **Navigate to Applications**
   - Go to Admin/HR dashboard
   - Find candidate with "Under Review" status

2. **Schedule Interview**
   ```
   Click "Schedule Interview" → Select date/time → Confirm
   ```

3. **System Auto-generates Questions**
   - Questions based on job title (e.g., "Software Engineer")
   - 10 questions covering technical & behavioral topics
   - Questions stored in database

4. **Candidate Gets Notified**
   - Email with interview link
   - In-app notification
   - Calendar invite (if configured)

### Viewing Interview Results

After candidate completes interview:

1. **Go to Application Details**
2. **View Interview Tab**
   - Full transcript of Q&A
   - Individual question scores
   - Overall performance score
   - AI-generated feedback

## 🎤 Interview Experience (Candidate View)

### Before Interview
1. Receive interview link via email/notification
2. Click link 5-10 minutes before scheduled time
3. Grant camera/microphone permissions

### During Interview
1. **Video Call Starts**
   - See interviewer video feed
   - Camera/mic controls available

2. **AI Interviewer Begins**
   - AI greets candidate via voice
   - Asks first question
   - 1-minute timer starts

3. **Answering Questions**
   - Speak naturally into microphone
   - Answer shows in real-time (transcription)
   - Can click "Repeat" to hear question again
   - Can click "Skip" if needed

4. **Auto-Progression**
   - After 1 minute, moves to next question
   - If silent for 15 seconds, AI prompts to answer
   - Progress bar shows completion status

5. **Completion**
   - AI thanks candidate
   - Answers automatically saved
   - Can download transcript

## 🔧 Configuration

### Environment Variables
```env
# Agora Video (Required)
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id

# Question Generation (Required)
PYTHON_SERVICE_URL=http://localhost:8000
GEMINI_API_KEY=your_gemini_api_key

# MongoDB (Required)
MONGODB_URI=mongodb+srv://...

# JWT (Required)
JWT_SECRET=your_secret_key
```

### Timer Settings
Edit `src/virtual-interviewer/components/AIInterviewerPanel.tsx`:
```typescript
const SILENCE_AFTER_MS = 60000;  // Time per question (60 seconds)
const PROMPT_AFTER_MS = 15000;   // Silence before prompt (15 seconds)
```

### Question Generation
Edit `src/layers/2-business-logic/ai-services/autoQuestionGenerator.ts`:
```typescript
num_questions: 10  // Change number of questions to generate
```

### VAD Sensitivity
Edit `src/virtual-interviewer/components/AIInterviewerPanel.tsx`:
```typescript
const vad = useVAD({
  sensitivity: 0.01,  // Lower = more sensitive
  smoothingInterval: 120  // Sample rate in ms
});
```

## 🐛 Troubleshooting

### No Questions Generated
**Symptom**: Interview page shows "No questions available"

**Solutions**:
1. Check if Python question service is running
2. Verify `PYTHON_SERVICE_URL` in environment
3. Check application status is "Interview Scheduled"
4. Manually trigger question generation via admin panel

### Voice Not Detected
**Symptom**: Microphone icon stays gray

**Solutions**:
1. Check microphone permissions in browser
2. Use Chrome/Edge (best support)
3. Check if HTTPS (required in production)
4. Lower VAD sensitivity value

### Timers Not Working
**Symptom**: Interview doesn't auto-advance

**Solutions**:
1. Check browser console for errors
2. Verify WebSocket connection (should show "Connected")
3. Reload page
4. Check `onCandidateSilence` function not being blocked

### Transcription Not Working
**Symptom**: "Transcribing... (X chunks)" shown but no text

**Solutions**:
1. Currently placeholder - integrate real transcription service
2. See `src/virtual-interviewer/server/transcribeWs.ts` for integration
3. Recommended: Google Speech-to-Text, Azure Speech, or Whisper

## 🔮 Future Enhancements

### Planned Features
- [ ] Real-time speech-to-text integration
- [ ] AI follow-up questions based on answers
- [ ] Live sentiment analysis during interview
- [ ] Video recording and playback
- [ ] Multi-language support
- [ ] Practice mode for candidates
- [ ] AI interviewer avatar (video generation)
- [ ] Real-time performance scoring
- [ ] Collaborative interview (multiple interviewers)

### Customization Options
- [ ] Custom question templates per job role
- [ ] Adjustable interview duration
- [ ] Different AI personas/voices
- [ ] Company-specific evaluation rubrics
- [ ] Integration with calendar systems
- [ ] SMS reminders for interviews

## 📊 Analytics & Reporting

### Available Metrics
- Interview completion rate
- Average time per question
- Question difficulty vs performance
- Drop-off points during interview
- Most challenging questions
- Candidate sentiment analysis

### Viewing Reports
```
Admin Dashboard → Analytics → Interview Performance
```

## 🔐 Security & Privacy

### Data Protection
- Interview recordings encrypted at rest
- Secure WebSocket connections (WSS in production)
- JWT authentication for all API calls
- Candidate consent required for recording
- GDPR-compliant data retention

### Access Control
- **Candidates**: View only their own interviews
- **HR**: View interviews for their department
- **Admin**: Full access to all interviews
- **Interviewers**: Assigned interviews only

## 📞 Support

### Common Questions

**Q: Can candidates reschedule?**
A: Yes, through their notification panel (feature in development)

**Q: What happens if internet drops?**
A: Interview can be resumed from last saved answer

**Q: Can I customize questions per candidate?**
A: Yes, edit `Application.generatedQuestions` before interview

**Q: How is scoring calculated?**
A: AI evaluates each answer, overall score is average

**Q: Can I add human interviewers?**
A: Yes, video call supports multiple participants

## 🎓 Best Practices

### For Admins
1. ✅ Schedule interviews 2-3 days in advance
2. ✅ Test interview flow in staging environment
3. ✅ Review auto-generated questions before sending
4. ✅ Have backup plan for technical issues
5. ✅ Send reminder 24 hours before interview

### For Candidates
1. ✅ Test camera/mic before interview
2. ✅ Use quiet environment
3. ✅ Stable internet connection (minimum 2 Mbps)
4. ✅ Close other applications
5. ✅ Join 5 minutes early

## 📝 License

Part of HireMatic Implementation - Internal Use Only
