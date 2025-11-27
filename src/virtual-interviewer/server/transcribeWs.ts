import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface AudioChunk {
  data: Buffer;
  timestamp: number;
}

interface ClientSession {
  id: string;
  audioChunks: AudioChunk[];
  startTime: number;
  lastActivity: number;
}

const sessions = new Map<WebSocket, ClientSession>();

/**
 * Setup WebSocket server for real-time transcription
 */
export function setupTranscribeWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws/transcribe'
  });

  console.log('[Transcribe WS] WebSocket server initialized on path: /ws/transcribe');

  wss.on('connection', (ws: WebSocket) => {
    const sessionId = generateSessionId();
    const session: ClientSession = {
      id: sessionId,
      audioChunks: [],
      startTime: Date.now(),
      lastActivity: Date.now()
    };
    
    sessions.set(ws, session);
    console.log(`[Transcribe WS] Client ${sessionId} connected (Total: ${sessions.size})`);
    
    // Send connection confirmation
    ws.send(JSON.stringify({ 
      type: 'info', 
      msg: 'Connected to transcription service',
      sessionId 
    }));

    ws.on('message', async (data) => {
      session.lastActivity = Date.now();

      if (data instanceof Buffer) {
        // Audio chunk received
        console.log(`[Transcribe WS] ${sessionId}: Received audio chunk (${data.length} bytes)`);
        
        session.audioChunks.push({
          data: data,
          timestamp: Date.now()
        });

        try {
          // Process audio chunk - integrate with transcription service here
          const transcript = await processAudioChunk(data, session);
          
          // Send partial transcript back to client
          if (transcript.partial) {
            ws.send(JSON.stringify({ 
              type: 'partial', 
              text: transcript.partial,
              timestamp: Date.now()
            }));
          }

          // Send final transcript when complete
          if (transcript.final) {
            ws.send(JSON.stringify({ 
              type: 'final', 
              text: transcript.final,
              timestamp: Date.now()
            }));
          }
        } catch (error) {
          console.error(`[Transcribe WS] ${sessionId}: Error processing audio:`, error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            msg: 'Failed to process audio chunk' 
          }));
        }
      } else {
        // Control message (JSON string)
        try {
          const msg = JSON.parse(data.toString());
          console.log(`[Transcribe WS] ${sessionId}: Control message:`, msg.type);

          switch (msg.type) {
            case 'done':
              // Interview complete - save final transcript
              console.log(`[Transcribe WS] ${sessionId}: Interview completed`);
              const finalTranscript = msg.payload || [];
              console.log(`[Transcribe WS] ${sessionId}: Saved ${finalTranscript.length} answers`);
              
              // Optionally save to database here
              // await saveTranscriptToDatabase(sessionId, finalTranscript);
              
              // Clear session chunks
              session.audioChunks = [];
              
              ws.send(JSON.stringify({ 
                type: 'info', 
                msg: 'Transcript saved successfully' 
              }));
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;

            default:
              console.log(`[Transcribe WS] ${sessionId}: Unknown message type:`, msg.type);
          }
        } catch (e) {
          console.error(`[Transcribe WS] ${sessionId}: Failed to parse control message:`, e);
        }
      }
    });

    ws.on('close', () => {
      console.log(`[Transcribe WS] ${sessionId}: Client disconnected`);
      
      // Cleanup session
      const sessionData = sessions.get(ws);
      if (sessionData) {
        const duration = Date.now() - sessionData.startTime;
        console.log(`[Transcribe WS] ${sessionId}: Session duration: ${Math.round(duration / 1000)}s`);
        console.log(`[Transcribe WS] ${sessionId}: Collected ${sessionData.audioChunks.length} audio chunks`);
      }
      
      sessions.delete(ws);
      console.log(`[Transcribe WS] Active sessions: ${sessions.size}`);
    });

    ws.on('error', (err) => {
      console.error(`[Transcribe WS] ${sessionId}: WebSocket error:`, err);
      sessions.delete(ws);
    });
  });

  // Cleanup inactive sessions every 5 minutes
  setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    sessions.forEach((session, ws) => {
      if (now - session.lastActivity > timeout) {
        console.log(`[Transcribe WS] ${session.id}: Closing inactive session`);
        ws.close();
        sessions.delete(ws);
      }
    });
  }, 60000); // Check every minute

  return wss;
}

/**
 * Process audio chunk and return transcription
 * TODO: Integrate with Google Speech-to-Text, Azure, or Whisper
 */
async function processAudioChunk(
  audioData: Buffer, 
  session: ClientSession
): Promise<{ partial?: string; final?: string }> {
  // Placeholder implementation
  // In production, integrate with a real transcription service:
  
  // Example integrations:
  // 1. Google Speech-to-Text API
  // 2. Azure Speech Services
  // 3. OpenAI Whisper
  // 4. Assembly.AI
  
  // For now, return a mock response to test the flow
  const chunkCount = session.audioChunks.length;
  
  if (chunkCount % 10 === 0) {
    // Every 10 chunks, send a partial update
    return {
      partial: `Transcribing... (${chunkCount} chunks received)`
    };
  }
  
  // Return empty to avoid spamming
  return {};
  
  /* 
  // Example Google Speech-to-Text integration:
  const speech = require('@google-cloud/speech');
  const client = new speech.SpeechClient();
  
  const request = {
    audio: { content: audioData.toString('base64') },
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'en-US',
    },
  };
  
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  
  return { final: transcription };
  */
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Optional: Save transcript to database
 */
async function saveTranscriptToDatabase(sessionId: string, transcript: any[]): Promise<void> {
  // TODO: Implement database save
  // Example:
  // await Interview.findByIdAndUpdate(interviewId, {
  //   transcript: transcript,
  //   transcriptSavedAt: new Date()
  // });
  
  console.log(`[Transcribe WS] ${sessionId}: Would save transcript to DB:`, transcript.length, 'entries');
}
