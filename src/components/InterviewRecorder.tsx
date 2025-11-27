'use client';

import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Loader2, AlertCircle } from 'lucide-react';

interface InterviewRecorderProps {
  interviewId: string;
  token?: string;
  autoStart?: boolean;
  onRecordingStart?: (data: any) => void;
  onRecordingStop?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * Automatic interview recorder component
 * Handles Agora Cloud Recording start/stop
 */
export default function InterviewRecorder({
  interviewId,
  token,
  autoStart = true,
  onRecordingStart,
  onRecordingStop,
  onError
}: InterviewRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordingStartedRef = useRef(false);

  // Auto-start recording when component mounts
  useEffect(() => {
    if (autoStart && !recordingStartedRef.current) {
      startRecording();
    }

    // Auto-stop recording when component unmounts (user leaves)
    return () => {
      if (recordingStartedRef.current) {
        stopRecording();
      }
    };
  }, [autoStart]);

  const startRecording = async () => {
    // Skip if already started or test mode
    if (recordingStartedRef.current || interviewId.startsWith('TEST-')) {
      console.log('[Recorder] Skipping recording (test mode or already started)');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[Recorder] Starting recording for interview:', interviewId);

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/interviews/recording/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ interviewId })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to start recording');
      }

      recordingStartedRef.current = true;
      setIsRecording(true);
      console.log('[Recorder] ✅ Recording started:', result.data);

      if (onRecordingStart) {
        onRecordingStart(result.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      console.error('[Recorder] ❌ Error starting recording:', errorMessage);
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    // Skip if not started or test mode
    if (!recordingStartedRef.current || interviewId.startsWith('TEST-')) {
      console.log('[Recorder] Skipping stop recording (test mode or not started)');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Recorder] Stopping recording for interview:', interviewId);

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/interviews/recording/stop', {
        method: 'POST',
        headers,
        body: JSON.stringify({ interviewId })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to stop recording');
      }

      recordingStartedRef.current = false;
      setIsRecording(false);
      console.log('[Recorder] ✅ Recording stopped:', result.data);

      if (onRecordingStop) {
        onRecordingStop(result.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      console.error('[Recorder] ❌ Error stopping recording:', errorMessage);
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render UI in test mode
  if (interviewId.startsWith('TEST-')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : isRecording ? (
              <Video className="w-5 h-5 text-green-600" />
            ) : error ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <VideoOff className="w-5 h-5 text-gray-400" />
            )}
            
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {isLoading ? 'Processing...' : isRecording ? 'Recording' : error ? 'Error' : 'Not Recording'}
              </p>
              {error && (
                <p className="text-xs text-red-600 max-w-[150px] truncate" title={error}>
                  {error}
                </p>
              )}
              {isRecording && (
                <p className="text-xs text-gray-500">Cloud recording active</p>
              )}
            </div>
          </div>

          {/* Manual controls (optional) */}
          {!autoStart && (
            <div className="flex gap-1">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isLoading}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  disabled={isLoading}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Stop
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recording indicator pulse */}
        {isRecording && (
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
            </div>
            <span className="text-xs text-gray-600">Live recording in progress</span>
          </div>
        )}
      </div>
    </div>
  );
}
