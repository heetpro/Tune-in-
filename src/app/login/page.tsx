"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginWithSpotify, checkUserAuth } from '@/api';
import Header from '@/components/Header';
import Cookies from 'js-cookie';

export default function Login() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Handle error message from URL
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'missing_tokens':
          setError('Authentication failed: missing tokens');
          break;
        case 'auth_failed':
          setError('Authentication failed. Please try again.');
          break;
        case 'cookie_failure':
          setError('Failed to store authentication data. Please check your browser settings.');
          break;
        default:
          setError('An error occurred during login');
      }
    }
  }, [searchParams]);

  // Function to check if user needs onboarding
  const needsOnboarding = (userData: any) => {
    if (!userData) return false;
    
    // Check if onboarding is explicitly marked as completed
    if (userData.hasCompletedOnboarding === true) {
      return false;
    }
    
    // Check if any required field is missing
    return !userData.displayName ||
      !userData.age ||
      !userData.gender ||
      !userData.location?.city ||
      !userData.intrestedIn?.length ||
      !userData.username;
  };

  // Check for existing auth token
  useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true);
      
      const token = Cookies.get('auth_token');
      if (token && !isAuthenticated) {
        try {
          const authCheck = await checkUserAuth();
          
          if (authCheck.success && authCheck.data?.exists) {
            // Redirect to homepage
            router.push('/');
          } else {
            // Clear invalid tokens
            Cookies.remove('auth_token');
            Cookies.remove('refresh_token');
          }
        } catch (err) {
          console.error('Login page: Error checking auth', err);
        }
      }
      
      setCheckingAuth(false);
    };
    
    checkAuth();
  }, [router, isAuthenticated]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading && !checkingAuth && user) {
      // Check if user needs to complete onboarding
      if (needsOnboarding(user)) {
        router.push('/setup');
      } else {
        // Get redirect parameter or default to messages
        const redirectPath = searchParams?.get('redirect') || '/messages';
        router.push(redirectPath);
      }
    }
  }, [isAuthenticated, loading, checkingAuth, router, user, searchParams]);

  // Function to handle Spotify login
  const handleLoginWithSpotify = () => {
    // Store any redirect parameter for after login
    const redirectPath = searchParams?.get('redirect');
    if (redirectPath) {
      sessionStorage.setItem('authRedirect', redirectPath);
    }
    
    // Initiate the login process
    loginWithSpotify();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Music Dating</h1>
            <p className="text-gray-600">
              Connect with people who share your music taste
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-6">
            {loading || checkingAuth ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <button 
                onClick={handleLoginWithSpotify}
                className="bg-green-600 hover:bg-green-700 transition-colors text-white px-6 py-3 rounded-full flex items-center justify-center text-lg font-medium"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Login with Spotify
              </button>
            )}
            
            <div className="text-center text-sm text-gray-500">
              <p className="mb-2">By logging in, you agree to our Terms of Service and Privacy Policy.</p>
              <p>We'll use your Spotify data to match you with compatible friends.</p>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Music Dating App</p>
          <p className="text-sm text-gray-400 mt-2">Connect through music.</p>
        </div>
      </footer>
    </div>
  );
} 