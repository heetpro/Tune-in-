"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';
import { ArrowUpRight } from 'lucide-react';
import { spaceGrotesk } from '@/app/fonts';

interface ChatProps {
  receiverId: string;
}

const Chat: React.FC<ChatProps> = ({ receiverId }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const {
    messages,
    loading,
    error,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    isOnline,
    isTyping,
    isConnected
  } = useChat(receiverId);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when they come into view
  useEffect(() => {
    messages.forEach(message => {
      if (message.senderId !== user?._id && !message.isRead) {
        markAsRead(message.id as string, message.senderId);
      }
    });
  }, [messages, markAsRead, user?._id]);

  // Handle message input and send typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTypingIndicator();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;
    
    try {
      setSending(true);
      await sendMessage(newMessage);
      setNewMessage('');
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
          {error || "Socket disconnected. Messages may be delayed."}
        </div>
      )}
      
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="spinner h-8 w-8 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={message.id || `msg-${message.senderId}-${message.receiverId}-${index}`} 
              className={`mb-0.5 ${message.senderId === user?._id ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block ${spaceGrotesk.className} max-w-[70%] px-3.5 py-2 rounded-3xl ${
                  message.senderId === user?._id 
                    ? `bg-[#964FFF] text-white ${
                        message.error ? 'bg-red-400' : ''
                      }`
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {message.text}
                {/* <div 
                  className={`text-xs flex items-center gap-1 mt-1 ${
                    message.senderId === user?._id ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.createdAt)}
                  {message.id?.toString().startsWith('temp-') 
                    ? " • Sending..." 
                    : (message.isRead 
                        ? " • Read" 
                        : message.isDelivered 
                          ? 
                          <div className="flex">
                          <ArrowUpRight size={15}
                          />
                          <ArrowUpRight size={15}
                           className='-ml-1'/>
                          </div> 
                          : "")}
                  {message.error && " • Failed"}
                </div> */}
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