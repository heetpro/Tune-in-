"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Cookies from 'js-cookie';

export default function AuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refreshUser } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh');
        const needsUsername = searchParams.get('needsUsername') === 'true';

        console.log('Auth success - tokens received:', {
          tokenExists: !!token,
          refreshTokenExists: !!refreshToken,
          needsUsername
        });

        if (!token || !refreshToken) {
          console.error('Missing tokens in auth callback');
          setStatus('error');
          router.push('/login?error=missing_tokens');
          return;
        }

        // Store tokens directly in cookies first
        console.log('Setting tokens directly in cookies...');
        Cookies.remove('auth_token'); 
        Cookies.remove('refresh_token');
        
        Cookies.set('auth_token', token, {
          expires: 1,
          path: '/',
          sameSite: 'lax'
        });
        
        Cookies.set('refresh_token', refreshToken, {
          expires: 30,
          path: '/',
          sameSite: 'lax'
        });
        
        // Then use the login function
        console.log('Using login function to set tokens...');
        login(token, refreshToken);

        // Small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if cookies were set
        const savedToken = Cookies.get('auth_token');
        console.log('Cookie check after setting:', !!savedToken);
        
        if (!savedToken) {
          console.error('Failed to set auth token cookie');
          setStatus('error');
          router.push('/login?error=cookie_failure');
          return;
        }
        
        // Wait for user data to load
        console.log('Refreshing user data after login...');
        await refreshUser();
        console.log('User refresh completed');
        
        // Redirect based on onboarding status
        if (needsUsername) {
          console.log('User needs username setup, redirecting to profile setup');
          router.push('/profile?setup=true');
        } else {
          console.log('User has username, redirecting to profile');
          router.push('/profile');
        }
      } catch (error) {
        console.error('Auth success error:', error);
        setStatus('error');
        router.push('/login?error=auth_failed');
      }
    };

    handleAuthSuccess();
  }, [searchParams, router, login, refreshUser]);

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