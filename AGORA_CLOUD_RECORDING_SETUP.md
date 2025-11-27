# Agora Cloud Recording Setup Guide

This document explains how to set up Agora Cloud Recording to automatically store all video interviews.

## Overview

The system uses Agora's Cloud Recording service to:
- **Automatically record** all video interviews
- **Store recordings** in cloud storage (AWS S3, Azure, Google Cloud, etc.)
- **Save in multiple formats** (HLS and MP4)
- **Track recording metadata** in MongoDB

## Prerequisites

### 1. Agora Console Setup

1. **Get Agora Credentials**:
   - Go to [Agora Console](https://console.agora.io/)
   - Select your project: `HireMatic`
   - Get the following credentials:
     - App ID: `ed29fd24322948eeb653746119ce7183` (already configured)
     - App Certificate: `f1cbab9561764bf8b3fc9b2ad44be158` (already configured)
     - Customer ID (RESTful API)
     - Customer Secret (RESTful API)

2. **Enable Cloud Recording**:
   - In Agora Console, go to **Products & Usage** → **Cloud Recording**
   - Enable the service
   - Note your Customer ID and Customer Secret for RESTful API

### 2. Cloud Storage Setup (AWS S3)

You need cloud storage to store recordings. Agora supports:
- AWS S3 (recommended)
- Alibaba Cloud OSS
- Microsoft Azure Blob Storage
- Google Cloud Storage
- Tencent Cloud COS
- Huawei Cloud OBS

#### AWS S3 Setup:

1. **Create S3 Bucket**:
   ```bash
   Bucket name: hirematic-recordings
   Region: us-east-1 (or your preferred region)
   ```

2. **Configure Bucket Permissions**:
   - Create IAM user with S3 write permissions
   - Get Access Key ID and Secret Access Key
   - Attach policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::hirematic-recordings",
           "arn:aws:s3:::hirematic-recordings/*"
         ]
       }
     ]
   }
   ```

3. **Enable CORS** (if you want to access recordings from browser):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

### 3. Environment Variables

Update your `.env.local` file with:

```env
# Agora.io Configuration
NEXT_PUBLIC_AGORA_APP_ID=ed29fd24322948eeb653746119ce7183
AGORA_APP_CERTIFICATE=f1cbab9561764bf8b3fc9b2ad44be158

# Agora Cloud Recording (RESTful API credentials)
AGORA_CUSTOMER_ID=your_customer_id_from_agora_console
AGORA_CUSTOMER_SECRET=your_customer_secret_from_agora_console

# AWS S3 for storing recordings
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AGORA_RECORDING_BUCKET=hirematic-recordings
```

## How It Works

### Recording Flow

1. **Interview Starts** → User joins video call
2. **Start Recording** → API call to `/api/interviews/recording/start`
   - Acquires Agora recording resource
   - Starts cloud recording with composite mode
   - Saves `resourceId` and `sid` to MongoDB
3. **Interview In Progress** → Agora records audio + video
4. **Interview Ends** → API call to `/api/interviews/recording/stop`
   - Stops cloud recording
   - Retrieves file list from Agora
   - Saves recording metadata to MongoDB
5. **Access Recordings** → Files stored in S3: `interviews/{channelName}/`

### Recording Configuration

The system uses **composite mode** with these settings:

```javascript
{
  recordingMode: 'composite',        // Combines all streams into one file
  maxIdleTime: 30,                   // Stop after 30 seconds of no users
  streamTypes: 2,                    // Record both audio and video
  channelType: 0,                    // Communication mode
  avFileType: ['hls', 'mp4'],       // Save in HLS and MP4 formats
  subscribeVideoUids: ['#allstream#'], // Record all participants
  subscribeAudioUids: ['#allstream#']  // Record all audio
}
```

### File Storage Structure

Recordings are stored in S3 with this structure:

```
hirematic-recordings/
├── interviews/
│   ├── {channelName}/
│   │   ├── {sid}_{timestamp}.m3u8  (HLS playlist)
│   │   ├── {sid}_{timestamp}.ts    (HLS segments)
│   │   └── {sid}_{timestamp}.mp4   (MP4 file)
```

## API Endpoints

### Start Recording

```http
POST /api/interviews/recording/start
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "interviewId": "65f3b2a4c1234567890abcde"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recording started successfully",
  "data": {
    "resourceId": "JyvK8nXHuV1BE64GDkAaBGEscvtHW7v8BrQoRPCHxmeVxwY22-x-kv4GdPcjZeMzoCBUCOr9q-k6wBWMC7SaAkZ",
    "sid": "38f8e3cfdc474cd56fc1ceba380d7e1a",
    "channelName": "65f3b2a4c1234567890abcde"
  }
}
```

### Stop Recording

```http
POST /api/interviews/recording/stop
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "interviewId": "65f3b2a4c1234567890abcde"
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
        "filename": "38f8e3cfdc474cd56fc1ceba380d7e1a_65f3b2a4c1234567890abcde.m3u8",
        "trackType": "audio_and_video",
        "uid": "recorder_1234567890",
        "mixedAllUser": true,
        "isPlayable": true,
        "sliceStartTime": 1645123456789
      }
    ],
    "status": "completed"
  }
}
```

## MongoDB Schema

Recording data is stored in the `Interview` model:

```typescript
recording: {
  resourceId: string;        // Agora resource ID
  sid: string;              // Agora session ID
  recordingUid: string;     // Recording bot UID
  startedAt: Date;          // When recording started
  stoppedAt: Date;          // When recording stopped
  status: 'recording' | 'completed' | 'failed';
  files: Array<{
    filename: string;       // File name in S3
    trackType: string;      // 'audio_and_video'
    uid: string;           // Recorder UID
    mixedAllUser: boolean; // true for composite
    isPlayable: boolean;   // true when ready
    sliceStartTime: number; // Timestamp
  }>;
}
```

## Integration in Interview Pages

### Automatic Recording (Main System)

In the main interview page, add recording controls:

```tsx
// Start recording when interview begins
const startRecording = async () => {
  try {
    const response = await fetch('/api/interviews/recording/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ interviewId })
    });
    const result = await response.json();
    console.log('Recording started:', result);
  } catch (error) {
    console.error('Failed to start recording:', error);
  }
};

// Stop recording when interview ends
const stopRecording = async () => {
  try {
    const response = await fetch('/api/interviews/recording/stop', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ interviewId })
    });
    const result = await response.json();
    console.log('Recording stopped:', result);
  } catch (error) {
    console.error('Failed to stop recording:', error);
  }
};
```

### Test Mode

For test interviews (TEST-INTERVIEW), recording is automatically skipped to avoid errors.

## Troubleshooting

### Common Issues

1. **"Failed to acquire recording resource"**
   - Check AGORA_CUSTOMER_ID and AGORA_CUSTOMER_SECRET
   - Verify Cloud Recording is enabled in Agora Console

2. **"Failed to start recording"**
   - Check AWS credentials (ACCESS_KEY_ID, SECRET_ACCESS_KEY)
   - Verify S3 bucket exists and has correct permissions
   - Check AGORA_RECORDING_BUCKET matches your bucket name

3. **"No recording files found"**
   - Recording stops after `maxIdleTime` if no users in channel
   - Check S3 bucket for files under `interviews/{channelName}/`
   - Verify recording status in MongoDB

4. **Storage Region Mismatch**
   - Update `region` in `storageConfig` to match your S3 bucket region:
     - 0: US East (Virginia)
     - 1: US East (Ohio)
     - 2: US West (Oregon)
     - etc.

### Debug Logging

Enable detailed logging in `agoraService.ts`:

```typescript
console.log('[AgoraService] Request:', requestBody);
console.log('[AgoraService] Response:', await response.text());
```

## Cost Considerations

### Agora Pricing

- **Cloud Recording**: Charged per minute based on resolution
- **Storage**: Charged by your cloud provider (AWS S3)

**Example Cost (AWS S3):**
- 1 hour interview = ~500MB (720p MP4)
- Storage: $0.023 per GB/month
- 100 interviews/month = ~50GB = $1.15/month

**Example Cost (Agora):**
- HD recording: ~$2.99 per 1000 minutes
- 100 x 45-min interviews = 4500 minutes = ~$13.50/month

## Best Practices

1. **Auto-cleanup**: Set S3 lifecycle policies to delete old recordings
2. **Compression**: Use MP4 format for smaller file sizes
3. **Security**: Use signed URLs for accessing recordings
4. **Monitoring**: Track recording failures in logs
5. **Backup**: Consider replication to another region

## Next Steps

1. ✅ Configure environment variables
2. ✅ Set up AWS S3 bucket
3. ✅ Get Agora Customer ID and Secret
4. ✅ Test recording with `/api/interviews/recording/start`
5. ✅ Verify files appear in S3
6. ✅ Integrate into main interview flow

## Support

- **Agora Documentation**: https://docs.agora.io/en/cloud-recording/
- **AWS S3 Guide**: https://docs.aws.amazon.com/s3/
- **Issue Tracker**: Create issue in project repository
