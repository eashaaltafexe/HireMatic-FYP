'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, CheckCircle, Clock } from 'lucide-react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import InterviewRecorder from './InterviewRecorder';

interface Question {
  id: number;
  text: string;
  type?: string;
  difficulty?: string;
  jobField?: string;
}

interface VirtualInterviewerProps {
  interviewId: string;
  applicationId: string;
  questions: Question[];
  jobTitle: string;
  candidateName: string;
  agoraAppId: string;
  agoraChannel: string;
  agoraToken: string;
  agoraUid: number;
  onComplete?: (answers: any[]) => void;
}

export default function VirtualInterviewer({
  interviewId,
  applicationId,
  questions,
  jobTitle,
  candidateName,
  agoraAppId,
  agoraChannel,
  agoraToken,
  agoraUid,
  onComplete
}: VirtualInterviewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [candidateMessage, setCandidateMessage] = useState('');
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [questionTimer, setQuestionTimer] = useState(90);
  const [answers, setAnswers] = useState<any[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEndingInterview, setIsEndingInterview] = useState(false);
  const [screenRecordingStatus, setScreenRecordingStatus] = useState<'idle' | 'requesting' | 'recording' | 'stopped'>('idle');
  
  const recognitionRef = useRef<any>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const questionTimerIntervalRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Screen recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);

  // Initialize Agora
  useEffect(() => {
    initializeAgora();
    return () => {
      cleanup();
    };
  }, []);

  // Start interview after Agora is ready
  useEffect(() => {
    if (interviewStarted) {
      console.log('🚀 Interview started! Questions prop:', questions);
      console.log('📊 Number of questions:', questions?.length);
      if (!questions || questions.length === 0) {
        console.error('❌ CRITICAL: No questions provided to VirtualInterviewer!');
        alert('Error: No interview questions loaded. Please refresh and try again.');
        return;
      }
      initializeGeminiInterview();
      // Start screen recording after interview starts
      setTimeout(() => {
        startScreenRecording();
      }, 2000);
    }
  }, [interviewStarted]);

  const initializeAgora = async () => {
    try {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      await client.join(agoraAppId, agoraChannel, agoraToken, agoraUid);
      console.log('✅ Joined Agora channel');

      // Create tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: {
          width: 640,
          height: 480,
          frameRate: 15,
          bitrateMin: 400,
          bitrateMax: 1000,
        }
      });

      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // Publish tracks
      await client.publish([audioTrack, videoTrack]);
      console.log('✅ Published tracks');

      setInterviewStarted(true);
    } catch (error) {
      console.error('❌ Agora error:', error);
    }
  };

  const initializeGeminiInterview = async () => {
    try {
      console.log('🎬 Initializing Gemini interview...');
      console.log('📋 Job Title:', jobTitle);
      console.log('👤 Candidate:', candidateName);
      console.log('🔑 Session ID:', sessionIdRef.current);
      console.log('❓ Total Questions:', questions.length);
      console.log('📊 Question Categories:', questions.map(q => q.jobField || 'Unknown').join(', '));
      console.log('📝 First Question:', questions[0]?.text);
      
      const response = await fetch('/api/interviews/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          sessionId: sessionIdRef.current,
          candidateName: candidateName,
          jobTitle: jobTitle,
          questions: questions
        })
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        setAiMessage(data.greeting);
        speak(data.greeting).then(() => {
          setIsAnswering(true);
          startSpeechRecognition();
          startQuestionTimer();
        });
      } else {
        console.error('❌ Failed to initialize:', data.error);
      }
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error);
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    // Stop existing recognition if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscriptAccumulator = '';

    recognition.onresult = (event: any) => {
      if (isBotSpeaking) {
        console.log('[Speech] Blocked - bot is speaking');
        return;
      }
      
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        finalTranscriptAccumulator += finalTranscript;
        setCurrentTranscript(finalTranscriptAccumulator);
        setCandidateMessage(finalTranscriptAccumulator);
      } else if (interimTranscript) {
        setCandidateMessage(finalTranscriptAccumulator + interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Speech] Error:', event.error);
      if (event.error === 'aborted' || event.error === 'no-speech') {
        // These are expected, don't restart immediately
        return;
      }
    };

    recognition.onend = () => {
      console.log('[Speech] Recognition ended');
      // Only restart if we're still supposed to be listening
      if (isAnswering && !isBotSpeaking) {
        setTimeout(() => {
          try {
            recognition.start();
            console.log('[Speech] Recognition restarted');
          } catch (e) {
            console.log('[Speech] Could not restart:', e);
          }
        }, 100);
      }
    };

    try {
      recognition.start();
      console.log('[Speech] Recognition started');
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('[Speech] Could not start recognition:', e);
    }
  };

  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log('[TTS] Starting to speak...');
      setIsBotSpeaking(true);
      
      // Stop recognition completely
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          console.log('[Speech] Stopped for TTS');
        } catch (e) {
          console.log('[Speech] Already stopped');
        }
      }

      // Clear transcript display
      setCurrentTranscript('');
      setCandidateMessage('');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        console.log('[TTS] Speech started');
      };

      utterance.onend = () => {
        console.log('[TTS] Speech ended');
        
        // Wait a moment before restarting recognition
        setTimeout(() => {
          setIsBotSpeaking(false);
          
          // Restart recognition if we should still be listening
          if (isAnswering && recognitionRef.current) {
            setTimeout(() => {
              try {
                recognitionRef.current.start();
                console.log('[Speech] Restarted after TTS');
              } catch (e) {
                console.log('[Speech] Could not restart after TTS');
              }
            }, 500);
          }
          resolve();
        }, 300);
      };

      utterance.onerror = (event) => {
        console.error('[TTS] Error:', event);
        setIsBotSpeaking(false);
        resolve();
      };

      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    });
  };

  const submitAnswer = async () => {
    if (!currentTranscript.trim()) {
      alert('Please provide an answer before submitting.');
      return;
    }

    const answer = currentTranscript.trim();
    
    // Stop question timer
    stopQuestionTimer();
    
    // Stop recognition temporarily
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    // Clear transcript immediately
    setCurrentTranscript('');
    setCandidateMessage('');
    setIsAnswering(false);

    try {
      console.log('[Submit] Sending answer to Gemini...');
      console.log('[Submit] Session ID:', sessionIdRef.current);
      console.log('[Submit] Current question index:', currentQuestionIndex);
      console.log('[Submit] Answer:', answer);
      
      // Call Gemini API for next response
      const response = await fetch('/api/interviews/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'next-response',
          sessionId: sessionIdRef.current,
          candidateAnswer: answer
        })
      });

      console.log('[Submit] Response status:', response.status);
      const data = await response.json();
      console.log('[Submit] Response data:', data);

      if (data.success) {
        // Save answer
        const newAnswer = {
          questionId: questions[currentQuestionIndex]?.id || currentQuestionIndex,
          questionText: questions[currentQuestionIndex]?.text || '',
          answer: answer,
          timestamp: new Date(),
          evaluation: {
            score: 0,
            feedback: '',
            keyPoints: []
          }
        };

        setAnswers(prev => [...prev, newAnswer]);
        console.log(`[Submit] ✅ Answer saved for question ${currentQuestionIndex + 1}`);

        // Update AI message and speak
        setAiMessage(data.response);
        console.log(`[Submit] 🗣️ Speaking response: ${data.response.substring(0, 50)}...`);
        await speak(data.response);

        // Update question index
        if (data.questionIndex !== undefined) {
          console.log(`[Submit] 📊 Moving to question index: ${data.questionIndex} (Question ${data.questionIndex + 1} of ${questions.length})`);
          setCurrentQuestionIndex(data.questionIndex);
        }

        if (data.shouldContinue) {
          console.log(`[Submit] ▶️ Continuing interview - ${questions.length - data.questionIndex} questions remaining`);
          setIsAnswering(true);
          startQuestionTimer();
        } else {
          console.log(`[Submit] 🏁 Interview complete - all ${questions.length} questions answered`);
          endInterview();
        }
      } else {
        console.error('[Submit] API error:', data.error);
        console.error('[Submit] Error details:', data.details);
        alert(`Failed to process answer: ${data.error || 'Unknown error'}. Please try again.`);
        setIsAnswering(true);
      }
    } catch (error: any) {
      console.error('[Submit] Error:', error);
      console.error('[Submit] Error message:', error.message);
      console.error('[Submit] Error stack:', error.stack);
      alert(`Network error: ${error.message || 'Unknown error'}. Please check your connection.`);
      setIsAnswering(true);
    }
  };

  const startQuestionTimer = () => {
    setQuestionTimer(90);
    questionTimerIntervalRef.current = setInterval(() => {
      setQuestionTimer(prev => {
        if (prev <= 1) {
          submitAnswer();
          return 90;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopQuestionTimer = () => {
    if (questionTimerIntervalRef.current) {
      clearInterval(questionTimerIntervalRef.current);
      questionTimerIntervalRef.current = null;
    }
  };

  const endInterview = async () => {
    if (isEndingInterview) {
      console.log('[Interview] Already ending interview, skipping...');
      return;
    }

    setIsEndingInterview(true);
    console.log('[Interview] 🏁 Ending interview...');
    
    // Stop answering and timers
    setIsAnswering(false);
    stopQuestionTimer();
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('[Interview] Stopped speech recognition');
      } catch (e) {
        console.log('[Interview] Speech recognition already stopped');
      }
    }

    // Stop TTS if speaking
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Stop screen recording
    console.log('[Interview] Stopping screen recording...');
    await stopScreenRecording();
    
    // Wait a moment for recording to finalize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Show completion modal
    setShowCompletionModal(true);
    
    // Call onComplete callback after a short delay to allow modal to show
    setTimeout(() => {
      if (onComplete) {
        onComplete(answers);
      }
    }, 500);
  };

  const toggleAudio = () => {
    if (localAudioTrackRef.current) {
      if (audioEnabled) {
        localAudioTrackRef.current.setEnabled(false);
      } else {
        localAudioTrackRef.current.setEnabled(true);
      }
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      if (videoEnabled) {
        localVideoTrackRef.current.setEnabled(false);
      } else {
        localVideoTrackRef.current.setEnabled(true);
      }
      setVideoEnabled(!videoEnabled);
    }
  };

  const startScreenRecording = async () => {
    try {
      console.log('[Screen Recording] 🎬 Starting screen recording...');
      setScreenRecordingStatus('requesting');

      // Request screen share with system audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // @ts-ignore - cursor is a valid DisplayMediaStreamConstraints property
          cursor: 'always',
          // @ts-ignore - displaySurface is a valid DisplayMediaStreamConstraints property
          displaySurface: 'monitor',
        } as any,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } as any,
      });

      displayStreamRef.current = displayStream;
      console.log('[Screen Recording] ✅ Screen share granted');

      // Create combined stream with screen video + microphone audio
      const combinedStream = new MediaStream();

      // Add screen video
      displayStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
        console.log('[Screen Recording] Added screen video track');
      });

      // Add system audio if available
      displayStream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
        console.log('[Screen Recording] Added system audio track');
      });

      // Add microphone audio
      if (localAudioTrackRef.current) {
        const micTrack = localAudioTrackRef.current.getMediaStreamTrack();
        combinedStream.addTrack(micTrack);
        console.log('[Screen Recording] 🎤 Added microphone audio');
      }

      // Initialize MediaRecorder
      recordedChunksRef.current = [];
      
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      console.log('[Screen Recording] Using mimeType:', mimeType);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log(`[Screen Recording] 📦 Chunk ${recordedChunksRef.current.length}: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log(`[Screen Recording] ⏹️ Recording stopped! Total chunks: ${recordedChunksRef.current.length}`);
        setScreenRecordingStatus('stopped');
        
        // Stop display stream tracks
        if (displayStreamRef.current) {
          displayStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Save the recording
        await saveScreenRecording();
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('[Screen Recording] ❌ Error:', event.error);
        setScreenRecordingStatus('idle');
      };

      mediaRecorder.onstart = () => {
        console.log('[Screen Recording] 🔴 Recording started');
        setScreenRecordingStatus('recording');
      };

      // Handle when user stops sharing screen
      displayStream.getVideoTracks()[0].onended = () => {
        console.log('[Screen Recording] User stopped screen sharing');
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      console.log(`[Screen Recording] ✅ Started with ${combinedStream.getVideoTracks().length} video + ${combinedStream.getAudioTracks().length} audio tracks`);
      
    } catch (error: any) {
      console.error('[Screen Recording] ❌ Failed to start:', error);
      setScreenRecordingStatus('idle');
      
      if (error.name === 'NotAllowedError') {
        alert('Screen recording permission denied. The interview will continue, but screen recording will not be available.');
      } else {
        alert(`Screen recording error: ${error.message}. The interview will continue without screen recording.`);
      }
    }
  };

  const stopScreenRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('[Screen Recording] Stopping recording...');
      mediaRecorderRef.current.stop();
    }
  };

  const saveScreenRecording = async () => {
    if (recordedChunksRef.current.length === 0) {
      console.log('[Screen Recording] No chunks to save');
      return;
    }

    try {
      console.log('[Screen Recording] 💾 Saving recording...');
      
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const fileSize = blob.size;
      console.log(`[Screen Recording] Created blob: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // Create FormData to upload
      const formData = new FormData();
      formData.append('recording', blob, `interview-${interviewId}-${Date.now()}.webm`);
      formData.append('interviewId', interviewId);
      formData.append('applicationId', applicationId);

      const token = localStorage.getItem('token');
      
      console.log('[Screen Recording] Uploading to server...');
      const response = await fetch('/api/interviews/upload-recording', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('[Screen Recording] ✅ Recording saved successfully:', result.data);
        setIsRecording(true); // Mark as recorded
      } else {
        console.error('[Screen Recording] ❌ Failed to save:', result.error);
        // Still allow interview to complete
      }
    } catch (error) {
      console.error('[Screen Recording] ❌ Error saving recording:', error);
      // Don't block interview completion
    }
  };

  const cleanup = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    stopQuestionTimer();

    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.close();
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.close();
    }
    if (clientRef.current) {
      await clientRef.current.leave();
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Video Section - Left 2/3 */}
      <div className="w-2/3 relative bg-black">
        <div ref={localVideoRef} className="w-full h-full" />
        
        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full ${audioEnabled ? 'bg-gray-700' : 'bg-red-600'}`}
          >
            {audioEnabled ? <Mic className="text-white" /> : <MicOff className="text-white" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${videoEnabled ? 'bg-gray-700' : 'bg-red-600'}`}
          >
            {videoEnabled ? <Video className="text-white" /> : <VideoOff className="text-white" />}
          </button>
          <button
            onClick={endInterview}
            className="p-4 rounded-full bg-red-600"
          >
            <Phone className="text-white" />
          </button>
        </div>
      </div>

      {/* Questions Panel - Right 1/3 */}
      <div className="w-1/3 bg-gradient-to-b from-purple-900 to-indigo-900 p-6 overflow-y-auto">
        <div className="text-white">
          {/* Recording Status Banner */}
          {screenRecordingStatus === 'recording' && (
            <div className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </div>
              <span className="text-sm font-semibold">Screen Recording Active</span>
            </div>
          )}
          
          <h2 className="text-2xl font-bold mb-4">{jobTitle} Interview</h2>
          
          {/* Question Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="flex items-center gap-1">
                <Clock size={16} /> {Math.floor(questionTimer / 60)}:{(questionTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Question */}
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Current Question:</h3>
            <p className="text-lg">{questions[currentQuestionIndex]?.text}</p>
          </div>

          {/* AI Message */}
          {aiMessage && (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  🤖
                </div>
                <p className="text-sm">{aiMessage}</p>
              </div>
            </div>
          )}

          {/* Candidate Message */}
          {candidateMessage && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  👤
                </div>
                <p className="text-sm">{candidateMessage}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="text-center mt-6">
            {isBotSpeaking && <p className="text-yellow-400">🤖 TalkHire Speaking...</p>}
            {isAnswering && !isBotSpeaking && <p className="text-green-400">🎤 Listening...</p>}
          </div>

          {/* Submit Button */}
          {isAnswering && !isBotSpeaking && currentTranscript && (
            <button
              onClick={submitAnswer}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              Submit Answer & Continue
            </button>
          )}

        </div>
      </div>

      {/* Interview Recorder - Auto-records entire interview */}
      <InterviewRecorder
        interviewId={interviewId}
        token={typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined}
        autoStart={true}
        onRecordingStart={(data) => {
          console.log('🔴 Recording started:', data);
          setIsRecording(true);
        }}
        onRecordingStop={(data) => {
          console.log('⏹️ Recording stopped:', data);
          setIsRecording(false);
        }}
        onError={(error) => console.error('❌ Recording error:', error)}
      />

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center animate-slideUp">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Interview Completed! 🎉</h2>
            </div>

            {/* Message */}
            <div className="mb-6 space-y-3">
              <p className="text-lg text-gray-700">
                Thank you for completing the interview!
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      {screenRecordingStatus === 'stopped' || isRecording
                        ? '✅ Your interview has been recorded'
                        : '📹 Your interview session has been saved'}
                    </p>
                    <p className="text-sm text-blue-700">
                      {screenRecordingStatus === 'stopped' || isRecording
                        ? 'The screen recording with audio and your responses have been saved successfully. Our team will review them and get back to you soon.'
                        : 'Your responses have been saved successfully. Our team will review them and get back to you soon.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Your interview recording will be reviewed by our team</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You'll receive your evaluation results via email</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Check your dashboard for updates on your application</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                window.location.href = '/candidate/applications';
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              View My Applications
            </button>

            <p className="text-xs text-gray-500 mt-4">
              You can close this window now
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
