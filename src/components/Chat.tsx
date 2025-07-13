"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { Message } from '@/types/socket';
import { getMessageHistory } from '@/api';

interface ChatProps {
  conversationId: string;
  receiverId: string;
}

const Chat: React.FC<ChatProps> = ({ conversationId, receiverId }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    markAsRead, 
    sendTypingIndicator,
    isConnected,
    connectionError,
    typingUsers,
    onlineUsers
  } = useChat();

  // Get messages for this conversation
  const conversationMessages = messages[receiverId] || [];
  const isTyping = typingUsers[conversationId]?.userId === receiverId;
  const isOnline = onlineUsers.includes(receiverId);

  // Fetch initial messages if not in the context
  useEffect(() => {
    const fetchMessages = async () => {
      if (conversationMessages.length === 0) {
        try {
          const response = await getMessageHistory(receiverId);
          if (response.data?.messages) {
            // Messages will be added to context by the ChatContext provider
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };
    
    fetchMessages();
  }, [conversationId, receiverId, conversationMessages.length]);

  // Mark messages as read
  useEffect(() => {
    conversationMessages.forEach(message => {
      if (message.senderId !== user?._id && !message.isRead) {
        markAsRead(message.id as string, message.senderId);
      }
    });
  }, [conversationMessages, markAsRead, user?._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Handle message input and send typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTypingIndicator(conversationId, receiverId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;
    
    try {
      setSending(true);
      const success = await sendMessage(receiverId, newMessage);
      
      if (success) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTime = (date?: Date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-lg shadow">
      {!isConnected && (
        <div className="p-2 bg-yellow-100 text-yellow-800 text-center text-sm">
          {connectionError || "Socket disconnected. Messages may be delayed."}
        </div>
      )}
      
      <div className="flex-1 p-4 overflow-y-auto">
        {conversationMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          conversationMessages.map((message, index) => (
            <div 
              key={message.id || `msg-${message.senderId}-${message.receiverId}-${index}`} 
              className={`mb-4 ${message.senderId === user?._id ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block max-w-[70%] p-3 rounded-lg ${
                  message.senderId === user?._id 
                    ? `bg-blue-500 text-white rounded-br-none ${
                        message.error ? 'bg-red-400' : ''
                      }`
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {message.text}
                <div 
                  className={`text-xs mt-1 ${
                    message.senderId === user?._id ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.createdAt)}
                  {!message.id?.startsWith('temp-') ? 
                    (message.isRead ? " • Read" : message.isDelivered ? " • Delivered" : "") : 
                    " • Sending..."}
                  {message.error && " • Failed"}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="typing-indicator text-gray-500 italic text-sm p-2">
            Someone is typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            disabled={sending || !newMessage.trim() || !isConnected}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat; 