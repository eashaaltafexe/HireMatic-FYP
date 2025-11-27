"use client"

import { useState } from 'react';

export default function ChatSupport() {
  const [message, setMessage] = useState('');
  const [isAgentOnline, setIsAgentOnline] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: 'Welcome to Chat Support! How can I help you today?',
      time: '10:30 AM',
      senderName: 'Support Agent'
    },
    {
      id: 2,
      sender: 'user',
      text: 'I need help setting up a new role for my team members.',
      time: '10:32 AM',
      senderName: 'You'
    },
    {
      id: 3,
      sender: 'agent',
      text: 'I\'d be happy to help with that! You can set up new roles by visiting the Role Management section. Would you like me to guide you through the process step by step?',
      time: '10:33 AM',
      senderName: 'Support Agent'
    }
  ]);

  // Send a new message
  const sendMessage = () => {
    if (!message.trim()) return;
    
    // Get current time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
    
    // Create a new message
    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: message,
      time: timeString,
      senderName: 'You'
    };
    
    // Add to messages
    setMessages([...messages, newMessage]);
    setMessage('');
    
    // Simulate agent response after a short delay
    setTimeout(() => {
      const agentResponse = {
        id: messages.length + 2,
        sender: 'agent',
        text: 'Thanks for your message. I\'ll check and get back to you shortly.',
        time: timeString,
        senderName: 'Support Agent'
      };
      
      setMessages(prev => [...prev, agentResponse]);
    }, 2000);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Chat Support</h1>
            <div className="flex gap-6 items-center">
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full ${isAgentOnline ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></span>
                <span className="text-sm text-gray-600">Agent Online</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                <span className="text-sm text-gray-600">Support Active</span>
              </div>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="p-4 bg-gray-50 h-[calc(100vh-220px)] overflow-y-auto flex flex-col space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-xl rounded-lg p-4 ${
                  msg.sender === 'user' 
                    ? 'bg-blue-100 text-gray-800' 
                    : 'bg-blue-50 text-gray-800'
                }`}>
                  <div className="flex items-center mb-1">
                    <span className="text-xs text-gray-500 font-medium">{msg.senderName}</span>
                    <span className="text-xs text-gray-400 ml-2">• {msg.time}</span>
                  </div>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message here..."
                className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className={`ml-2 p-3 rounded-full ${
                  message.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-200'
                } text-white flex items-center justify-center`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 