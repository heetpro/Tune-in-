"use client";

import React from 'react';
import { ChatProvider } from '@/context/ChatContext';
import ChatList from '@/components/ChatList';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

const MessagesPage = () => {
  const { user } = useAuth();
  
  return (
    <ProtectedRoute>
      <ChatProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-gray-600">Connect with your music matches</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <ChatList />
            </div>
            
            <div className="col-span-1 md:col-span-2 hidden md:flex flex-col justify-center items-center bg-white rounded-lg shadow p-8 text-center">
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
              <p className="text-gray-600 mb-6">Select a conversation or start a new one</p>
              
              <Link 
                href="/friends" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full transition-colors"
              >
                Find Friends
              </Link>
            </div>
          </div>
        </div>
      </ChatProvider>
    </ProtectedRoute>
  );
};

export default MessagesPage; 