'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatProvider } from '@/context/ChatContext';
import ChatList from '@/components/ChatList';
import Chat from '@/components/Chat';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { IUser } from '@/types/index';

interface UserData {
  _id: string;
  displayName: string;
  profilePicture?: string;
}

const ConversationPage = () => {
  const params = useParams();
  const userId = params.id as string;
  const { user } = useAuth();
  const [recipientData, setRecipientData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch recipient data
  useEffect(() => {
    // In a real app, we would make an API call to get user data by ID
    const fetchUserData = () => {
      setLoading(true);
      
      // First check if this is one of our friends
      if (user && user.friends && Array.isArray(user.friends)) {
        // In a real app, we would have access to full friend data
        // For now, just create basic data from the ID
        if (user.friends.includes(userId)) {
          setRecipientData({
            _id: userId,
            displayName: `Friend ${userId.substring(0, 5)}...`, // Use ID as name if that's all we have
            profilePicture: undefined
          });
          setLoading(false);
          return;
        }
      }
      
      // Fallback: If not found in friends or API call failed, use basic data
      setRecipientData({
        _id: userId,
        displayName: `User ${userId.substring(0, 5)}...`
      });
      setLoading(false);
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId, user]);
  
  return (
    <ProtectedRoute>
      <ChatProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-gray-600">Connect with your music matches</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chat list sidebar */}
            <div className="col-span-1">
              <ChatList />
            </div>
            
            {/* Chat conversation */}
            <div className="col-span-1 md:col-span-2">
              {loading ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
                  <p>Loading conversation...</p>
                </div>
              ) : recipientData ? (
                <Chat 
                  recipientId={recipientData._id}
                  recipientName={recipientData.displayName}
                  recipientAvatar={recipientData.profilePicture}
                />
              ) : (
                <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
                  <p>User not found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ChatProvider>
    </ProtectedRoute>
  );
};

export default ConversationPage; 