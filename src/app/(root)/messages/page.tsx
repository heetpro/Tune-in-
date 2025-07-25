"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getChatUsers } from '@/api';
import { IUser } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Chat from '@/components/Chat';
import ConversationList from '@/components/ConversationList';
import { useSocket } from '@/context/SocketContext';
import Header from '@/components/Header';
import Logo2 from '@/components/Logo2';
import Image from 'next/image';
import { spaceGrotesk } from '@/app/fonts';
import { Settings } from 'lucide-react';
import Navbar from '@/components/Navbar';

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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { user } = useAuth();
  const { isConnected } = useSocket();
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

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  return (
    <div className=" w-full h-full  flex flex-col">
      <div className="w-full px-3  flex-grow h-full ">
        <div className="flex gap-2  h-full ">
          {/* User list sidebar */}
          <div className="w-[20%] h-full bg-[#8D50F9] p-2 rounded-3xl overflow-hidden">
            <div className=" bg-white w-[100%] rounded-2xl h-full">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="spinner h-8 w-8 rounded-full animate-spin"></div>
                </div>
              ) : (
                <ConversationList
                  activeConversationId={selectedUserId || undefined}
                  onSelectConversation={handleSelectUser}
                  friendsList={chatUsers}
                />
              )}
            </div>
          </div>


          {/* Chat area */}
          <div className="w-1/3 h-full ">
            {selectedUserId ? (
              <Chat
                receiverId={selectedUserId}
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
                  <p className="mt-2 text-sm">
                    {isConnected ?
                      "Connected to chat server" :
                      "Not connected to chat server. Messages will be sent when connection is restored."}
                  </p>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 