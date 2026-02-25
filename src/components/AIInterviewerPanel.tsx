'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle, Mic, Volume2, VolumeX, X, MessageCircle } from 'lucide-react';
import { toast } from '@/utils/toast';

/**
 * Minimal types
 */
interface Question { 
  id: number; 
  text: string;
  type?: string;
  difficulty?: string;
  jobField?: string;
}

interface AIInterviewerProps {
  interviewId?: string;
  applicationId?: string;
  questions: Question[];
  jobTitle?: string;
  candidateName?: string;
  onComplete?: (transcript: any[]) => void;
}

/**
 * Utility: wait
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Hook: useVAD
 * - Creates AudioContext and analyzes time domain to estimate RMS energy.
 * - Calls onVoiceStart/onVoiceStop with debouncing to avoid flapping.
 */
function useVAD({
  onVoiceStart,
  onVoiceStop,
  sensitivity = 0.01,
  smoothingInterval = 100,
}: {
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  sensitivity?: number; // RMS threshold
  smoothingInterval?: number; // ms sample interval
}) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speakingRef = useRef(false);
  const silenceDebounceRef = useRef<number | null>(null);

  const start = useCallback(async () => {
    if (audioCtxRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;

    const buffer = new Float32Array(analyser.fftSize);

    const sample = () => {
      analyser!.getFloatTimeDomainData(buffer);
      // compute RMS
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sum / buffer.length);
      if (rms > sensitivity) {
        // voice detected
        if (!speakingRef.current) {
          speakingRef.current = true;
          onVoiceStart();
        }
        // clear potential silence debounce
        if (silenceDebounceRef.current) {
          window.clearTimeout(silenceDebounceRef.current);
          silenceDebounceRef.current = null;
        }
      } else {
        // schedule voice stop after short debounce (to allow natural pauses)
        if (speakingRef.current && !silenceDebounceRef.current) {
          silenceDebounceRef.current = window.setTimeout(() => {
            speakingRef.current = false;
            silenceDebounceRef.current = null;
            onVoiceStop();
          }, Math.max(300, smoothingInterval)); // keep small buffer
        }
      }
      rafRef.current = window.setTimeout(sample, smoothingInterval);
    };

    sample();
  }, [onVoiceStart, onVoiceStop, sensitivity, smoothingInterval]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      window.clearTimeout(rafRef.current);
      rafRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  return { start, stop };
}

/**
 * Hook: useMediaRecorderSender
 * - Starts MediaRecorder when requested and sends audio blobs to a WebSocket.
 */
function useMediaRecorderSender(wsUrl: string) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const isRecordingRef = useRef(false);

  // create socket
  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;
    ws.onopen = () => console.log('[Transcribe WS] open');
    ws.onclose = () => console.log('[Transcribe WS] closed');
    ws.onerror = (e) => console.error('[Transcribe WS] error', e);
    return () => {
      try { ws.close(); } catch (e) {}
      wsRef.current = null;
    };
  }, [wsUrl]);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        const reader = new FileReader();
        reader.onload = () => {
          const arr = reader.result as ArrayBuffer;
          try {
            wsRef.current?.send(arr);
          } catch (e) {
            console.error('[Transcribe WS] send failed', e);
          }
        };
        reader.readAsArrayBuffer(ev.data);
      }
    };
    recorder.start(250); // emit chunks every 250ms
    isRecordingRef.current = true;
    console.log('[Recorder] started');
  }, []);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    try {
      mediaRecorderRef.current?.stop();
    } catch (e) {}
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (e) {}
    mediaRecorderRef.current = null;
    streamRef.current = null;
    isRecordingRef.current = false;
    console.log('[Recorder] stopped');
  }, []);

  const sendControl = useCallback((data: any) => {
    try {
      wsRef.current?.send(JSON.stringify(data));
    } catch (e) {
      console.error('[Transcribe WS] control send fail', e);
    }
  }, []);

  return { startRecording, stopRecording, sendControl, wsRef };
}

/**
 * Hook: useTTS
 */
function useTTS() {
  const speakingRef = useRef(false);
  const speak = useCallback(async (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.95;
    u.pitch = 1;
    return new Promise<void>((resolve) => {
      u.onstart = () => { speakingRef.current = true; };
      u.onend = () => { speakingRef.current = false; resolve(); };
      u.onerror = () => { speakingRef.current = false; resolve(); };
      window.speechSynthesis.speak(u);
    });
  }, []);
  return { speak };
}

/**
 * The main component
 */
export default function AIInterviewerPanel({
  questions,
  onComplete,
  jobTitle,
  candidateName,
}: AIInterviewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isTTSOn, setIsTTSOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState<Array<any>>([]);
  const [partialText, setPartialText] = useState('');
  const [wsOpen, setWsOpen] = useState(false);

  const SILENCE_AFTER_MS = 60000; // 1 minute
  const PROMPT_AFTER_MS = 15000; // 15 seconds
  const TRANSCRIBE_WS = typeof window !== 'undefined' ? `${window.location.origin.replace(/^http/, 'ws')}/ws/transcribe` : '/ws/transcribe';

  const silenceTimerRef = useRef<number | null>(null);
  const promptTimerRef = useRef<number | null>(null);
  const promptedRef = useRef(false);
  const listeningStateRef = useRef<'idle' | 'listening' | 'processing'>('idle');
  const interviewTranscriptRef = useRef<any[]>([]);
  const recorder = useMediaRecorderSender(TRANSCRIBE_WS);
  const tts = useTTS();

  const vad = useVAD({
    sensitivity: 0.01,
    smoothingInterval: 120,
    onVoiceStart: () => {
      console.log('[VAD] voice start');
      listeningStateRef.current = 'listening';
      setIsListening(true);
      recorder.startRecording().catch(console.error);
      // Clear only prompt timer when user speaks (keep 1-minute timer running)
      if (promptTimerRef.current) {
        window.clearTimeout(promptTimerRef.current);
        promptTimerRef.current = null;
      }
      promptedRef.current = false;
    },
    onVoiceStop: () => {
      console.log('[VAD] voice stop');
      
      // Start 15-second prompt timer
      if (promptTimerRef.current) window.clearTimeout(promptTimerRef.current);
      promptTimerRef.current = window.setTimeout(() => {
        if (!promptedRef.current) {
          console.log('[VAD] 15 seconds silence - prompting');
          promptedRef.current = true;
          tts.speak('Please answer the question.');
        }
      }, PROMPT_AFTER_MS);
    },
  });

  useEffect(() => {
    const ws = recorder.wsRef.current;
    if (!ws) return;
    const handlerOpen = () => setWsOpen(true);
    const handlerClose = () => setWsOpen(false);
    const handlerMessage = (ev: MessageEvent) => {
      try {
        if (typeof ev.data === 'string') {
          const parsed = JSON.parse(ev.data);
          if (parsed.type === 'partial') {
            setPartialText(parsed.text || '');
            setLiveTranscript(parsed.text || '');
          } else if (parsed.type === 'final') {
            const text = parsed.text || '';
            setPartialText('');
            setLiveTranscript(text);
            console.log('[WS] final transcript:', text);
          }
        }
      } catch (e) { console.error(e); }
    };
    ws.addEventListener('open', handlerOpen);
    ws.addEventListener('close', handlerClose);
    ws.addEventListener('message', handlerMessage);
    return () => {
      try {
        ws.removeEventListener('open', handlerOpen);
        ws.removeEventListener('close', handlerClose);
        ws.removeEventListener('message', handlerMessage);
      } catch (e) {}
    };
  }, [recorder.wsRef]);

  const onCandidateSilence = useCallback(async () => {
    if (listeningStateRef.current === 'processing') return;
    listeningStateRef.current = 'processing';
    setIsListening(false);
    recorder.stopRecording();
    console.log('[Interview] Finalizing answer for question', currentIndex + 1);

    await wait(800);

    const answerText = liveTranscript || partialText || '(No response)';
    const q = questions[currentIndex];
    const record = {
      questionId: q.id,
      questionText: q.text,
      answer: answerText,
      timestamp: new Date().toISOString(),
    };
    interviewTranscriptRef.current.push(record);
    setFinalTranscript([...interviewTranscriptRef.current]);
    console.log('[Interview] Saved answer', record);

    await wait(450);
    const next = currentIndex + 1;
    if (next < questions.length) {
      setCurrentIndex(next);
      promptedRef.current = false;
      setLiveTranscript('');
      setPartialText('');
      await speakAndStartQuestion(questions[next].text);
      listeningStateRef.current = 'idle';
    } else {
      await completeInterview();
    }
  }, [currentIndex, liveTranscript, partialText, questions, recorder]);

  const speakAndStartQuestion = useCallback(async (text: string) => {
    if (isTTSOn) {
      setIsSpeaking(true);
      try { recorder.stopRecording(); } catch (e) {}
      await tts.speak(text);
      setIsSpeaking(false);
      await wait(300);
      try {
        await vad.start();
        setIsListening(false);
        // Start 1-minute timer after speaking
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = window.setTimeout(() => {
          console.log('[Timer] 1 minute elapsed - auto advancing');
          onCandidateSilence();
        }, SILENCE_AFTER_MS);
      } catch (e) {
        console.warn('VAD start failed', e);
        toast.error('Microphone/VAD error. Please allow mic access and reload.');
      }
    } else {
      try {
        await vad.start();
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = window.setTimeout(() => {
          onCandidateSilence();
        }, SILENCE_AFTER_MS);
      } catch (e) {
        console.warn('VAD start failed', e);
      }
    }
  }, [isTTSOn, recorder, tts, vad, onCandidateSilence, SILENCE_AFTER_MS]);

  useEffect(() => {
    (async () => {
      if (!questions || questions.length === 0) return;
      await wait(350);
      await speakAndStartQuestion(questions[0].text);
    })();
    return () => {
      try { vad.stop(); } catch (e) {}
      try { recorder.stopRecording(); } catch (e) {}
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      if (promptTimerRef.current) window.clearTimeout(promptTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const completeInterview = useCallback(async () => {
    console.log('[Interview] completing');
    try { vad.stop(); } catch (e) {}
    try { recorder.stopRecording(); } catch (e) {}
    setIsSpeaking(false);
    setIsListening(false);
    if (isTTSOn) {
      setIsSpeaking(true);
      await tts.speak('Thank you. Your responses have been recorded.');
      setIsSpeaking(false);
    }
    setCurrentIndex(questions.length);
    recorder.sendControl && recorder.sendControl({ type: 'done', payload: interviewTranscriptRef.current });
    if (onComplete) onComplete(interviewTranscriptRef.current);
  }, [onComplete, recorder, tts, vad, questions.length, isTTSOn]);

  const handleSkip = async () => {
    const q = questions[currentIndex];
    interviewTranscriptRef.current.push({
      questionId: q.id,
      questionText: q.text,
      answer: '(skipped)',
      timestamp: new Date().toISOString(),
    });
    setFinalTranscript([...interviewTranscriptRef.current]);
    const next = currentIndex + 1;
    if (next >= questions.length) {
      await completeInterview();
    } else {
      setCurrentIndex(next);
      promptedRef.current = false;
      setLiveTranscript('');
      setPartialText('');
      await speakAndStartQuestion(questions[next].text);
    }
  };

  const handleRepeat = async () => {
    setLiveTranscript('');
    setPartialText('');
    await speakAndStartQuestion(questions[currentIndex].text);
  };

  const toggleTTS = () => setIsTTSOn((s) => !s);

  const percent = Math.round(((currentIndex) / Math.max(1, questions.length)) * 100);

  if (currentIndex >= questions.length) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-lg p-6 border border-green-200">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Interview Complete!</h3>
          <p className="text-gray-600 mb-4">Thank you for completing the interview. Responses recorded.</p>
          <div className="text-sm text-gray-500">Total Questions: {questions.length} | Completed: {finalTranscript.length}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-lg border border-blue-200">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <div>
              <div className="font-semibold">TalkHire AI</div>
              <div className="text-xs opacity-90">{jobTitle || 'Position'} • Candidate: {candidateName || 'Candidate'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTTS} className="p-2 rounded hover:bg-white/10">
              {isTTSOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div className="text-xs">{percent}%</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-sm flex justify-between">
            <div>Question {currentIndex + 1} / {questions.length}</div>
            <div className="opacity-90 text-xs">{wsOpen ? 'Connected' : 'Connecting...'}</div>
          </div>
          <div className="w-full bg-white/25 rounded-full h-2 mt-1">
            <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">AI</div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">Question {currentIndex + 1}</div>
              <div className="text-lg font-semibold text-gray-800">{questions[currentIndex].text}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          {isSpeaking && (
            <button className="px-4 py-2 bg-red-500 text-white rounded-full flex items-center gap-2" onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }}>
              <X className="w-4 h-4" /> Stop Speaking
            </button>
          )}
          <button className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200" onClick={handleRepeat}>Repeat</button>
          <button className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200" onClick={handleSkip}>Skip</button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-4 border-2 border-blue-300 min-h-[120px]">
          <div className="flex items-start gap-3">
            <div className="w-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}>
                <Mic className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-2">
                {isSpeaking ? '🤖 Bot speaking...' : isListening ? '🎤 Listening... (1 min per question, 15 sec silence = prompt)' : 'Waiting...'}
              </div>
              <div className="text-gray-800 text-lg whitespace-pre-wrap min-h-[48px]">
                {liveTranscript || <span className="text-gray-400 italic">Your live answer will appear here.</span>}
              </div>
              {partialText && <div className="text-xs text-gray-500 mt-2">Partial: {partialText}</div>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>Interview Flow:</strong> You have 1 minute per question. If silent for 15 seconds, the AI will prompt you to answer.
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>VAD-based natural pause detection</div>
          <div>{finalTranscript.length} answers saved</div>
        </div>
      </div>
    </div>
  );
}
