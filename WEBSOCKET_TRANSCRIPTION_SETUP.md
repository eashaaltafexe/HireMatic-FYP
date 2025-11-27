# WebSocket Transcription Server

This document explains the WebSocket server setup for real-time interview transcription.

## Architecture

```
Client (Browser)                    Server
┌─────────────────────┐            ┌──────────────────────┐
│ AIInterviewerPanel  │            │  Custom Next.js      │
│                     │            │  HTTP Server         │
│ - VAD Detection     │            │                      │
│ - MediaRecorder     │  WebSocket │  WebSocket Server    │
│ - Audio Chunks   ───┼───────────▶│  /ws/transcribe      │
│                     │            │                      │
│ ◀ Partial/Final  ───┼────────────│  - Session Mgmt      │
│   Transcripts       │            │  - Audio Processing  │
└─────────────────────┘            │  - Transcription API │
                                   └──────────────────────┘
```

## Files Created

### 1. `src/server/transcribeWs.ts`
WebSocket server implementation:
- Handles WebSocket connections on `/ws/transcribe`
- Receives audio chunks from browser
- Processes audio (placeholder for transcription service)
- Sends partial/final transcripts back to client
- Session management and cleanup

### 2. `server.js` (Updated)
Custom Next.js server with WebSocket support:
- Creates HTTP server
- Initializes Next.js app handler
- Attaches WebSocket server to HTTP server
- Runs on port 3000 (configurable)

## How It Works

### 1. Client Connection Flow

```javascript
// Client connects
const ws = new WebSocket('ws://localhost:3000/ws/transcribe');

// Server assigns session ID
ws.onopen -> { type: 'info', sessionId: 'session_xyz' }
```

### 2. Audio Streaming

```javascript
// Client sends audio chunks (every 250ms)
MediaRecorder.ondataavailable -> ws.send(audioBlob)

// Server receives and processes
ws.on('message', (audioData: Buffer) => {
  processAudioChunk(audioData) // Transcribe audio
  ws.send({ type: 'partial', text: '...' }) // Send back
})
```

### 3. Transcription Results

```javascript
// Partial results (while speaking)
{ type: 'partial', text: 'Hello world', timestamp: 123456 }

// Final results (after silence)
{ type: 'final', text: 'Hello world!', timestamp: 123460 }
```

### 4. Interview Completion

```javascript
// Client sends completion signal
ws.send(JSON.stringify({ 
  type: 'done', 
  payload: [{ questionId: 1, answer: '...' }] 
}));

// Server saves transcript and confirms
{ type: 'info', msg: 'Transcript saved successfully' }
```

## Running the Server

### Development
```bash
npm run dev
```

This now runs the custom server with WebSocket support.

### Production
```bash
npm run build
npm start
```

## Current Implementation

The WebSocket server is **functional** but uses a **placeholder** for actual transcription.

### What Works Now:
✅ WebSocket connection established  
✅ Audio chunks received from browser  
✅ Session management  
✅ Partial/Final message structure  
✅ Cleanup on disconnect  

### What Needs Integration:
❌ Real transcription service (Google/Azure/Whisper)  
❌ Audio format conversion  
❌ Database storage of transcripts  

## Integrating a Transcription Service

### Option 1: Google Speech-to-Text

```bash
npm install @google-cloud/speech
```

Update `processAudioChunk()` in `transcribeWs.ts`:

```typescript
import speech from '@google-cloud/speech';

const client = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

async function processAudioChunk(audioData: Buffer) {
  const request = {
    audio: { content: audioData.toString('base64') },
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
    },
  };
  
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  
  return { final: transcription };
}
```

### Option 2: OpenAI Whisper API

```bash
npm install openai
```

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function processAudioChunk(audioData: Buffer) {
  const file = new File([audioData], 'audio.webm', { type: 'audio/webm' });
  
  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: 'whisper-1',
    language: 'en',
  });
  
  return { final: transcription.text };
}
```

### Option 3: Azure Speech Services

```bash
npm install microsoft-cognitiveservices-speech-sdk
```

```typescript
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.AZURE_SPEECH_KEY,
  process.env.AZURE_SPEECH_REGION
);

async function processAudioChunk(audioData: Buffer) {
  const audioConfig = sdk.AudioConfig.fromWavFileInput(audioData);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  
  return new Promise((resolve) => {
    recognizer.recognizeOnceAsync(result => {
      resolve({ final: result.text });
    });
  });
}
```

## Testing the WebSocket

### Using Browser Console

```javascript
// Open http://localhost:3000/test-interviewer
// Open DevTools Console

const ws = new WebSocket('ws://localhost:3000/ws/transcribe');

ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));

// Send test message
ws.send(JSON.stringify({ type: 'ping' }));
// Response: { type: 'pong' }
```

### Check Server Logs

```
[Transcribe WS] Client session_xyz connected (Total: 1)
[Transcribe WS] session_xyz: Received audio chunk (8192 bytes)
[Transcribe WS] session_xyz: Control message: done
[Transcribe WS] session_xyz: Interview completed
```

## Environment Variables

Add to `.env.local`:

```env
# For Google Speech-to-Text
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# For OpenAI Whisper
OPENAI_API_KEY=sk-...

# For Azure Speech
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=eastus
```

## Next Steps

1. ✅ WebSocket server is running
2. ✅ Client can connect and send audio
3. ⏳ Choose transcription service (Google/OpenAI/Azure)
4. ⏳ Integrate transcription API
5. ⏳ Test end-to-end flow
6. ⏳ Add error handling and retries
7. ⏳ Store transcripts in MongoDB

## Troubleshooting

### WebSocket won't connect
- Check server is running: `npm run dev`
- Verify URL: `ws://localhost:3000/ws/transcribe`
- Check browser console for errors

### No transcription results
- Current implementation is placeholder only
- Integrate real service (see above)
- Check server logs for processing errors

### Audio format issues
- Browser sends `audio/webm;codecs=opus`
- May need conversion for some services
- Use FFmpeg or audio processing library
