import { RtcTokenBuilder, RtcRole } from 'agora-token';

// Agora configuration
const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;
const AGORA_CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID!;
const AGORA_CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET!;

// Token expiration time (24 hours)
const TOKEN_EXPIRATION_TIME = 24 * 60 * 60;

export interface AgoraTokenOptions {
  channelName: string;
  userId: string;
  role?: 'publisher' | 'audience';
  expirationTimeInSeconds?: number;
}

export interface AgoraCredentials {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

export interface RecordingConfig {
  recordingMode: 'composite' | 'individual';
  maxIdleTime?: number; // seconds, max 30 days
  streamTypes?: number; // 0: audio only, 1: video only, 2: audio and video
  channelType?: number; // 0: communication, 1: live broadcast
}

export interface RecordingResource {
  resourceId: string;
}

export interface RecordingResponse {
  sid: string;
  resourceId: string;
}

export interface RecordingStatus {
  sid: string;
  resourceId: string;
  serverResponse: {
    fileListMode: string;
    fileList: Array<{
      filename: string;
      trackType: string;
      uid: string;
      mixedAllUser: boolean;
      isPlayable: boolean;
      sliceStartTime: number;
    }>;
    status: number;
    sliceStartTime: number;
  };
}

export class AgoraService {
  /**
   * Generate Agora RTC token for video call
   */
  static generateRtcToken(options: AgoraTokenOptions): string {
    const {
      channelName,
      userId,
      role = 'publisher',
      expirationTimeInSeconds = TOKEN_EXPIRATION_TIME
    } = options;

    console.log('[AgoraService] Generating RTC token:', {
      channelName,
      userId,
      role,
      appIdSet: !!AGORA_APP_ID,
      certificateSet: !!AGORA_APP_CERTIFICATE
    });

    if (!AGORA_APP_ID) {
      throw new Error('NEXT_PUBLIC_AGORA_APP_ID is not set in environment variables');
    }

    if (!AGORA_APP_CERTIFICATE) {
      throw new Error('AGORA_APP_CERTIFICATE is not set in environment variables');
    }

    // Convert userId to a numeric UID (Agora requires numeric UIDs)
    // We'll use a hash of the userId string to generate a consistent numeric UID
    const uid = AgoraService.generateNumericUid(userId);

    // Calculate privilege expiration time (current time + expiration)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Determine role
    const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    try {
      const token = RtcTokenBuilder.buildTokenWithUid(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        channelName,
        uid,
        agoraRole,
        privilegeExpiredTs,
        privilegeExpiredTs
      );

      console.log('[AgoraService] Token generated successfully for UID:', uid);
      return token;
    } catch (error) {
      console.error('[AgoraService] Error generating token:', error);
      throw new Error(`Failed to generate Agora token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate full Agora credentials for a user
   */
  static generateCredentials(options: AgoraTokenOptions): AgoraCredentials {
    const { channelName, userId } = options;
    
    const token = this.generateRtcToken(options);
    const uid = this.generateNumericUid(userId);

    return {
      appId: AGORA_APP_ID,
      channel: channelName,
      token: token,
      uid: uid
    };
  }

  /**
   * Convert a string userId to a numeric UID (required by Agora)
   * Uses a simple hash function to generate consistent numeric IDs
   */
  static generateNumericUid(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Ensure the UID is positive and within Agora's range (1 to 2^32-1)
    const uid = Math.abs(hash) % 2147483647;
    
    // Ensure UID is at least 1 (0 means Agora will auto-assign)
    return uid === 0 ? 1 : uid;
  }

  /**
   * Validate channel name (Agora has specific requirements)
   */
  static validateChannelName(channelName: string): boolean {
    // Channel name rules:
    // - ASCII letters, numbers, underscore, hyphen
    // - Max 64 characters
    // - Case sensitive
    const channelRegex = /^[a-zA-Z0-9_-]{1,64}$/;
    return channelRegex.test(channelName);
  }

  /**
   * Generate a valid channel name from interview ID
   */
  static generateChannelName(interviewId: string): string {
    // Replace any invalid characters with underscores
    const sanitized = interviewId.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Ensure it's within the 64-character limit
    const channelName = sanitized.substring(0, 64);
    
    console.log('[AgoraService] Generated channel name:', channelName);
    return channelName;
  }

  /**
   * Get Agora App ID (public, can be exposed to frontend)
   */
  static getAppId(): string {
    if (!AGORA_APP_ID) {
      throw new Error('NEXT_PUBLIC_AGORA_APP_ID is not set');
    }
    return AGORA_APP_ID;
  }

  /**
   * Acquire a resource ID for cloud recording
   * This must be called before starting recording
   */
  static async acquireRecordingResource(
    channelName: string,
    uid: string
  ): Promise<RecordingResource> {
    if (!AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
      throw new Error('Agora Customer ID and Secret are required for cloud recording');
    }

    const url = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/acquire`;
    
    const credentials = Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify({
        cname: channelName,
        uid: uid,
        clientRequest: {
          resourceExpiredHour: 24,
          scene: 0 // 0 for real-time recording
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AgoraService] Failed to acquire recording resource:', errorText);
      throw new Error(`Failed to acquire recording resource: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[AgoraService] Recording resource acquired:', data.resourceId);
    
    return {
      resourceId: data.resourceId
    };
  }

  /**
   * Start cloud recording for a channel
   */
  static async startRecording(
    channelName: string,
    uid: string,
    resourceId: string,
    token: string,
    config?: RecordingConfig
  ): Promise<RecordingResponse> {
    if (!AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
      throw new Error('Agora Customer ID and Secret are required for cloud recording');
    }

    const recordingMode = config?.recordingMode || 'composite';
    const url = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/mode/${recordingMode}/start`;
    
    const credentials = Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString('base64');

    const requestBody = {
      cname: channelName,
      uid: uid,
      clientRequest: {
        token: token,
        recordingConfig: {
          maxIdleTime: config?.maxIdleTime || 30,
          streamTypes: config?.streamTypes || 2, // audio and video
          channelType: config?.channelType || 0, // communication
          videoStreamType: 0, // high stream
          subscribeVideoUids: ['#allstream#'],
          subscribeAudioUids: ['#allstream#'],
          subscribeUidGroup: 0
        },
        recordingFileConfig: {
          avFileType: ['hls', 'mp4'] // Save as both HLS and MP4
        },
        storageConfig: {
          vendor: 1, // 1: AWS S3, 2: Alibaba Cloud, 3: Tencent Cloud, 5: Microsoft Azure, 6: Google Cloud, 7: Huawei Cloud
          region: 0, // depends on your storage region
          bucket: process.env.AGORA_RECORDING_BUCKET || 'hirematic-recordings',
          accessKey: process.env.AWS_ACCESS_KEY_ID || '',
          secretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          fileNamePrefix: [`interviews/${channelName}`]
        }
      }
    };

    console.log('[AgoraService] Starting recording for channel:', channelName);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AgoraService] Failed to start recording:', errorText);
      throw new Error(`Failed to start recording: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[AgoraService] Recording started successfully. SID:', data.sid);
    
    return {
      sid: data.sid,
      resourceId: resourceId
    };
  }

  /**
   * Stop cloud recording
   */
  static async stopRecording(
    channelName: string,
    uid: string,
    resourceId: string,
    sid: string
  ): Promise<RecordingStatus> {
    if (!AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
      throw new Error('Agora Customer ID and Secret are required for cloud recording');
    }

    const url = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/composite/stop`;
    
    const credentials = Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString('base64');

    console.log('[AgoraService] Stopping recording for channel:', channelName);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify({
        cname: channelName,
        uid: uid,
        clientRequest: {}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AgoraService] Failed to stop recording:', errorText);
      throw new Error(`Failed to stop recording: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[AgoraService] Recording stopped successfully');
    
    return data;
  }

  /**
   * Query recording status
   */
  static async queryRecording(
    resourceId: string,
    sid: string
  ): Promise<RecordingStatus> {
    if (!AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
      throw new Error('Agora Customer ID and Secret are required for cloud recording');
    }

    const url = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/composite/query`;
    
    const credentials = Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString('base64');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json;charset=utf-8'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AgoraService] Failed to query recording:', errorText);
      throw new Error(`Failed to query recording: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}

export default AgoraService;




