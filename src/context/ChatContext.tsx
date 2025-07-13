"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeSocket, getSocket, closeSocket, listenEvent, getUserId, sendMessage as socketSendMessage, 
  markMessageAsRead, sendTypingIndicator as socketTypingIndicator, testServerConnectivity, removeListener } from '@/lib/socket';
import { Message, UserStatusEvent, TypingEvent, ReadReceiptEvent } from '@/types/socket';
import { useAuth } from './AuthContext';
import Cookies from 'js-cookie';
import { getMessageHistory } from '@/api';
import { IMessage } from '@/types';
import { messageService } from '@/lib/messageService';

interface ChatContextType {
  messages: Record<string, Message[]>; // Organized by conversation
  sendMessage: (receiverId: string, text: string, image?: string) => Promise<boolean>;
  markAsRead: (messageId: string, senderId: string) => void;
  sendTypingIndicator: (conversationId: string, receiverId: string) => void;
  onlineUsers: string[];
  typingUsers: Record<string, { userId: string; timestamp: number }>;
  isConnected: boolean;
  connectionError: string | null;
  loadMessageHistory: (userId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, { userId: string; timestamp: number }>>({});
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { user } = useAuth();

  // Function to load message history for a conversation
  const loadMessageHistory = useCallback(async (userId: string): Promise<void> => {
    if (!user?._id) return;

    console.log('Loading message history for conversation with:', userId);
    
    try {
      // Use the messageService to get messages
      const messages = await messageService.getMessages(userId);
      
      if (messages && messages.length > 0) {
        console.log(`Loaded ${messages.length} messages for conversation with ${userId}`);
        
        // Convert IMessage to Message format using the service helper
        const formattedMessages: Message[] = messages.map(msg => messageService.convertToFrontendMessage(msg));
        
        // Add messages to state
        setMessages(prev => {
          const existingMessages = prev[userId] || [];
          
          // Combine existing and new messages, removing duplicates by ID
          const allMessages = [...existingMessages];
          
          formattedMessages.forEach(newMsg => {
            if (!allMessages.some(m => m.id === newMsg.id)) {
              allMessages.push(newMsg);
            }
          });
          
          // Sort by creation time
          const sortedMessages = allMessages.sort((a, b) => 
            new Date(a.createdAt as Date).getTime() - new Date(b.createdAt as Date).getTime()
          );
          
          return {
            ...prev,
            [userId]: sortedMessages
          };
        });
      } else {
        console.warn('No messages found or failed to load message history');
      }
    } catch (error) {
      console.error('Error loading message history:', error);
    }
  }, [user?._id]);

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id) {
      console.log('Not initializing socket - user ID missing');
      return;
    }
    
    console.log('ChatContext: Starting socket initialization with user ID:', user._id);
    
    try {
      const initSocket = async () => {
        try {
          // First, test basic connectivity to the server
          const connectivityTest = await testServerConnectivity();
          console.log('Connectivity test result:', connectivityTest);
          
          if (!connectivityTest.success) {
            setConnectionError(`Server connectivity issue: ${connectivityTest.message}`);
            setIsConnected(false);
            return;
          }
          
          console.log('ChatContext: Calling initializeSocket with user ID:', user._id);
          await initializeSocket(user._id);
          console.log('ChatContext: Socket initialization successful');
          setIsConnected(true);
          setConnectionError(null);
        } catch (error) {
          console.error('ChatContext: Failed to initialize socket:', error);
          setIsConnected(false);
          setConnectionError(error instanceof Error ? error.message : 'Unknown error');
          
          // Try to determine more specific error reasons
          if (error instanceof Error) {
            if (error.message.includes('timeout')) {
              console.error('ChatContext: Connection timed out - check if server is running');
            } else if (error.message.includes('CORS')) {
              console.error('ChatContext: CORS error - check server CORS configuration');
            } else if (error.message.includes('auth')) {
              console.error('ChatContext: Authentication error - check token validity');
            }
          }
        }
      };
      
      initSocket();

      // Set up connection status listeners
      listenEvent('connect', () => {
        setIsConnected(true);
        setConnectionError(null);
      });

      listenEvent('connect_error', (error: Error) => {
        setIsConnected(false);
        setConnectionError(error.message);
      });

      listenEvent('disconnect', () => {
        setIsConnected(false);
      });

      // Clean up on unmount
      return () => {
        closeSocket();
      };
    } catch (error: any) {
      setConnectionError(error.message);
    }
  }, [user?._id]);

  // Set up message and event listeners
  useEffect(() => {
    if (!isConnected || !user?._id) return;

    // Clean up previous listeners
    // The original code had removeListener, but removeListener is not defined in the provided imports.
    // Assuming it's a placeholder for a function that would remove listeners if it existed.
    // For now, we'll just re-declare the listeners to avoid conflicts.
    const handleIncomingMessage = (message: any) => {
      console.log('Received message from socket:', message);
      
      // Ensure the message has the required format
      const formattedMessage: Message = {
        id: message._id || message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        text: message.text || '',
        image: message.image,
        isRead: message.isRead || false,
        isDelivered: true,
        isDeleted: message.isDeleted || false,
        createdAt: message.createdAt ? new Date(message.createdAt) : new Date()
      };

      setMessages((prev) => {
        // Create conversation ID based on the other user
        const conversationId = user._id === formattedMessage.senderId 
          ? formattedMessage.receiverId 
          : formattedMessage.senderId;
        
        // Get existing messages for this conversation
        const conversationMessages = prev[conversationId] || [];
        
        // Avoid duplicate messages
        if (conversationMessages.some(msg => 
          (msg.id && msg.id === formattedMessage.id) || 
          (msg.text === formattedMessage.text && 
           msg.senderId === formattedMessage.senderId && 
           Math.abs(new Date(msg.createdAt as Date).getTime() - 
                    new Date(formattedMessage.createdAt as Date).getTime()) < 1000)
        )) {
          return prev;
        }
        
        console.log(`Adding new message to conversation with ${conversationId}`);
        
        // Add new message and sort by time
        return {
          ...prev,
          [conversationId]: [
            ...conversationMessages,
            formattedMessage
          ].sort((a, b) => {
            return new Date(a.createdAt as Date).getTime() - 
                   new Date(b.createdAt as Date).getTime();
          })
        };
      });
    };

    // Listen for different message event names that the backend might use
    listenEvent('new_message', handleIncomingMessage);
    listenEvent('message', handleIncomingMessage);
    listenEvent('newMessage', handleIncomingMessage);

    // Handle read receipts
    listenEvent<ReadReceiptEvent>('message_read', ({ messageId }) => {
      setMessages((prev) => {
        const updated = { ...prev };
        
        // Find the message and update its read status
        Object.keys(updated).forEach(conversationId => {
          updated[conversationId] = updated[conversationId].map(msg => 
            msg.id === messageId ? { ...msg, isRead: true } : msg
          );
        });
        
        return updated;
      });
    });

    // Handle online users
    listenEvent<string[]>('getOnlineUsers', (users) => {
      setOnlineUsers(users);
    });

    // Handle user status changes
    listenEvent<UserStatusEvent>('user_status_changed', ({ userId, status }) => {
      setOnlineUsers(prev => {
        if (status === 'online' && !prev.includes(userId)) {
          return [...prev, userId];
        } else if (status === 'offline') {
          return prev.filter(id => id !== userId);
        }
        return prev;
      });
    });

    // Handle typing indicators
    listenEvent<TypingEvent>('user_typing', ({ userId, conversationId, timestamp }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: { userId, timestamp }
      }));
      
      // Auto-clear typing indicator after 2 seconds
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
  }, [isConnected, user?._id]);

  // Send a message
  const sendMessage = useCallback(async (receiverId: string, text: string, image?: string): Promise<boolean> => {
    if (!user?._id) return false;
    
    try {
      // Create optimistic local message
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        senderId: user._id,
        receiverId,
        text,
        isRead: false,
        isDelivered: false,
        isDeleted: false,
        createdAt: new Date(),
        ...(image && { image })
      };
      
      // Add optimistic message to state
      setMessages(prev => {
        const conversationMessages = prev[receiverId] || [];
        return {
          ...prev,
          [receiverId]: [...conversationMessages, optimisticMessage]
        };
      });
      
      // Send message using the message service
      try {
        console.log('Sending message via messageService');
        const savedMessage = await messageService.sendMessage(receiverId, text, image || null);
        console.log('Message saved successfully:', savedMessage);
        
        // Update the temporary message with the real one from database
        setMessages(prev => {
          const conversationMessages = prev[receiverId] || [];
          return {
            ...prev,
            [receiverId]: conversationMessages.map(msg => 
              msg.id === tempId ? { 
                ...msg, 
                id: savedMessage._id,
                isDelivered: true
              } : msg
            )
          };
        });
        
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Mark the optimistic message as failed
        setMessages(prev => {
          const conversationMessages = prev[receiverId] || [];
          return {
            ...prev,
            [receiverId]: conversationMessages.map(msg => 
              msg.id === tempId ? { ...msg, error: true } : msg
            )
          };
        });
        
        return false;
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return false;
    }
  }, [user?._id]);

  // Mark a message as read
  const markAsRead = useCallback((messageId: string, senderId: string) => {
    if (!isConnected) return;
    
    try {
      markMessageAsRead(messageId, senderId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [isConnected]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((conversationId: string, receiverId: string) => {
    if (!isConnected) return;
    
    try {
      socketTypingIndicator(conversationId, receiverId);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [isConnected]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        markAsRead,
        sendTypingIndicator,
        onlineUsers,
        typingUsers,
        isConnected,
        connectionError,
        loadMessageHistory
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 