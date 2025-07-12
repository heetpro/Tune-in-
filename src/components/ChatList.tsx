import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { IUser } from '@/types/index';

// Interface for conversation metadata
interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { messages, onlineUsers } = useChat();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friendsMap, setFriendsMap] = useState<Record<string, IUser>>({});
  
  // Fetch friends data
  useEffect(() => {
    if (!user || !user.friends || !Array.isArray(user.friends)) return;
    
    // In a real app, we would fetch detailed info about each friend
    // For now, we'll use what we have in the user object
    const friends = user.friends.reduce((acc, friendId) => {
      // Create basic user info if we don't have details
      acc[friendId] = {
        _id: friendId,
        displayName: friendId, // This will be replaced with real names if available
        profilePicture: '' // Default empty picture
      } as IUser;
      return acc;
    }, {} as Record<string, IUser>);
    
    setFriendsMap(friends);
  }, [user]);
  
  // Build conversations from messages and friends list
  useEffect(() => {
    if (!user?._id) return;
    
    const conversationMap = new Map<string, Conversation>();
    
    // First add all friends to the conversation list
    Object.entries(friendsMap).forEach(([friendId, friendInfo]) => {
      conversationMap.set(friendId, {
        id: friendId,
        participantId: friendId,
        participantName: friendInfo.displayName || 'Friend',
        participantAvatar: friendInfo.profilePicture || '/default-avatar.png',
        unreadCount: 0
      });
    });
    
    // Then process all messages to update conversation list
    Object.entries(messages).forEach(([participantId, msgs]) => {
      // Skip empty conversations
      if (!msgs.length) return;
      
      // Get last message
      const sortedMsgs = [...msgs].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      const lastMsg = sortedMsgs[0];
      
      // Count unread messages
      const unreadCount = sortedMsgs.filter(
        msg => msg.senderId !== user._id && !msg.isRead
      ).length;
      
      // Get participant info (use from friendsMap if available)
      const participantInfo = friendsMap[participantId] || { 
        displayName: participantId.includes('user') ? `User ${participantId.slice(-1)}` : 'Unknown User',
        profilePicture: '/default-avatar.png'
      };
      
      // Update existing or add new conversation
      conversationMap.set(participantId, {
        id: participantId,
        participantId,
        participantName: participantInfo.displayName,
        participantAvatar: participantInfo.profilePicture,
        lastMessage: lastMsg.text,
        lastMessageTime: lastMsg.createdAt,
        unreadCount
      });
    });
    
    // Convert map to array and sort by most recent
    const conversationList = Array.from(conversationMap.values()).sort(
      (a, b) => {
        // Put conversations with messages at the top
        if (a.lastMessageTime && !b.lastMessageTime) return -1;
        if (!a.lastMessageTime && b.lastMessageTime) return 1;
        
        // Then sort by message time
        return (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0);
      }
    );
    
    setConversations(conversationList);
  }, [messages, friendsMap, user?._id]);
  
  // Format time for display
  const formatTime = (date?: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    
    // If today, show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this week, show day name
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (messageDate > oneWeekAgo) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h2>Messages</h2>
      </div>
      
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No conversations yet
        </div>
      ) : (
        <ul className="chat-list">
          {conversations.map(conversation => (
            <li 
              key={conversation.id}
              className={`chat-list-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
            >
              <Link href={`/messages/${conversation.participantId}`} className="chat-list-link">
                <div className="chat-item-avatar">
                  <img 
                    src={conversation.participantAvatar || '/default-avatar.png'} 
                    alt={conversation.participantName} 
                  />
                  <span 
                    className={`status ${onlineUsers.includes(conversation.participantId) ? 'online' : 'offline'}`} 
                  />
                </div>
                
                <div className="chat-item-content">
                  <h4 className="chat-item-name">{conversation.participantName}</h4>
                  <p className="chat-item-message">
                    {conversation.lastMessage || "Start a conversation"}
                  </p>
                </div>
                
                <div className="chat-item-meta">
                  {conversation.lastMessageTime && (
                    <span className="chat-item-time">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  )}
                  
                  {conversation.unreadCount > 0 && (
                    <div className="chat-item-badge">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatList; 