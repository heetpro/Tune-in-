"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';
import { ArrowUpRight, Smile, SmilePlus, Sticker } from 'lucide-react';
import { spaceGrotesk } from '@/app/fonts';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { IUser } from '@/types';
import { ProfileModal } from './ProfileModal';

interface ChatProps {
  receiverId: string;
  receiverData?: IUser; 
  onClose? : boolean;
}

const Chat: React.FC<ChatProps> = ({ receiverId, receiverData, }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
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
    isConnected,
    chatPartner
  } = useChat(receiverId);

  // The user data to display in the profile modal
  const profileUser = receiverData || chatPartner;

  // Color patterns for your messages
  const myMessageColors = [
    { bg: '#F46D38', text: '#fff' }, // Orange
    { bg: '#C2F949', text: '#000' }, // Green
    { bg: '#8D50F9', text: '#fff' }  // Purple
  ];

  // Color patterns for other person's messages
  const otherMessageColors = [
    { bg: '#FF6B9D', text: '#000' }, // Pink
    { bg: '#901E3E', text: '#fff' }, // Teal
    { bg: '#00CAFF', text: '#000' }  // Blue
  ];

  // Function to get message color based on index and sender
  const getMessageColor = (index: number, isMyMessage: boolean) => {
    const colors = isMyMessage ? myMessageColors : otherMessageColors;
    return colors[index % colors.length];
  };

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

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
    // Removed setShowEmojiPicker(false) to keep the picker open
  };

  // Format timestamp
  const formatTime = (date?: Date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${spaceGrotesk.className} text-white flex flex-col h-full bg-[#2a2a2a] rounded-3xl`}>
  
      
      {/* Chat header with profile info */}
      <div className="p-3 border-b border-gray-200 flex items-center">
        {profileUser && (
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <div className="relative mr-2 p-1 border-4 border-[#151312] rounded-xl">
              <img 
                src={profileUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.displayName || 'User')}`} 
                alt={profileUser.displayName} 
                className="w-10 h-10 rounded-md object-cover"
              />
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <div className="font-medium text-lg">{profileUser.displayName}</div>
              <div className="text-xs -mt-1 text-gray-500">
                {isOnline ? 'Online' : 'Offline'}
                {isTyping && <span className="ml-2 italic">typing...</span>}
              </div>
            </div>
          </div>
        )}
      </div>
      
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
          messages.map((message, index) => {
            const isMyMessage = message.senderId === user?._id;
            const messageColor = getMessageColor(index, isMyMessage);
            
            return (
              <div 
                key={message.id || `msg-${message.senderId}-${message.receiverId}-${index}`} 
                className={`mb-0.5 ${isMyMessage ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block ${spaceGrotesk.className} max-w-[70%] px-3.5 py-2  font-medium rounded-3xl ${
                    isMyMessage && message.error ? 'bg-red-400' : ''
                  }`}
                  style={{
                    backgroundColor: message.error ? '#ef4444' : messageColor.bg,
                    color: message.error ? '#fff' : messageColor.text
                  }}
                >
                  {message.text}
                </div>
              </div>
            );
          })
        )}
        
        {isTyping && (
          <div className="typing-indicator text-gray-500 italic text-sm p-2">
            Someone is typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className={`${spaceGrotesk.className} p-4 relative`}>
        <div className="flex gap-2">
          <div className="relative flex-1 flex gap-2">
            <button
              type="button"
              ref={emojiButtonRef}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-0 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <Sticker className="w-8 h-8 text-[#151312000]/50" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 px-4 p-2 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#151312]"
              disabled={sending}
            />
          </div>
          <button 
            type="submit"
            className="bg-[#151312] border-2 border-[#151312] text-white px-4 py-2 rounded-2xl hover:bg-blue-600 focus:outline-none disabled:bg-[#151312]/50"
            disabled={sending || !newMessage.trim() || !isConnected}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2">
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              previewPosition="none"
              skinTonePosition="none"
            />
          </div>
        )}
      </form>

      {/* Profile Modal */}
      {profileUser && (
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          user={profileUser} 
        />
      )}
    </div>
  );
};

export default Chat;