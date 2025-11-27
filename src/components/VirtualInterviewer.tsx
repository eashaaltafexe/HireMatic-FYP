'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, CheckCircle, Clock } from 'lucide-react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

interface Question {
  id: number;
  text: string;
  type?: string;
  difficulty?: string;
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
  
  const recognitionRef = useRef<any>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const questionTimerIntervalRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

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
      initializeGeminiInterview();
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
      console.log('Session ID:', sessionIdRef.current);
      console.log('Questions:', questions);
      
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

        // Update AI message and speak
        setAiMessage(data.response);
        await speak(data.response);

        // Update question index
        if (data.questionIndex !== undefined) {
          setCurrentQuestionIndex(data.questionIndex);
        }

        if (data.shouldContinue) {
          setIsAnswering(true);
          startQuestionTimer();
        } else {
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

  const endInterview = () => {
    setIsAnswering(false);
    stopQuestionTimer();
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (onComplete) {
      onComplete(answers);
    }
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
            {isBotSpeaking && <p className="text-yellow-400">🤖 AI Speaking...</p>}
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
    </div>
  );
}
