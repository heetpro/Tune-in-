"use client";

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/api';

export default function AuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const hasRedirected = useRef(false);
  
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }
    
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refresh');
      const needsUsername = searchParams.get('needsUsername');
      
      console.log('Auth tokens received:', { 
        token: !!token, 
        refreshToken: !!refreshToken,
        needsUsername
      });
      
      if (token && refreshToken) {
        // Store tokens in cookies
        Cookies.set('auth_token', token, { expires: 7 }); // 7 days expiration
        Cookies.set('refresh_token', refreshToken, { expires: 30 }); // 30 days expiration
        
        try {
          // Refresh the user data using the new token
          await refreshUser();
          console.log('User refreshed after authentication');
          
          // Mark that we've handled the redirect
          hasRedirected.current = true;
          
          // If user needs to set a username, redirect to profile page
          if (needsUsername === 'true') {
            router.push('/profile?setup=true');
          } else {
            router.push('/');
          }
        } catch (err) {
          console.error('Error refreshing user after authentication:', err);
          // Still redirect to home so the user isn't stuck
          hasRedirected.current = true;
          router.push('/');
        }
      } else {
        console.error('Missing authentication tokens in callback');
        hasRedirected.current = true;
        router.push('/?auth_error=missing_tokens');
      }
    };
    
    handleAuth();
  }, [searchParams, router, refreshUser]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
        <h1 className="text-xl font-medium">Processing your login...</h1>
        <p className="text-gray-500 mt-2">Please wait while we set up your session</p>
      </div>
    </div>
  );
} 