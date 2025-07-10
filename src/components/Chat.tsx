"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IMessage } from '@/types/index';
import { getMessageHistory, sendMessage } from '@/api';
import { emitEvent, listenEvent, removeListener } from '@/lib/socket';

interface ChatProps {
  conversationId: string;
  receiverId: string;
}

const Chat: React.FC<ChatProps> = ({ conversationId, receiverId }) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const response = await getMessageHistory(receiverId);
        if (response.data?.messages) {
          setMessages(response.data.messages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
    
    // Listen for new messages
    listenEvent<IMessage>('new_message', (message) => {
      if ((message.receiverId === user?._id && message.senderId === receiverId) ||
          (message.senderId === user?._id && message.receiverId === receiverId)) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });
    
    return () => {
      removeListener('new_message');
    };
  }, [conversationId, receiverId, user?._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;
    
    try {
      setSending(true);
      
      // Optimistic update
      const optimisticMsg: IMessage = {
        _id: Date.now().toString(),
        senderId: user._id,
        receiverId,
        text: newMessage,
        createdAt: new Date(),
        isRead: false
      };
      
      setMessages([...messages, optimisticMsg]);
      setNewMessage('');
      
      // Send via API
      await sendMessage(receiverId, newMessage);
      
      // Also emit via socket for real-time delivery
      emitEvent('send_message', {
        conversationId,
        receiverId,
        text: newMessage
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic message if it failed
      setMessages(messages => messages.filter(msg => msg._id !== Date.now().toString()));
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
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message._id} 
              className={`mb-4 ${message.senderId === user?._id ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block max-w-[70%] p-3 rounded-lg ${
                  message.senderId === user?._id 
                    ? 'bg-blue-500 text-white rounded-br-none' 
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
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            disabled={sending || !newMessage.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat; 