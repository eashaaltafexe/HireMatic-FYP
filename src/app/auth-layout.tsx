import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 