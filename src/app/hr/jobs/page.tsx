"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JobListings() {
  const router = useRouter();

  useEffect(() => {
    router.push('/hr/jobs/create');
  }, [router]);

  return null;
}