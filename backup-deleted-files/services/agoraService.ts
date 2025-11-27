import { RtcTokenBuilder, RtcRole } from 'agora-token';

// Agora configuration
const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;

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
}

export default AgoraService;




