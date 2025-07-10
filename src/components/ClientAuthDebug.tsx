"use client";

import dynamic from 'next/dynamic';

// Dynamically load the AuthDebug component
const AuthDebugComponent = dynamic(() => import('@/components/AuthDebug'), {
  ssr: false,
});

export default function ClientAuthDebug() {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev) {
    return null;
  }
  
  return <AuthDebugComponent />;
} 