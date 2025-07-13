"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeSocket, getSocket, closeSocket, listenEvent, getUserId, sendMessage as socketSendMessage, 
  markMessageAsRead, sendTypingIndicator as socketTypingIndicator, testServerConnectivity } from '@/lib/socket';
import { Message, UserStatusEvent, TypingEvent, ReadReceiptEvent } from '@/types/socket';
import { useAuth } from './AuthContext';
import Cookies from 'js-cookie';

interface ChatContextType {
  messages: Record<string, Message[]>; // Organized by conversation
  sendMessage: (receiverId: string, text: string, image?: string) => Promise<boolean>;
  markAsRead: (messageId: string, senderId: string) => void;
  sendTypingIndicator: (conversationId: string, receiverId: string) => void;
  onlineUsers: string[];
  typingUsers: Record<string, { userId: string; timestamp: number }>;
  isConnected: boolean;
  connectionError: string | null;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, { userId: string; timestamp: number }>>({});
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { user } = useAuth();

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

    // Handle incoming messages
    listenEvent<Message>('new_message', (message) => {
      setMessages((prev) => {
        // Create conversation ID based on the other user
        const conversationId = user._id === message.senderId 
          ? message.receiverId 
          : message.senderId;
        
        // Get existing messages for this conversation
        const conversationMessages = prev[conversationId] || [];
        
        // Avoid duplicate messages
        if (conversationMessages.some(msg => msg.id === message.id)) {
          return prev;
        }
        
        // Make sure message has all required fields
        const completeMessage: Message = {
          ...message,
          isRead: message.isRead ?? false,
          isDelivered: message.isDelivered ?? true,
          isDeleted: message.isDeleted ?? false,
          createdAt: message.createdAt ? new Date(message.createdAt) : new Date()
        };
        
        // Add new message and sort by time
        return {
          ...prev,
          [conversationId]: [
            ...conversationMessages,
            completeMessage
          ].sort((a, b) => {
            return new Date(a.createdAt as Date).getTime() - 
                   new Date(b.createdAt as Date).getTime();
          })
        };
      });
    });

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
      
      // Send message via HTTP API (this will save to database)
      try {
        console.log('Sending message via HTTP API with payload:', { text, image: image ? '[image data]' : undefined });
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const authToken = Cookies.get('auth_token');
        
        console.log('API URL:', apiUrl);
        console.log('Auth token exists:', !!authToken);
        
        // Create the exact payload format that the backend expects
        const payload: { text: string, image?: string } = { text };
        if (image) payload.image = image;
        
        const response = await fetch(`${apiUrl}/messages/send/${receiverId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify(payload),
          credentials: 'include'
        });
        
        console.log('HTTP response status:', response.status);
        
        if (response.ok) {
          // Get saved message from response
          const savedMessage = await response.json();
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
          
          // Also try socket notification
          socketSendMessage(receiverId, text).catch(err => {
            console.warn('Socket notification failed:', err);
          });
          
          return true;
        } else {
          // Try to get error details from response
          let errorDetails = '';
          try {
            const errorResponse = await response.json();
            errorDetails = JSON.stringify(errorResponse);
            console.error('Server error details:', errorResponse);
          } catch (parseError) {
            try {
              errorDetails = await response.text();
              console.error('Server error text:', errorDetails);
            } catch (textError) {
              console.error('Could not parse error response');
            }
          }
          
          throw new Error(`HTTP error: ${response.status} - ${errorDetails}`);
        }
      } catch (httpError) {
        console.error('HTTP send failed:', httpError);
        
        // Try socket as fallback
        console.log('Falling back to socket for message send');
        const socketSuccess = await socketSendMessage(receiverId, text);
        
        if (!socketSuccess) {
          // Mark the optimistic message as failed if both methods fail
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
        
        // Socket succeeded but HTTP failed
        setMessages(prev => {
          const conversationMessages = prev[receiverId] || [];
          return {
            ...prev,
            [receiverId]: conversationMessages.map(msg => 
              msg.id === tempId ? { ...msg, isDelivered: true } : msg
            )
          };
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error sending message:', error);
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