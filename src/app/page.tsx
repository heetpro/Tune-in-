"use client";

import { useAuth } from '@/context/AuthContext';
import { loginWithSpotify } from '@/api';
import Header from '@/components/Header';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  
  // Add debug logging to track re-renders
  useEffect(() => {
    console.log('Home page rendered with auth state:', { 
      isAuthenticated, 
      hasUser: !!user, 
      loading 
    });
    // This effect should only run once per mount
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4 bg-black">
        <div className="max-w-3xl w-full text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to Music Dating</h1>
          <p className="text-xl mb-8">Connect with people who share your music taste</p>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-6">
              <p className="text-xl">
                Hello, <span className="font-semibold">{user?.displayName || 'there'}</span>!
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link 
                  href="/friends" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-medium"
                >
                  Find Friends
                </Link>
                <Link 
                  href="/profile" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-lg font-medium"
                >
                  My Profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-lg mb-6">
                Sign in with your Spotify account to find friends with similar music taste
              </p>
              <button
                onClick={loginWithSpotify}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full flex items-center justify-center text-lg font-medium mx-auto"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Login with Spotify
              </button>
            </div>
          )}
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
