"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IMessage } from '@/types/index';
import { getMessageHistory, sendMessage } from '@/api';
import { getSocket, emitEvent, listenEvent, removeListener } from '@/lib/socket';
import { Socket } from 'socket.io-client';

interface ChatProps {
  conversationId: string;
  receiverId: string;
}

const Chat: React.FC<ChatProps> = ({ conversationId, receiverId }) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Store socket reference to use in cleanup
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    // Initialize socket connection
    const initSocket = async () => {
      try {
        const socket = await getSocket();
        socketRef.current = socket;
        setSocketConnected(true);
        
        // Listen for new messages
        socket.on('new_message', (message: IMessage) => {
          if ((message.receiverId === user?._id && message.senderId === receiverId) ||
              (message.senderId === user?._id && message.receiverId === receiverId)) {
            setMessages((prevMessages) => [...prevMessages, message]);
          }
        });
        
        socket.on('connect', () => {
          setSocketConnected(true);
        });
        
        socket.on('disconnect', () => {
          setSocketConnected(false);
        });
      } catch (error) {
        console.error('Failed to connect socket:', error);
        setSocketConnected(false);
        // Don't retry here - the socket.ts will handle reconnection
      }
    };
    
    initSocket();
    
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
    
    return () => {
      // Clean up event listeners
      if (socketRef.current) {
        socketRef.current.off('new_message');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
      }
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
      
      // Create a temporary ID for optimistic update
      const tempId = Date.now().toString();
      
      // Optimistic update with all required fields
      const optimisticMsg: IMessage = {
        _id: tempId,
        senderId: user._id,
        receiverId,
        text: newMessage,
        isRead: false,
        isDelivered: false,
        isDeleted: false,
        createdAt: new Date(),
        pending: true // Now properly typed
      };
      
      // Add the optimistic message to the UI
      setMessages(prev => [...prev, optimisticMsg]);
      setNewMessage('');
      
      // Try to send the message
      const response = await sendMessage(receiverId, newMessage);
      
      if (response.success) {
        // Replace the optimistic message with the real one or mark as sent
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId 
              ? { ...(response.data || msg), pending: false } 
              : msg
          )
        );
      } else {
        // Mark the message as failed
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId 
              ? { ...msg, error: true } 
              : msg
          )
        );
        console.error('Failed to send message:', response.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Mark any pending messages with this tempId as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.pending 
            ? { ...msg, error: true, pending: false } 
            : msg
        )
      );
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
      {!socketConnected && (
        <div className="p-2 bg-yellow-100 text-yellow-800 text-center text-sm">
          Socket disconnected. Messages may be delayed.
        </div>
      )}
      
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
                    ? `bg-blue-500 text-white rounded-br-none ${
                        message.pending ? 'opacity-70' : ''
                      } ${message.error ? 'bg-red-400' : ''}`
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
                  {message.pending && " • Sending..."}
                  {message.error && " • Failed"}
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