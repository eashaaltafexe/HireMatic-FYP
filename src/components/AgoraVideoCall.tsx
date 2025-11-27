'use client';

import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack
} from 'agora-rtc-sdk-ng';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff, 
  PhoneOff,
  Settings,
  Users,
  Maximize,
  Minimize,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from '@/utils/toast';
import { getAgoraClient, getConnectionState, waitForConnectionState, isClientReady, cleanupAgoraClient } from '@/application/services/agoraClient';

interface AgoraVideoCallProps {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  userName: string;
  interviewId?: string; // Add interview ID for recording
  onLeave?: () => void;
}

interface RemoteUser {
  user: IAgoraRTCRemoteUser;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
}

export default function AgoraVideoCall({
  appId,
  channel,
  token,
  uid,
  userName,
  interviewId,
  onLeave
}: AgoraVideoCallProps) {
  // Use global client instance to prevent double initialization
  const [client] = useState<IAgoraRTCClient>(() => getAgoraClient(channel));
  
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingData, setRecordingData] = useState<{ resourceId: string; sid: string } | null>(null);
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const isMountedRef = useRef(true);

  // Start cloud recording
  const startRecording = async () => {
    if (!interviewId || isRecording) {
      console.log('[Recording] Cannot start: no interviewId or already recording');
      return;
    }

    try {
      console.log('[Recording] Starting recording for interview:', interviewId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[Recording] No auth token found');
        return;
      }

      const response = await fetch('/api/interviews/recording/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ interviewId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsRecording(true);
        setRecordingData({
          resourceId: data.data.resourceId,
          sid: data.data.sid
        });
        console.log('[Recording] ✅ Recording started successfully');
        toast.success('Interview recording started');
      } else {
        console.error('[Recording] Failed to start:', data.error);
        toast.error('Failed to start recording');
      }
    } catch (error) {
      console.error('[Recording] Error starting recording:', error);
      toast.error('Error starting recording');
    }
  };

  // Stop cloud recording
  const stopRecording = async () => {
    if (!interviewId || !isRecording) {
      console.log('[Recording] Cannot stop: not recording');
      return;
    }

    try {
      console.log('[Recording] Stopping recording for interview:', interviewId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[Recording] No auth token found');
        return;
      }

      const response = await fetch('/api/interviews/recording/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ interviewId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsRecording(false);
        setRecordingData(null);
        console.log('[Recording] ✅ Recording stopped successfully');
        toast.success('Interview recording saved');
      } else {
        console.error('[Recording] Failed to stop:', data.error);
        toast.error('Failed to stop recording');
      }
    } catch (error) {
      console.error('[Recording] Error stopping recording:', error);
      toast.error('Error stopping recording');
    }
  };

  // Initialize and join channel
  useEffect(() => {
    isMountedRef.current = true;
    
    // Prevent double initialization in React Strict Mode
    if (hasInitialized.current) {
      console.log('[AgoraVideoCall] Already initialized, skipping...');
      return;
    }
    
    const init = async () => {
      try {
        // Check current connection state
        const connectionState = getConnectionState();
        console.log('[AgoraVideoCall] Connection state:', connectionState);
        
        // If already connected to the same channel, skip join
        if (connectionState === 'CONNECTED') {
          console.log('[AgoraVideoCall] Already connected, skipping join');
          setIsJoined(true);
          setIsConnecting(false);
          hasInitialized.current = true;
          return;
        }
        
        // If connecting, wait for it to complete
        if (connectionState === 'CONNECTING') {
          console.log('[AgoraVideoCall] Already connecting, waiting for completion...');
          const connected = await waitForConnectionState('CONNECTED', 5000);
          if (connected) {
            console.log('[AgoraVideoCall] Connection completed while waiting');
            setIsJoined(true);
            setIsConnecting(false);
            hasInitialized.current = true;
            return;
          } else {
            console.log('[AgoraVideoCall] Connection timeout, proceeding with new attempt');
            // Reset client if connection failed
            await cleanupAgoraClient();
          }
        }
        
        hasInitialized.current = true;
        console.log('[AgoraVideoCall] Initializing Agora with:', { appId, channel, uid });
        
        // Set up event listeners
        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);
        client.on('user-left', handleUserLeft);

        // Final safety check before joining
        if (!isClientReady()) {
          console.log('[AgoraVideoCall] Client not ready, skipping join');
          setIsConnecting(false);
          return;
        }

        // Join the channel
        console.log('[AgoraVideoCall] Attempting to join channel:', channel);
        await client.join(appId, channel, token, uid);
        
        if (!isMountedRef.current) return;
        
        console.log('[AgoraVideoCall] Successfully joined channel:', channel);

        // Create and publish local tracks
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        if (!isMountedRef.current) {
          // Component unmounted, cleanup tracks
          audioTrack.close();
          videoTrack.close();
          return;
        }

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        // Publish local tracks
        await client.publish([audioTrack, videoTrack]);
        console.log('[AgoraVideoCall] Published local tracks');

        if (isMountedRef.current) {
          setIsJoined(true);
          setIsConnecting(false);
          toast.success('Connected to interview room');
          
          // Auto-start recording if interviewId is provided
          if (interviewId) {
            setTimeout(() => startRecording(), 2000); // Start after 2 seconds
          }
        }

      } catch (error: any) {
        console.error('[AgoraVideoCall] Error initializing Agora:', error);
        
        if (isMountedRef.current) {
          toast.error('Failed to connect to video call');
          setIsConnecting(false);
        }
        
        // Reset on error so user can retry
        hasInitialized.current = false;
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      
      // Stop recording before leaving
      if (isRecording && interviewId) {
        stopRecording();
      }
      
      cleanup();
    };
  }, [appId, channel, token, uid, interviewId]);

  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    console.log('User published:', user.uid, mediaType);
    
    await client.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      setRemoteUsers(prev => {
        const existingUser = prev.find(u => u.user.uid === user.uid);
        if (existingUser) {
          return prev.map(u => 
            u.user.uid === user.uid 
              ? { ...u, videoTrack: user.videoTrack }
              : u
          );
        }
        return [...prev, { user, videoTrack: user.videoTrack }];
      });
    }
    
    if (mediaType === 'audio') {
      setRemoteUsers(prev => {
        const existingUser = prev.find(u => u.user.uid === user.uid);
        if (existingUser) {
          return prev.map(u => 
            u.user.uid === user.uid 
              ? { ...u, audioTrack: user.audioTrack }
              : u
          );
        }
        return [...prev, { user, audioTrack: user.audioTrack }];
      });
      
      // Play audio track
      if (user.audioTrack) {
        user.audioTrack.play();
      }
    }
  };

  const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    console.log('User unpublished:', user.uid, mediaType);
    
    if (mediaType === 'video') {
      setRemoteUsers(prev => 
        prev.map(u => 
          u.user.uid === user.uid 
            ? { ...u, videoTrack: undefined }
            : u
        )
      );
    }
    
    if (mediaType === 'audio') {
      setRemoteUsers(prev => 
        prev.map(u => 
          u.user.uid === user.uid 
            ? { ...u, audioTrack: undefined }
            : u
        )
      );
    }
  };

  const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    console.log('User left:', user.uid);
    setRemoteUsers(prev => prev.filter(u => u.user.uid !== user.uid));
    toast.info('Participant left the call');
  };

  const cleanup = async () => {
    try {
      console.log('[AgoraVideoCall] Cleaning up local resources...');
      
      // Stop and close local tracks
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }

      // Don't leave the channel here - global client manager handles it
      // Just unpublish our tracks if still connected
      if (client.connectionState === 'CONNECTED') {
        try {
          await client.unpublish();
          console.log('[AgoraVideoCall] Unpublished tracks');
        } catch (e) {
          // Ignore unpublish errors during cleanup
        }
      }
      
      // Reset initialization flag
      hasInitialized.current = false;
      
      console.log('[AgoraVideoCall] Cleaned up local resources');
    } catch (error) {
      console.error('[AgoraVideoCall] Error during cleanup:', error);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
      toast.info(isVideoEnabled ? 'Camera turned off' : 'Camera turned on');
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
      toast.info(isAudioEnabled ? 'Microphone muted' : 'Microphone unmuted');
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({});
        
        // Unpublish camera and publish screen
        if (localVideoTrack) {
          await client.unpublish([localVideoTrack]);
          localVideoTrack.stop();
          localVideoTrack.close();
        }
        
        await client.publish([screenTrack as any]);
        setLocalVideoTrack(screenTrack as any);
        setIsScreenSharing(true);
        
        if (localVideoRef.current) {
          (screenTrack as any).play(localVideoRef.current);
        }
        
        toast.success('Screen sharing started');
        
        // Listen for screen share stop
        (screenTrack as any).on('track-ended', async () => {
          await stopScreenShare();
        });
        
      } catch (error) {
        console.error('Screen share error:', error);
        toast.error('Failed to start screen sharing');
      }
    } else {
      await stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    try {
      if (localVideoTrack) {
        await client.unpublish([localVideoTrack]);
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      
      // Recreate camera track
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      setLocalVideoTrack(videoTrack);
      await client.publish([videoTrack]);
      
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }
      
      setIsScreenSharing(false);
      toast.info('Screen sharing stopped');
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLeave = async () => {
    try {
      await cleanup();
      
      // Now leave the channel completely
      if (client.connectionState === 'CONNECTED') {
        await client.leave();
        console.log('[AgoraVideoCall] Left the channel');
      }
      
      toast.success('Left the interview');
      onLeave?.();
    } catch (error) {
      console.error('[AgoraVideoCall] Error leaving:', error);
      toast.error('Error leaving interview');
    }
  };

  // Render remote user video
  useEffect(() => {
    remoteUsers.forEach(({ user, videoTrack }) => {
      if (videoTrack) {
        const remoteVideoContainer = document.getElementById(`remote-video-${user.uid}`);
        if (remoteVideoContainer) {
          videoTrack.play(remoteVideoContainer);
        }
      }
    });
  }, [remoteUsers]);

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Connecting to interview room...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-screen bg-gray-900 overflow-hidden">
      {/* Main Video Area */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {remoteUsers.length > 0 ? (
          <div className={`grid gap-4 w-full h-full ${
            remoteUsers.length === 1 ? 'grid-cols-1' : 
            remoteUsers.length === 2 ? 'grid-cols-2' :
            remoteUsers.length <= 4 ? 'grid-cols-2 grid-rows-2' :
            'grid-cols-3 grid-rows-3'
          }`}>
            {remoteUsers.map(({ user }) => (
              <div
                key={user.uid}
                className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center"
              >
                <div
                  id={`remote-video-${user.uid}`}
                  className="w-full h-full"
                />
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full">
                  <p className="text-white text-sm flex items-center gap-2">
                    <Users size={16} />
                    Interviewer {user.uid}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-gray-800 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4">
              <Users size={64} className="text-gray-600" />
            </div>
            <p className="text-white text-xl mb-2">Interview in progress...</p>
            <p className="text-gray-400">The AI interviewer is ready on the right panel</p>
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700">
        <div ref={localVideoRef} className="w-full h-full" />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded-full">
          <p className="text-white text-xs flex items-center gap-1">
            <Video size={12} />
            You ({userName})
          </p>
        </div>
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <VideoOff size={48} className="text-gray-600" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <div className="bg-gray-800 bg-opacity-80 px-3 py-2 rounded-lg">
              <p className="text-white text-sm flex items-center gap-2">
                <Users size={16} />
                {remoteUsers.length + 1} participants
              </p>
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all ${
                isAudioEnabled
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isAudioEnabled ? 'Mute' : 'Unmute'}
            >
              {isAudioEnabled ? (
                <Mic size={24} className="text-white" />
              ) : (
                <MicOff size={24} className="text-white" />
              )}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                isVideoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isVideoEnabled ? 'Stop video' : 'Start video'}
            >
              {isVideoEnabled ? (
                <Video size={24} className="text-white" />
              ) : (
                <VideoOff size={24} className="text-white" />
              )}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-all ${
                isScreenSharing
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              {isScreenSharing ? (
                <MonitorOff size={24} className="text-white" />
              ) : (
                <Monitor size={24} className="text-white" />
              )}
            </button>

            <button
              onClick={handleLeave}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
              title="Leave interview"
            >
              <PhoneOff size={24} className="text-white" />
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize size={20} className="text-white" />
              ) : (
                <Maximize size={20} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      {!isAudioEnabled && (
        <div className="absolute top-4 left-4 bg-red-600 px-3 py-2 rounded-full shadow-lg">
          <p className="text-white text-sm flex items-center gap-2">
            <MicOff size={16} />
            Microphone is off
          </p>
        </div>
      )}
    </div>
  );
}

