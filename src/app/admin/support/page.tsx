"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/chat-support');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-500">Please wait while we redirect you to the chat support page.</p>
      </div>
    </div>
  );
} 