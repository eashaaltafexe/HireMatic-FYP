import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

let globalClient: IAgoraRTCClient | null = null;
let currentChannel: string | null = null;

export const getAgoraClient = (channelId: string): IAgoraRTCClient => {
  // If we already have a client for this channel, return it
  if (globalClient && currentChannel === channelId) {
    console.log('[AgoraClient] Reusing existing client for channel:', channelId);
    return globalClient;
  }

  // If we have a client for a different channel, clean it up
  if (globalClient && currentChannel !== channelId) {
    console.log('[AgoraClient] Cleaning up old client for channel:', currentChannel);
    if (globalClient.connectionState === 'CONNECTED' || globalClient.connectionState === 'CONNECTING') {
      globalClient.leave().catch(console.error);
    }
    globalClient.removeAllListeners();
    globalClient = null;
    currentChannel = null;
  }

  // Create new client
  console.log('[AgoraClient] Creating new client for channel:', channelId);
  globalClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  currentChannel = channelId;

  return globalClient;
};

export const cleanupAgoraClient = async () => {
  if (globalClient) {
    console.log('[AgoraClient] Cleaning up global client');
    try {
      if (globalClient.connectionState === 'CONNECTED' || globalClient.connectionState === 'CONNECTING') {
        await globalClient.leave();
      }
      globalClient.removeAllListeners();
    } catch (error) {
      console.error('[AgoraClient] Error during cleanup:', error);
    }
    globalClient = null;
    currentChannel = null;
  }
};

export const getCurrentChannel = () => currentChannel;
export const getConnectionState = () => globalClient?.connectionState || 'DISCONNECTED';

export const waitForConnectionState = async (targetState: string, timeoutMs: number = 5000): Promise<boolean> => {
  if (!globalClient) return false;
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (globalClient.connectionState === targetState) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
};

export const isClientReady = (): boolean => {
  return globalClient !== null && 
         globalClient.connectionState !== 'CONNECTING' && 
         globalClient.connectionState !== 'RECONNECTING';
};


