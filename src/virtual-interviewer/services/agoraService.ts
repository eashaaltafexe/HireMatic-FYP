import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack 
} from 'agora-rtc-sdk-ng';

// Agora Configuration
const AGORA_APP_ID = 'ed29fd24322948eeb653746119ce7183';

export interface AgoraConfig {
  appId: string;
  channel: string;
  token: string | null;
  uid: string | number;
}

export class AgoraVideoService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private remoteUsers: Map<string | number, {
    audioTrack?: IRemoteAudioTrack;
    videoTrack?: IRemoteVideoTrack;
  }> = new Map();

  constructor() {
    // Set Agora SDK log level
    AgoraRTC.setLogLevel(1); // 0: Debug, 1: Info, 2: Warning, 3: Error, 4: None
  }

  /**
   * Initialize Agora client
   */
  async initialize(config: AgoraConfig): Promise<void> {
    try {
      // Create Agora client
      this.client = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      });

      // Set up event listeners
      this.setupEventListeners();

      console.log('[Agora] Client initialized successfully');
    } catch (error) {
      console.error('[Agora] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Join video channel
   */
  async joinChannel(config: AgoraConfig): Promise<void> {
    if (!this.client) {
      throw new Error('Agora client not initialized');
    }

    try {
      // Join the channel (use null for token in testing mode)
      await this.client.join(
        config.appId,
        config.channel,
        null, // Use null for testing without certificate
        config.uid
      );

      console.log('[Agora] Joined channel:', config.channel);

      // Create and publish local tracks
      await this.createLocalTracks();
      await this.publishLocalTracks();

    } catch (error) {
      console.error('[Agora] Failed to join channel:', error);
      throw error;
    }
  }

  /**
   * Create local audio and video tracks
   */
  async createLocalTracks(): Promise<void> {
    try {
      // Create microphone audio track
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard',
      });

      // Create camera video track with fallback settings
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: {
          width: 640,
          height: 480,
          frameRate: 15,
          bitrateMin: 400,
          bitrateMax: 1000,
        },
      });

      console.log('[Agora] Local tracks created');
    } catch (error) {
      console.error('[Agora] Failed to create local tracks:', error);
      throw error;
    }
  }

  /**
   * Publish local tracks to channel
   */
  async publishLocalTracks(): Promise<void> {
    if (!this.client || !this.localAudioTrack || !this.localVideoTrack) {
      throw new Error('Client or tracks not ready');
    }

    try {
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
      console.log('[Agora] Local tracks published');
    } catch (error) {
      console.error('[Agora] Failed to publish tracks:', error);
      throw error;
    }
  }

  /**
   * Play local video in a container
   */
  playLocalVideo(containerElement: HTMLElement): void {
    if (this.localVideoTrack) {
      this.localVideoTrack.play(containerElement);
      console.log('[Agora] Playing local video');
    }
  }

  /**
   * Play remote video in a container
   */
  playRemoteVideo(uid: string | number, containerElement: HTMLElement): void {
    const user = this.remoteUsers.get(uid);
    if (user?.videoTrack) {
      user.videoTrack.play(containerElement);
      console.log('[Agora] Playing remote video for user:', uid);
    }
  }

  /**
   * Mute/Unmute local audio
   */
  async toggleAudio(muted: boolean): Promise<void> {
    if (this.localAudioTrack) {
      await this.localAudioTrack.setEnabled(!muted);
      console.log('[Agora] Audio', muted ? 'muted' : 'unmuted');
    }
  }

  /**
   * Mute/Unmute local video
   */
  async toggleVideo(muted: boolean): Promise<void> {
    if (this.localVideoTrack) {
      await this.localVideoTrack.setEnabled(!muted);
      console.log('[Agora] Video', muted ? 'muted' : 'unmuted');
    }
  }

  /**
   * Leave channel and clean up
   */
  async leaveChannel(): Promise<void> {
    try {
      // Close local tracks
      this.localAudioTrack?.close();
      this.localVideoTrack?.close();

      // Leave channel
      if (this.client) {
        await this.client.leave();
        console.log('[Agora] Left channel');
      }

      // Clean up
      this.localAudioTrack = null;
      this.localVideoTrack = null;
      this.remoteUsers.clear();

    } catch (error) {
      console.error('[Agora] Failed to leave channel:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for remote users
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    // User joined
    this.client.on('user-published', async (user, mediaType) => {
      console.log('[Agora] User published:', user.uid, mediaType);

      // Subscribe to remote user
      await this.client!.subscribe(user, mediaType);

      // Store remote tracks
      if (!this.remoteUsers.has(user.uid)) {
        this.remoteUsers.set(user.uid, {});
      }

      const remoteUser = this.remoteUsers.get(user.uid)!;

      if (mediaType === 'video') {
        remoteUser.videoTrack = user.videoTrack;
        console.log('[Agora] Remote video track received');
      }

      if (mediaType === 'audio') {
        remoteUser.audioTrack = user.audioTrack;
        // Auto-play remote audio
        user.audioTrack?.play();
        console.log('[Agora] Remote audio track received and playing');
      }
    });

    // User unpublished
    this.client.on('user-unpublished', (user, mediaType) => {
      console.log('[Agora] User unpublished:', user.uid, mediaType);

      const remoteUser = this.remoteUsers.get(user.uid);
      if (remoteUser) {
        if (mediaType === 'video') {
          remoteUser.videoTrack = undefined;
        }
        if (mediaType === 'audio') {
          remoteUser.audioTrack = undefined;
        }
      }
    });

    // User left
    this.client.on('user-left', (user) => {
      console.log('[Agora] User left:', user.uid);
      this.remoteUsers.delete(user.uid);
    });
  }

  /**
   * Get local video track
   */
  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  /**
   * Get local audio track
   */
  getLocalAudioTrack(): IMicrophoneAudioTrack | null {
    return this.localAudioTrack;
  }

  /**
   * Get remote users
   */
  getRemoteUsers(): Map<string | number, { audioTrack?: IRemoteAudioTrack; videoTrack?: IRemoteVideoTrack }> {
    return this.remoteUsers;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.connectionState === 'CONNECTED';
  }
}

export default AgoraVideoService;
