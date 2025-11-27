"use client"

import Sidebar from '@/components/Sidebar';
import dynamic from 'next/dynamic';

const ChatbotWidget = dynamic(() => import('@/components/ChatbotWidget'), { ssr: false });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      
      {/* Chatbot Widget */}
      <ChatbotWidget userRole="admin" />
    </div>
  );
} 