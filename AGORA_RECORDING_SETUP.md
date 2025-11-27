# Agora Cloud Recording Setup Guide

## Overview
Your HireMatic platform now automatically records all video interviews using Agora Cloud Recording. This guide explains how to configure and use the recording feature.

## Features Implemented

✅ **Automatic Recording**: Interviews are automatically recorded when they start
✅ **Cloud Storage**: Recordings are stored in the cloud (AWS S3, Azure, or Agora Cloud)
✅ **Multiple Formats**: Recordings saved as both HLS and MP4
✅ **Auto Start/Stop**: Recording starts 2 seconds after joining, stops when leaving
✅ **Database Tracking**: Recording metadata stored in Interview collection

## Setup Instructions

### Step 1: Get Agora Credentials

1. Login to [Agora Console](https://console.agora.io)
2. Go to your project
3. Copy the following credentials:
   - App ID (already have this)
   - App Certificate (already have this)
   - **Customer ID** (need to get this)
   - **Customer Secret** (need to get this)

#### How to Get Customer ID & Secret:
1. Go to Agora Console → Your Project
2. Click on "RESTful API" in the left sidebar
3. Click "Add a Secret" button
4. Copy the **Customer ID** and **Customer Secret**

### Step 2: Enable Cloud Recording

1. Go to Agora Console → Your Project
2. Navigate to "Features" → "Cloud Recording"
3. Click "Enable" button
4. Configure storage settings (see Step 3)

### Step 3: Configure Cloud Storage

You have 3 options:

#### Option A: Agora Cloud Storage (Easiest - Recommended for Testing)
- ✅ No setup needed
- ✅ First 10,000 minutes free
- ⚠️ Files deleted after 7 days
- **Action**: Select "Agora Cloud" in recording settings

#### Option B: AWS S3 (Recommended for Production)
1. Create an S3 bucket: `hirematic-recordings`
2. Create IAM user with S3 write permissions
3. Get Access Key ID and Secret Access Key
4. Add to `.env.local`:
   ```env
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AGORA_RECORDING_BUCKET=hirematic-recordings
   ```

#### Option C: Other Cloud Providers
- Azure Blob Storage
- Google Cloud Storage
- Alibaba Cloud OSS
- Tencent Cloud COS

### Step 4: Add Environment Variables

Add these to your `.env.local` file:

```env
# Agora Recording Credentials (Required)
AGORA_CUSTOMER_ID=your_customer_id_here
AGORA_CUSTOMER_SECRET=your_customer_secret_here

# Cloud Storage (Optional - defaults to Agora Cloud)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AGORA_RECORDING_BUCKET=hirematic-recordings
```

### Step 5: Restart Your Server

```powershell
npm run dev
```

## How It Works

### Automatic Recording Flow:

```
1. Candidate/HR joins interview
   ↓
2. AgoraVideoCall component detects interviewId
   ↓
3. Wait 2 seconds for connection to stabilize
   ↓
4. Call /api/interviews/recording/start
   ↓
5. Backend calls Agora Cloud Recording API:
   - Acquire resource ID
   - Start recording
   ↓
6. Recording metadata saved to Interview document
   ↓
7. Interview proceeds normally
   ↓
8. When user leaves:
   - Call /api/interviews/recording/stop
   - Get recording file list
   - Save file URLs to database
```

### Code Integration:

The `AgoraVideoCall` component now accepts an `interviewId` prop:

```tsx
<AgoraVideoCall
  appId={credentials.appId}
  channel={credentials.channel}
  token={credentials.token}
  uid={credentials.uid}
  userName={user.name}
  interviewId={interview._id}  // 👈 Add this prop
  onLeave={handleLeave}
/>
```

## API Endpoints

### Start Recording
**POST** `/api/interviews/recording/start`

```json
{
  "interviewId": "interview_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recording started successfully",
  "data": {
    "resourceId": "resource_id",
    "sid": "session_id",
    "channelName": "interview_channel_name"
  }
}
```

### Stop Recording
**POST** `/api/interviews/recording/stop`

```json
{
  "interviewId": "interview_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recording stopped successfully",
  "data": {
    "files": [
      {
        "filename": "interview_123_2024.mp4",
        "trackType": "audio_and_video",
        "uid": "recorder_123",
        "mixedAllUser": true,
        "isPlayable": true,
        "sliceStartTime": 1234567890
      }
    ],
    "status": "completed"
  }
}
```

## Database Schema

The `Interview` model now includes recording information:

```typescript
interface IInterview {
  // ... other fields
  recording?: {
    resourceId: string;
    sid: string;
    recordingUid: string;
    startedAt: Date;
    stoppedAt?: Date;
    status: 'recording' | 'completed' | 'failed';
    files?: Array<{
      filename: string;
      trackType: string;
      uid: string;
      mixedAllUser: boolean;
      isPlayable: boolean;
      sliceStartTime: number;
    }>;
  };
}
```

## Accessing Recorded Files

### Option 1: Agora Cloud Storage
1. Go to Agora Console → Cloud Recording
2. Click "Recordings"
3. Find your recording by channel name
4. Download or stream directly

### Option 2: AWS S3
```javascript
// Get recording URL
const recordingUrl = `https://${bucket}.s3.amazonaws.com/interviews/${channelName}/${filename}`;
```

### Option 3: Via API (Add this endpoint later)
```typescript
// GET /api/interviews/:interviewId/recording
export async function GET(request: NextRequest) {
  const interview = await Interview.findById(interviewId);
  return NextResponse.json({
    files: interview.recording?.files,
    urls: interview.recording?.files.map(file => getFileUrl(file))
  });
}
```

## Costs

### Agora Cloud Recording Pricing:

| Usage | Cost |
|-------|------|
| First 10,000 minutes/month | **FREE** ✅ |
| After 10,000 minutes | $0.99 per 1,000 minutes |
| HD Recording (1080p) | Same as above |
| Storage (Agora Cloud) | First 10,000 min free, then $0.99/1000 min |

### AWS S3 Storage Costs:
- Storage: ~$0.023 per GB/month
- Example: 100 hours of HD video ≈ 50GB ≈ $1.15/month

## Troubleshooting

### Recording Not Starting?

**Check:**
1. ✅ `AGORA_CUSTOMER_ID` and `AGORA_CUSTOMER_SECRET` in `.env.local`
2. ✅ Cloud Recording enabled in Agora Console
3. ✅ `interviewId` prop passed to `AgoraVideoCall` component
4. ✅ User is authenticated (has valid JWT token)
5. ✅ Check browser console for "[Recording]" logs

### Recording Files Not Found?

**Check:**
1. ✅ Storage configuration (AWS credentials correct)
2. ✅ Bucket name matches `AGORA_RECORDING_BUCKET`
3. ✅ IAM user has S3 write permissions
4. ✅ Wait a few minutes after stopping (processing time)

### "Failed to acquire recording resource"?

**Fix:**
- Verify Customer ID and Secret are correct
- Check Agora Console → Cloud Recording is enabled
- Ensure your Agora account is not suspended

## Next Steps (Optional Enhancements)

### 1. Add Recording Player to Admin Dashboard
```tsx
// src/app/admin/interviews/[id]/recording.tsx
<video controls>
  <source src={recordingUrl} type="video/mp4" />
</video>
```

### 2. Add Transcription (Google Speech-to-Text)
- Extract audio from recording
- Send to Google Cloud Speech-to-Text API
- Store transcript in database
- Use Gemini AI to analyze transcript

### 3. Add AI Interview Analysis
- Analyze candidate's responses
- Assess communication skills
- Generate automated interview report

### 4. Add Download Feature
```typescript
// Allow HR to download recordings
<button onClick={() => downloadRecording(interview.recording.files[0])}>
  Download Interview Recording
</button>
```

## Testing

### Test Recording Locally:

1. Start your server: `npm run dev`
2. Create a test interview
3. Join the interview room
4. Check browser console for:
   ```
   [Recording] Starting recording for interview: interview_id
   [Recording] ✅ Recording started successfully
   ```
5. Leave the interview
6. Check console for:
   ```
   [Recording] Stopping recording for interview: interview_id
   [Recording] ✅ Recording stopped successfully
   ```
7. Check database:
   ```javascript
   db.interviews.findOne({ _id: "interview_id" })
   // Should have `recording` field populated
   ```

## Support

- **Agora Documentation**: https://docs.agora.io/en/cloud-recording/
- **Cloud Recording API**: https://docs.agora.io/en/cloud-recording/restfulapi/
- **Agora Console**: https://console.agora.io
- **Agora Support**: support@agora.io

## Summary

✅ Recording automatically starts when interview begins
✅ Recording automatically stops when interview ends  
✅ Files saved to cloud storage (Agora Cloud or AWS S3)
✅ Metadata tracked in database
✅ Free tier: 10,000 minutes/month
✅ Production-ready implementation

**You're all set!** Just add the environment variables and recording will work automatically. 🎥🚀
