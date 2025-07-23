"use client";

import { useEffect, useState } from 'react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refreshUser, user } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh');
        const needsUsername = searchParams.get('needsUsername') === 'true';

        if (!token || !refreshToken) {
          console.error('Missing tokens in auth callback');
          setStatus('error');
          redirect('/login?error=missing_tokens');
          return;
        }

        // Set the tokens in the auth context
        login(token, refreshToken);

        // Wait a moment for tokens to be set
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh user data
        await refreshUser();
        
        // Get user data and check if they need to complete setup
        const needsSetup = needsUsername || !user?.hasCompletedOnboarding;
        
        // Redirect based on onboarding status
        if (needsSetup) {
          redirect('/setup');
        } else {
          redirect('/messages');
        }
      } catch (error) {
        console.error('Auth error:', error);
        setStatus('error');
        redirect('/login?error=auth_failed');
      }
    };

    handleAuthSuccess();
  }, [searchParams, router, login, refreshUser, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Completing authentication...</p>
          </>
        )}
        {status === 'error' && (
          <div className="text-red-600">
            <p>Authentication failed. Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  );
} 