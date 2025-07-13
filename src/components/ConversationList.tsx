"use client";

import { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { ChatUser, Message } from '@/types/socket';
import { IUser } from '@/types';
import Link from 'next/link';

interface ConversationListProps {
  activeConversationId?: string;
  onSelectConversation?: (userId: string) => void;
  friendsList?: IUser[];
}

const ConversationList: React.FC<ConversationListProps> = ({
  activeConversationId,
  onSelectConversation,
  friendsList = []
}) => {
  const { messages, onlineUsers, isConnected } = useChat();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatUser[]>([]);
  
  // Process messages and friendsList to create a list of conversations
  useEffect(() => {
    if (!user) return;
    
    const conversationMap = new Map<string, ChatUser>();
    
    // First add friends from friendsList
    if (friendsList.length > 0) {
      friendsList.forEach((friend) => {
        if (!friend._id) return;
        
        conversationMap.set(friend._id, {
          id: friend._id,
          name: friend.displayName || friend.username || `User ${friend._id.substring(0, 5)}...`,
          avatar: friend.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName || friend.username || 'U')}`,
          isOnline: onlineUsers.includes(friend._id)
        });
      });
    }
    
    // Process all messages to find unique conversations
    Object.entries(messages).forEach(([userId, conversationMessages]) => {
      // Skip if there are no messages
      if (conversationMessages.length === 0) return;
      
      // Get the latest message to extract user info
      const latestMessage = conversationMessages[conversationMessages.length - 1];
      const isOwnMessage = latestMessage.senderId === user._id;
      const otherUserId = isOwnMessage ? latestMessage.receiverId : latestMessage.senderId;
      
      // Check if we already have this user in our map
      if (!conversationMap.has(otherUserId)) {
        // Add user from messages
        conversationMap.set(otherUserId, {
          id: otherUserId,
          name: `User ${otherUserId.substring(0, 5)}...`, // Placeholder
          avatar: `https://ui-avatars.com/api/?name=${otherUserId.substring(0, 2)}`,
          isOnline: onlineUsers.includes(otherUserId)
        });
      }
    });
    
    // Convert map to array and sort by most recent message
    setConversations(Array.from(conversationMap.values()));
  }, [messages, user, onlineUsers, friendsList]);
  
  // Get the last message for a conversation
  const getLastMessage = (userId: string): Message | null => {
    const conversationMessages = messages[userId] || [];
    if (conversationMessages.length === 0) return null;
    return conversationMessages[conversationMessages.length - 1];
  };
  
  // Format the timestamp for the last message
  const formatLastMessageTime = (userId: string): string => {
    const lastMessage = getLastMessage(userId);
    if (!lastMessage?.createdAt) return '';
    
    const messageDate = new Date(lastMessage.createdAt);
    const now = new Date();
    
    // If today, show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within the last 7 days, show day name
    const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString();
  };
  
  // Get count of unread messages for a conversation
  const getUnreadCount = (userId: string): number => {
    const conversationMessages = messages[userId] || [];
    return conversationMessages.filter(msg => 
      msg.senderId === userId && !msg.isRead
    ).length;
  };
  
  // Handle click on a conversation
  const handleClick = (userId: string) => {
    if (onSelectConversation) {
      onSelectConversation(userId);
    }
  };
  
  return (
    <div className="conversations-list">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Messages</h2>
        <div className={`status-indicator ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
          {isConnected ? 'Connected' : 'Offline'}
        </div>
      </div>
      
      {conversations.length === 0 ? (
        <div className="p-4 text-gray-500 text-center">
          <p>No conversations yet</p>
          <Link href="/friends" className="text-blue-500 hover:underline block mt-2">
            Find friends to chat with
          </Link>
        </div>
      ) : (
        <ul>
          {conversations.map(conv => {
            const lastMessage = getLastMessage(conv.id);
            const unreadCount = getUnreadCount(conv.id);
            const isActive = activeConversationId === conv.id;
            
            return (
              <li 
                key={conv.id} 
                className={`p-3 border-b border-gray-200 hover:bg-gray-100 cursor-pointer
                  ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                onClick={() => handleClick(conv.id)}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <img 
                      src={conv.avatar} 
                      alt={conv.name} 
                      className="w-12 h-12 rounded-full"
                    />
                    {conv.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="ml-3 flex-grow">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{conv.name}</h3>
                      <span className="text-xs text-gray-500">
                        {formatLastMessageTime(conv.id)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 truncate max-w-[180px]">
                        {lastMessage?.text || ''}
                      </p>
                      
                      {unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ConversationList; 