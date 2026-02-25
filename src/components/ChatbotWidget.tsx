'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Bot,
  Mic,
  Volume2,
  User,
  Sparkles
} from 'lucide-react';
import { toast } from '@/utils/toast';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestedActions?: string[];
}

interface ChatbotWidgetProps {
  userRole?: 'admin' | 'hr' | 'candidate' | 'general';
  className?: string;
}

function ChatbotWidget({ userRole = 'general', className = '' }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Detect Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
    } else {
      setSpeechSupported(false);
      recognitionRef.current = null;
    }
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessages: Record<string, string> = {
        admin: "👋 Hello Admin! I'm your HireMatic AI Assistant. I can help you with user management, system configuration, analytics, and more. How can I assist you today?",
        hr: "👋 Hello! I'm your HireMatic AI Assistant. I can help you create job postings, review candidates, schedule interviews, and manage your recruitment pipeline. What would you like to know?",
        candidate: "👋 Welcome! I'm your HireMatic AI Assistant. I can help you apply for jobs, track your applications, prepare for interviews, and navigate the platform. How can I help?",
        general: "👋 Welcome to HireMatic! I'm your AI Assistant. I can help you understand our platform, guide you through signup, explain features, or answer any questions about getting started. How can I help you today?"
      };

      setMessages([{
        id: 'welcome',
        role: 'bot',
        content: welcomeMessages[userRole],
        timestamp: new Date(),
        suggestedActions: getSuggestedActionsForRole(userRole)
      }]);
    }
  }, [isOpen, userRole]);

  const getSuggestedActionsForRole = (role: string): string[] => {
    const actions: Record<string, string[]> = {
      admin: ['View Dashboard', 'Manage Users', 'System Reports'],
      hr: ['Create Job Posting', 'Review Applications', 'Schedule Interview'],
      candidate: ['Browse Jobs', 'View Applications', 'Check Interview Status'],
      general: ['How to Sign Up?', 'What is HireMatic?', 'How does AI interview work?', 'How to Login?']
    };
    return actions[role] || actions.general;
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId,
          conversationHistory: messages.slice(-5).map(msg => ({
            role: msg.role === 'user' ? 'User' : 'Assistant',
            content: msg.content
          }))
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const botMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          role: 'bot',
          content: data.data.message,
          timestamp: new Date(data.data.timestamp),
          suggestedActions: data.data.suggestedActions
        };
        setMessages(prev => [...prev, botMessage]);
        // Speak response when voice enabled
        if (voiceEnabled) {
          speakText(data.data.message);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('[Chatbot] ❌ Error:', error);
      console.error('[Chatbot] ❌ Error details:', error instanceof Error ? error.message : 'Unknown');
      
      const errorDetails = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to send message: ${errorDetails}`);
      
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'bot',
        content: `❌ Error: ${errorDetails}\n\nPlease check:\n1. Internet connection\n2. Server is running\n3. API key is configured\n\nTry again or contact support if issue persists.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedAction = (action: string) => {
    sendMessage(action);
  };

  // Speech recognition handlers (Web Speech API)
  const startRecognition = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      toast.info('Voice recognition not supported in this browser.');
      return;
    }

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscript += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      // show interim transcript in input
      setInputValue(finalTranscript || interim);
    };

    recognition.onerror = (_e: any) => {
      setIsRecording(false);
      toast.error('Voice recording error.');
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Auto-send captured text if any
      if (inputValue.trim()) {
        sendMessage();
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn('Recognition start error', err);
    }
  };

  const stopRecognition = () => {
    const recognition = recognitionRef.current;
    if (recognition && isRecording) {
      try { recognition.stop(); } catch { /* ignore */ }
      setIsRecording(false);
    }
  };

  // Text-to-speech using browser SpeechSynthesis
  const speakText = (text: string) => {
    try {
      if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      
      window.speechSynthesis.cancel(); // stop previous
      
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      
      utter.onstart = () => {
        setIsSpeaking(true);
      };
      
      utter.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      
      utter.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('TTS error', e);
      setIsSpeaking(false);
    }
  };

  // Stop speech synthesis
  const stopSpeaking = () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        utteranceRef.current = null;
      }
    } catch (e) {
      console.warn('Stop TTS error', e);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group ${className}`}
        aria-label="Open chatbot"
      >
        <MessageCircle className="w-7 h-7 group-hover:animate-pulse" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce">
          AI
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-8 h-8" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">HireMatic AI</h3>
              <p className="text-xs text-blue-100">Always here to help ✨</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            {/* Voice toggle */}
            <button
              onClick={() => setVoiceEnabled(v => !v)}
              className={`hover:bg-white/20 p-2 rounded-lg transition-colors ${voiceEnabled ? 'bg-white/10' : ''}`}
              aria-label={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
              title={voiceEnabled ? 'Voice responses: ON' : 'Voice responses: OFF'}
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              aria-label="Close chatbot"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                    }`}>
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div>
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-200 rounded-tl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      
                      {/* Suggested Actions */}
                      {message.role === 'bot' && message.suggestedActions && message.suggestedActions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.suggestedActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestedAction(action)}
                              className="text-xs bg-white border border-blue-300 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-50 hover:border-blue-400 transition-colors"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-200">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Stop Speaking Button */}
            {isSpeaking && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center justify-center gap-2">
                <button
                  onClick={stopSpeaking}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg animate-pulse"
                  aria-label="Stop speaking"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium">Stop Speaking</span>
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                />

                {/* Microphone button */}
                <button
                  onClick={() => {
                    if (!speechSupported) {
                      toast.info('Voice recognition not supported in this browser.');
                      return;
                    }
                    if (isRecording) stopRecognition(); else startRecognition();
                  }}
                  disabled={isLoading}
                  className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isRecording ? 'bg-red-500 text-white' : 'bg-white border border-gray-200'}`}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatbotWidget;
