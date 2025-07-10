"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Cookies from 'js-cookie';

export default function AuthDebug() {
  const [isVisible, setIsVisible] = useState(false);
  const { user, loading, error, isAuthenticated } = useAuth();
  
  const authToken = Cookies.get('auth_token');
  const refreshToken = Cookies.get('refresh_token');
  
  const toggleVisibility = () => setIsVisible(!isVisible);
  
  const clearCookies = () => {
    Cookies.remove('auth_token');
    Cookies.remove('refresh_token');
    window.location.reload();
  };
  
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <button 
          onClick={toggleVisibility}
          className="bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
        >
          Show Auth Debug
        </button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md w-full text-xs opacity-90">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">Auth Debug Info</h3>
        <button 
          onClick={toggleVisibility}
          className="text-gray-400 hover:text-white"
        >
          Hide
        </button>
      </div>
      
      <div className="space-y-2 overflow-auto max-h-80">
        <div>
          <span className="font-bold">Auth Status:</span>
          <span className={`ml-2 ${isAuthenticated ? 'text-green-400' : 'text-red-400'}`}>
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>
        
        <div>
          <span className="font-bold">Loading:</span>
          <span className="ml-2">{loading ? 'True' : 'False'}</span>
        </div>
        
        <div>
          <span className="font-bold">Error:</span>
          <span className="ml-2">{error || 'None'}</span>
        </div>
        
        <div>
          <span className="font-bold">Auth Token:</span>
          <span className="ml-2">{authToken ? `${authToken.substring(0, 15)}...` : 'Not found'}</span>
        </div>
        
        <div>
          <span className="font-bold">Refresh Token:</span>
          <span className="ml-2">{refreshToken ? `${refreshToken.substring(0, 15)}...` : 'Not found'}</span>
        </div>
        
        <div>
          <span className="font-bold">User:</span>
          {user ? (
            <div className="pl-2 pt-1">
              <div>ID: {user._id}</div>
              <div>Name: {user.displayName}</div>
              <div>Username: {user.username || 'Not set'}</div>
              <div>Spotify ID: {user.spotifyId}</div>
            </div>
          ) : (
            <span className="ml-2">No user data</span>
          )}
        </div>
        
        <div className="pt-2">
          <button
            onClick={clearCookies}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white"
          >
            Clear Auth Cookies
          </button>
        </div>
      </div>
    </div>
  );
} 