"use client"

import { useEffect, useState } from 'react';
import { toast } from '@/utils/toast';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toastItem) => (
        <div
          key={toastItem.id}
          className={`
            ${getToastStyles(toastItem.type)}
            px-4 py-3 rounded-lg shadow-lg max-w-sm
            transform transition-all duration-300 ease-in-out
            animate-slide-in
          `}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getToastIcon(toastItem.type)}</span>
            <span className="text-sm font-medium">{toastItem.message}</span>
            <button
              onClick={() => toast.remove(toastItem.id)}
              className="ml-auto text-white hover:text-gray-200 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
