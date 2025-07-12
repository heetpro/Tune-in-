import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  initializeSocket, 
  getSocket, 
  closeSocket, 
  emitEvent, 
  listenEvent, 
  removeListener,
  saveMessagesToStorage,
  loadMessagesFromStorage,
  playMessageSound
} from '../lib/socket';
import { useAuth } from './AuthContext';
import { IUser } from '@/types';

// Message interface
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
  isRead: boolean;
  isDelivered: boolean;
}

// Chat context interface
interface ChatContextProps {
  messages: Record<string, Message[]>; // Keyed by conversationId
  sendMessage: (receiverId: string, text: string) => Promise<boolean>;
  markAsRead: (messageId: string, senderId: string) => void;
  sendTypingIndicator: (conversationId: string, receiverId: string) => void;
  onlineUsers: string[];
  typingUsers: Record<string, { userId: string; timestamp: number }>;
  isConnected: boolean;
  connectionError: string | null;
}

// Create context with default value
const ChatContext = createContext<ChatContextProps | null>(null);

// Chat provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, { userId: string; timestamp: number }>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    let socketInstance: any;
    
    const setupSocket = async () => {
      if (user?._id) {
        try {
          socketInstance = await initializeSocket(user._id);
          
          socketInstance.on('connect', () => {
            setIsConnected(true);
            setConnectionError(null);
          });
          
          socketInstance.on('connect_error', (error: Error) => {
            setIsConnected(false);
            setConnectionError(error.message);
          });
          
          socketInstance.on('disconnect', () => {
            setIsConnected(false);
          });
          
          // Load existing messages from storage
          setMessages(loadMessagesFromStorage(user._id));
        } catch (error) {
          console.error('Failed to initialize socket:', error);
          setConnectionError('Failed to connect to chat server');
        }
      }
    };
    
    setupSocket();
    
    return () => {
      closeSocket();
    };
  }, [user?._id]);

  // Listen for messages and other events
  useEffect(() => {
    if (!user?._id) return;
    
    // Handle new messages
    listenEvent<Message>('new_message', (message) => {
      setMessages((prevMessages) => {
        // Create a conversation ID
        const conversationId = user._id === message.senderId
          ? message.receiverId
          : message.senderId;
        
        // Get existing messages for this conversation or initialize
        const conversationMessages = prevMessages[conversationId] || [];
        
        // Check if message already exists to prevent duplicates
        if (conversationMessages.some(msg => msg.id === message.id)) {
          return prevMessages;
        }
        
        // Add new message to conversation
        const updatedMessages = {
          ...prevMessages,
          [conversationId]: [
            ...conversationMessages,
            {
              ...message,
              createdAt: new Date(message.createdAt),
            },
          ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        };
        
        // Save messages to storage
        if (user?._id) {
          saveMessagesToStorage(user._id, updatedMessages);
        }
        
        // Play notification sound for incoming messages
        if (message.senderId !== user._id && document.visibilityState !== 'visible') {
          playMessageSound();
        }
        
        return updatedMessages;
      });

      // If the message is from someone else, mark it as read if we're viewing the conversation
      if (message.senderId !== user._id) {
        // Check if we're currently viewing this conversation (you may need to adjust this logic)
        const isViewingConversation = window.location.pathname.includes(`/messages/${message.senderId}`);
        
        if (isViewingConversation) {
          emitEvent('read_message', {
            messageId: message.id,
            senderId: message.senderId,
          });
        }
      }
    });

    // Handle read receipts
    listenEvent<{ messageId: string }>('message_read', ({ messageId }) => {
      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        
        // Find the message in all conversations and update its read status
        Object.keys(updatedMessages).forEach((conversationId) => {
          updatedMessages[conversationId] = updatedMessages[conversationId].map(msg => 
            msg.id === messageId ? { ...msg, isRead: true } : msg
          );
        });
        
        // Save to storage
        if (user?._id) {
          saveMessagesToStorage(user._id, updatedMessages);
        }
        
        return updatedMessages;
      });
    });

    // Handle typing indicators
    listenEvent<{ userId: string; conversationId: string; timestamp: number }>('user_typing', 
      ({ userId, conversationId, timestamp }) => {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: { userId, timestamp }
        }));
        
        // Auto clear typing indicator after 2 seconds of inactivity
        setTimeout(() => {
          setTypingUsers(prev => {
            const current = prev[conversationId];
            if (current && current.timestamp === timestamp) {
              const updated = { ...prev };
              delete updated[conversationId];
              return updated;
            }
            return prev;
          });
        }, 2000);
    });

    // Track online users
    listenEvent<string[]>('getOnlineUsers', (users) => {
      setOnlineUsers(users);
    });

    listenEvent<{ userId: string; status: 'online' | 'offline' }>('user_status_changed', 
      ({ userId, status }) => {
        setOnlineUsers(prev => {
          if (status === 'online' && !prev.includes(userId)) {
            return [...prev, userId];
          } else if (status === 'offline') {
            return prev.filter(id => id !== userId);
          }
          return prev;
        });
    });

    // Clean up listeners on unmount
    return () => {
      removeListener('new_message');
      removeListener('message_read');
      removeListener('user_typing');
      removeListener('getOnlineUsers');
      removeListener('user_status_changed');
    };
  }, [user?._id]);

  // Send a message with acknowledgment
  const sendMessage = useCallback(async (receiverId: string, text: string): Promise<boolean> => {
    if (!user?._id || !isConnected) return false;
    
    try {
      const response = await emitEvent<{ receiverId: string; text: string }, { status: string; message?: any }>(
        'send_message',
        { receiverId, text },
        true // use acknowledgment
      );
      
      if (typeof response === 'object' && response.status === 'ok') {
        return true;
      } else {
        console.error('Failed to send message:', response);
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [user?._id, isConnected]);

  // Mark a message as read
  const markAsRead = useCallback((messageId: string, senderId: string) => {
    if (!user?._id || !isConnected) return;
    
    try {
      emitEvent('read_message', { messageId, senderId });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [user?._id, isConnected]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((conversationId: string, receiverId: string) => {
    if (!user?._id || !isConnected) return;
    
    try {
      emitEvent('typing', { conversationId, receiverId });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [user?._id, isConnected]);

  // Context value
  const contextValue = {
    messages,
    sendMessage,
    markAsRead,
    sendTypingIndicator,
    onlineUsers,
    typingUsers,
    isConnected,
    connectionError,
  };

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

// Custom hook for using the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 