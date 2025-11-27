'use client';

import { ReactNode } from 'react';
import Header from "@/components/layout/Header";
import dynamic from 'next/dynamic';

const ChatbotWidget = dynamic(() => import('@/components/ChatbotWidget'), { ssr: false });

interface SiteLayoutProps {
  children: ReactNode;
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Chatbot Widget for landing page visitors */}
      <ChatbotWidget userRole="general" />
    </div>
  );
} 