"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getChatUsers } from '@/api';
import { IUser } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Chat from '@/components/Chat';

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <MessagesContent />
    </ProtectedRoute>
  );
}

function MessagesContent() {
  const [chatUsers, setChatUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchChatUsers = async () => {
      try {
        setLoading(true);
        const response = await getChatUsers();
        if (response.data) {
          setChatUsers(response.data);
        }
      } catch (error) {
        console.error('Failed to load chat users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatUsers();
  }, []);

  const handleSelectUser = (selectedUser: IUser) => {
    setSelectedUser(selectedUser);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="flex gap-4">
        {/* User list sidebar */}
        <div className="w-1/3 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-lg">Conversations</h2>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-240px)]">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="spinner h-8 w-8 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
              </div>
            ) : chatUsers.length > 0 ? (
              chatUsers.map((chatUser) => (
                <div
                  key={chatUser._id}
                  onClick={() => handleSelectUser(chatUser)}
                  className={`flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    selectedUser?._id === chatUser._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="relative">
                    <img
                      src={chatUser.profilePicture || '/default-avatar.png'}
                      alt={chatUser.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {chatUser.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium">{chatUser.displayName}</h3>
                    <p className="text-sm text-gray-500">
                      {chatUser.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No conversations yet. Add friends to start chatting!
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="w-2/3">
          {selectedUser ? (
            <Chat
              conversationId={`${user?._id}_${selectedUser._id}`}
              receiverId={selectedUser._id}
            />
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-180px)] bg-white rounded-lg shadow">
              <div className="text-center text-gray-500">
                <p className="mb-4">Select a conversation to start chatting</p>
                <button
                  onClick={() => router.push('/friends')}
                  className="text-blue-500 hover:underline"
                >
                  Find friends to chat with
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 