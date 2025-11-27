import { ReactNode } from 'react';
import Layout from '@/components/layout/Layout';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return <Layout>{children}</Layout>;
} 