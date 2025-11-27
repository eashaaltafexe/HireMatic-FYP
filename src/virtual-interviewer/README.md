# Virtual Interviewer System

This folder contains all the files related to the AI-powered virtual interviewer with voice activity detection (VAD) and real-time transcription.

## 📁 Folder Structure

```
src/virtual-interviewer/
├── components/
│   └── AIInterviewerPanel.tsx     # Main AI interviewer UI component
├── server/
│   └── transcribeWs.ts            # WebSocket server for transcription
└── README.md                      # This file
```

## 🎯 Core Features

### AIInterviewerPanel Component
- **Voice Activity Detection (VAD)**: Real-time audio analysis using Web Audio API
- **Text-to-Speech (TTS)**: Browser speechSynthesis for AI questions
- **MediaRecorder**: Streams audio chunks to WebSocket every 250ms
- **Timer Management**: 
  - 1-minute timer per question (starts when question is asked)
  - 15-second silence prompt ("Please answer the question")
- **Progress Tracking**: Saves all Q&A with timestamps

### WebSocket Transcription Server
- **Real-time Audio Processing**: Receives audio chunks from client
- **Session Management**: Tracks multiple concurrent interviews
- **Placeholder Transcription**: Ready for integration with:
  - Google Speech-to-Text API
  - Azure Speech Services
  - OpenAI Whisper
  - Assembly.AI

## 🔌 Integration Points

### In Your App Pages
```tsx
import AIInterviewerPanel from '@/virtual-interviewer/components/AIInterviewerPanel';

<AIInterviewerPanel
  interviewId="INTERVIEW-ID"
  applicationId="APP-ID"
  questions={questions}
  jobTitle="Software Engineer"
  candidateName="John Doe"
  onComplete={(transcript) => {
    console.log('Interview complete:', transcript);
  }}
/>
```

### In Your Server Setup (server.js)
```javascript
// Load the WebSocket server
require('./src/virtual-interviewer/server/transcribeWs.ts');

// Import and setup
const { setupTranscribeWebSocket } = require('./src/virtual-interviewer/server/transcribeWs');
setupTranscribeWebSocket(httpServer);
```

## ⚙️ Configuration

### Timer Settings (in AIInterviewerPanel.tsx)
```tsx
const SILENCE_AFTER_MS = 60000;  // 1 minute per question
const PROMPT_AFTER_MS = 15000;   // 15 second silence prompt
```

### VAD Sensitivity (in AIInterviewerPanel.tsx)
```tsx
const vad = useVAD({
  sensitivity: 0.01,        // RMS threshold (adjust for microphone sensitivity)
  smoothingInterval: 120,   // Sample interval in ms
  // ...
});
```

## 🚀 Usage Flow

1. **Question Asked**: AI speaks question via TTS
2. **1-Minute Timer Starts**: Total time for question (not paused during speech)
3. **VAD Monitors**: Detects when candidate speaks/stops
4. **15-Second Silence**: If silent for 15 seconds, AI prompts to answer
5. **Auto-Advance**: After 1 minute total, moves to next question
6. **Recording**: Audio streamed to WebSocket for transcription
7. **Completion**: All answers saved and returned via onComplete callback

## 📝 Interview Data Format

```typescript
interface TranscriptRecord {
  questionId: number;
  questionText: string;
  answer: string;
  timestamp: string; // ISO 8601
}
```

## 🔧 Dependencies

- `lucide-react`: Icons
- `ws`: WebSocket server
- `@types/ws`: WebSocket TypeScript types
- Web Audio API (browser)
- SpeechSynthesis API (browser)
- MediaRecorder API (browser)

## 🎤 Browser Requirements

- **Chrome/Edge**: Best support for all APIs
- **Microphone Access**: User must grant permission
- **HTTPS**: Required for getUserMedia in production

## 🐛 Debugging

### Enable Console Logs
The system has extensive logging:
- `[VAD]`: Voice activity detection events
- `[Recorder]`: MediaRecorder status
- `[Transcribe WS]`: WebSocket messages
- `[Timer]`: Timer events
- `[Interview]`: Question flow

### Common Issues
1. **No voice detection**: Check microphone permissions
2. **Timers not firing**: Check console for errors
3. **WebSocket not connecting**: Ensure server is running on same origin
4. **No TTS**: Check browser support for speechSynthesis

## 🔮 Future Enhancements

- [ ] Integrate real transcription service (Google/Azure/Whisper)
- [ ] Add waveform visualization
- [ ] Support multiple languages
- [ ] Add sentiment analysis
- [ ] Store audio recordings
- [ ] AI follow-up questions based on answers
- [ ] Real-time AI evaluation during interview

## 📄 License

Part of HireMatic Implementation
