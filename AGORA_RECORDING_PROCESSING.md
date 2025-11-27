# 🎥 Agora Cloud Recording Processing Guide

## ✅ What You Can Do With Agora Cloud Recordings

Agora cloud recordings are **fully processable** - you can extract, analyze, and transform them in multiple ways.

---

## 📹 **Recording Capabilities**

### **1. Video Processing** ✅

#### Extract Audio from Video
```typescript
import ffmpeg from 'fluent-ffmpeg';

async function extractAudio(videoUrl: string): Promise<string> {
  const audioPath = '/tmp/interview-audio.mp3';
  
  await new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      .output(audioPath)
      .audioCodec('libmp3lame')  // MP3 format
      .audioBitrate('128k')       // Good quality
      .noVideo()                  // Remove video track
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
  
  return audioPath;
}
```

#### Extract Video Frames (for emotion analysis)
```typescript
async function extractFrames(videoUrl: string): Promise<string[]> {
  const outputDir = '/tmp/frames';
  
  await new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      .screenshots({
        count: 20,              // 20 frames throughout video
        folder: outputDir,
        filename: 'frame-%i.png'
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  return getFramePaths(outputDir);
}
```

#### Get Video Metadata
```typescript
async function getVideoMetadata(videoUrl: string) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoUrl, (err, metadata) => {
      if (err) reject(err);
      resolve({
        duration: metadata.format.duration,        // Duration in seconds
        fileSize: metadata.format.size,            // File size in bytes
        bitrate: metadata.format.bit_rate,         // Bitrate
        resolution: `${metadata.streams[0].width}x${metadata.streams[0].height}`,
        codec: metadata.streams[0].codec_name
      });
    });
  });
}
```

---

### **2. Audio Processing** ✅

#### Transcribe Audio to Text
```typescript
// Using Google Speech-to-Text
async function transcribeAudio(audioPath: string) {
  const audioBytes = fs.readFileSync(audioPath).toString('base64');
  
  const response = await fetch(
    'https://speech.googleapis.com/v1/speech:recognize',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GOOGLE_CLOUD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        config: {
          encoding: 'MP3',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          enableSpeakerDiarization: true,  // Identify who's speaking
          diarizationSpeakerCount: 2       // Interviewer + Candidate
        },
        audio: { content: audioBytes }
      })
    }
  );
  
  const data = await response.json();
  return data.results.map(r => r.alternatives[0].transcript).join(' ');
}
```

#### Analyze Speaking Patterns
```typescript
function analyzeSpeaking(transcript: string, duration: number) {
  const words = transcript.split(/\s+/);
  const wordsPerMinute = (words.length / duration) * 60;
  
  // Detect filler words
  const fillers = ['um', 'uh', 'like', 'you know'];
  const fillerCount = fillers.reduce((count, filler) => {
    const matches = transcript.match(new RegExp(`\\b${filler}\\b`, 'gi'));
    return count + (matches?.length || 0);
  }, 0);
  
  return {
    wordsPerMinute,           // Ideal: 120-160 WPM
    fillerWordCount,
    fillerPercentage: (fillerCount / words.length) * 100,
    clarity: fillerPercentage < 5 ? 'Excellent' : 'Needs work'
  };
}
```

---

### **3. AI Analysis** ✅

#### Analyze with Gemini AI
```typescript
async function analyzeInterview(transcript: string) {
  const prompt = `Analyze this interview transcript:

${transcript}

Evaluate:
1. Communication skills (0-100)
2. Technical knowledge (0-100)
3. Confidence level (0-100)
4. Professionalism (0-100)
5. Overall recommendation (Strong Hire/Hire/Maybe/No Hire)

Return JSON format.`;

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  
  return await response.json();
}
```

#### Emotion Detection (using Azure Face API)
```typescript
async function analyzeEmotions(frameImageUrl: string) {
  const response = await fetch(
    'https://YOUR-REGION.api.cognitive.microsoft.com/face/v1.0/detect',
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_FACE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: frameImageUrl,
        returnFaceAttributes: 'emotion,smile,headPose'
      })
    }
  );
  
  const data = await response.json();
  return {
    happiness: data[0].faceAttributes.emotion.happiness,
    confidence: data[0].faceAttributes.emotion.neutral,
    nervousness: data[0].faceAttributes.emotion.fear,
    smile: data[0].faceAttributes.smile
  };
}
```

---

## 🚀 **Complete Processing Pipeline**

### **What Happens When You Process a Recording:**

```
1. Interview Ends → Agora stops recording
   ↓
2. Recording saved to cloud (Agora/AWS/Azure)
   ↓
3. Get recording URL from Agora API
   ↓
4. Download video file
   ↓
5. Extract audio track (using FFmpeg)
   ↓
6. Transcribe audio to text (Google Speech-to-Text)
   ↓
7. Analyze transcript with Gemini AI
   ↓
8. Calculate speaking metrics (WPM, filler words, etc.)
   ↓
9. (Optional) Extract video frames
   ↓
10. (Optional) Analyze facial expressions
   ↓
11. Generate final interview report
   ↓
12. Save to database
```

---

## 📊 **What You Get After Processing:**

### **Transcript Data:**
- Full text transcript
- Word-by-word timestamps
- Speaker identification (interviewer vs candidate)
- Confidence scores per word

### **Speaking Metrics:**
- Words per minute (120-160 is ideal)
- Filler word count and percentage
- Pause durations
- Articulation quality

### **AI Analysis:**
- Communication score (0-100)
- Technical score (0-100)
- Confidence level (0-100)
- Professionalism score (0-100)
- Overall recommendation (Hire/No Hire)
- Strengths and weaknesses
- Detailed feedback

### **(Optional) Emotion Analysis:**
- Happiness/positivity level
- Confidence/nervousness
- Engagement level
- Smile detection

---

## 💻 **How to Use in Your Project**

### **Step 1: Process Recording After Interview**

```typescript
// API: POST /api/interviews/:id/process-recording
const response = await fetch(`/api/interviews/${interviewId}/process-recording`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
console.log('Analysis:', result.analysis);
console.log('Transcript:', result.transcript);
```

### **Step 2: View Analysis Results**

```typescript
// API: GET /api/interviews/:id/process-recording
const response = await fetch(`/api/interviews/${interviewId}/process-recording`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Overall Score:', data.analysis.overallScore);
console.log('Recommendation:', data.analysis.recommendation);
console.log('Speaking Metrics:', data.analysis.speakingMetrics);
```

---

## 🛠️ **Required Tools & APIs**

### **For Video/Audio Processing:**
- **FFmpeg** (free, open-source)
  - Install: `npm install fluent-ffmpeg`
  - System: Download from https://ffmpeg.org

### **For Transcription:**
Choose ONE:
1. **Google Speech-to-Text** ✅ Recommended
   - Free: 60 minutes/month
   - Paid: $0.006 per 15 seconds
   - Accuracy: 95%+

2. **OpenAI Whisper API**
   - Cost: $0.006/minute
   - Accuracy: 99%
   - 99 languages

3. **AssemblyAI**
   - Cost: $0.25/hour
   - Features: Speaker diarization, sentiment

### **For AI Analysis:**
- **Gemini AI** (Already in your project ✅)
  - Free tier available
  - Already configured

### **For Emotion Detection (Optional):**
- **Azure Face API**
  - Free: 20 transactions/minute
  - Paid: $0.001 per image

---

## 📁 **File Structure in Your Project**

```
src/layers/3-application/services/
  ├── recordingProcessor.ts     ← Main processing service (✅ Created)
  └── agoraService.ts            ← Agora token generation

src/app/api/interviews/[id]/
  └── process-recording/
      └── route.ts                ← API endpoint (✅ Created)

Interview Model Fields (MongoDB):
  ├── recording: {
  │     url: string             ← Agora recording URL
  │     duration: number
  │     recordedAt: Date
  │   }
  ├── transcript: {
  │     text: string            ← Full transcript
  │     words: [...}            ← Word-by-word data
  │     confidence: number
  │   }
  └── analysis: {
        communicationScore: number
        technicalScore: number
        overallScore: number
        recommendation: string
        speakingMetrics: {...}
        detailedFeedback: string
      }
```

---

## 💰 **Cost Breakdown**

### **Recording (Agora):**
- **FREE**: 10,000 minutes/month
- **Paid**: $0.99 per 1,000 minutes

### **Transcription (Google Speech-to-Text):**
- **FREE**: 60 minutes/month
- **Paid**: $1.44 per hour

### **AI Analysis (Gemini):**
- **FREE**: Generous free tier
- **Paid**: Very low cost

### **Example Monthly Cost (100 interviews @ 30 min each):**
```
Recording: 3,000 minutes = FREE (under 10k limit)
Transcription: 50 hours = ~$72/month
AI Analysis: ~$5/month
TOTAL: ~$77/month for 100 interviews
```

---

## ✅ **Summary: What's Possible**

| Feature | Can You Do It? | How? |
|---------|----------------|------|
| **Extract audio from video** | ✅ YES | FFmpeg |
| **Transcribe audio to text** | ✅ YES | Google Speech-to-Text |
| **Analyze transcript with AI** | ✅ YES | Gemini AI (already setup) |
| **Get speaking metrics** | ✅ YES | Built into recordingProcessor |
| **Detect emotions** | ✅ YES | Azure Face API (optional) |
| **Download recordings** | ✅ YES | Agora provides URLs |
| **Store in your database** | ✅ YES | MongoDB (already setup) |
| **Generate reports** | ✅ YES | Use analysis data |

---

## 🎯 **Next Steps**

1. **Enable Cloud Recording in Agora Console**
   - Go to: https://console.agora.io
   - Enable Cloud Recording for your project

2. **Install FFmpeg**
   ```powershell
   # Windows (using Chocolatey)
   choco install ffmpeg
   
   # Or download from: https://ffmpeg.org/download.html
   ```

3. **Get Google Cloud API Key** (for transcription)
   - Go to: https://console.cloud.google.com
   - Enable Speech-to-Text API
   - Create API key
   - Add to `.env.local`:
     ```
     GOOGLE_CLOUD_API_KEY=your-key-here
     ```

4. **Test the Processing Pipeline**
   ```bash
   # After an interview finishes
   POST /api/interviews/[id]/process-recording
   
   # View results
   GET /api/interviews/[id]/process-recording
   ```

---

**Your recording processing system is now ready!** 🚀

You can fully process Agora cloud recordings to:
- ✅ Extract audio
- ✅ Get transcripts
- ✅ Analyze with AI
- ✅ Score candidates automatically
- ✅ Generate detailed reports

All files are created and ready to use!
