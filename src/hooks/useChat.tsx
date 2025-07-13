"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { messageService } from '@/lib/messageService';
import { useAuth } from '@/context/AuthContext';
import { Message } from '@/types/socket';

export const useChat = (receiverId: string | null) => {
  const { socket, onlineUsers, isConnected } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: boolean}>({});

  // Load initial messages ONCE when component mounts or receiverId changes
  useEffect(() => {
    if (!receiverId || !user?._id) return;
    
    let isMounted = true;
    
    const loadMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Loading messages for conversation with ${receiverId}`);
        const fetchedMessages = await messageService.getMessages(receiverId);
        
        if (isMounted) {
          // Convert to frontend Message format
          const formattedMessages = fetchedMessages.map((msg: any) => 
            messageService.convertToFrontendMessage(msg)
          );
          
          console.log(`Loaded ${formattedMessages.length} messages`);
          setMessages(formattedMessages);
        }
      } catch (err: any) {
        console.error('Error loading messages:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load messages');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadMessages();
    
    return () => {
      isMounted = false;
    };
  }, [receiverId, user?._id]);

  // Set up socket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !receiverId || !user?._id) return;
    
    console.log('Setting up socket message listeners');
    
    const handleNewMessage = (message: any) => {
      console.log('Received new message:', message);
      
      // Only add message if it's relevant to current conversation
      if (message.senderId === receiverId || message.receiverId === receiverId) {
        const formattedMessage = messageService.convertToFrontendMessage(message);
        
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(m => m.id === formattedMessage.id)) {
            return prev.map(m => 
              m.id === formattedMessage.id ? { ...m, ...formattedMessage } : m
            );
          }
          return [...prev, formattedMessage].sort((a, b) => 
            new Date(a.createdAt as Date).getTime() - new Date(b.createdAt as Date).getTime()
          );
        });
      }
    };
    
    const handleTyping = (data: any) => {
      if (data.userId === receiverId) {
        console.log(`${receiverId} is typing...`);
        
        setTypingUsers(prev => ({ ...prev, [receiverId]: true }));
        
        // Auto-clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const updated = { ...prev };
            delete updated[receiverId];
            return updated;
          });
        }, 3000);
      }
    };
    
    const handleReadReceipt = (data: any) => {
      console.log('Message marked as read:', data);
      
      setMessages(prev => prev.map(msg => {
        // If this is the message that was read
        if (msg.id === data.messageId) {
          return { 
            ...msg, 
            isRead: true,
            isDelivered: true // Also ensure delivered flag is set
          };
        }
        return msg;
      }));
    };
    
    // Add event listeners for different possible event names
    socket.on('new_message', handleNewMessage);
    socket.on('message', handleNewMessage);
    socket.on('newMessage', handleNewMessage);
    
    // Enhanced delivery confirmation handler that checks all possible message identifiers
    const handleDeliveryConfirmation = (data: any) => {
      console.log('Message delivery confirmation received:', data);
      
      // Get all possible IDs from the data
      const possibleIds = [
        data.messageId,
        data._id,
        data.id
      ].filter(Boolean);
      
      // Get text from the data for matching
      const messageText = data.text || data.content || '';
      
      setMessages(prev => prev.map(msg => {
        // Check for ID match or temp message with matching text
        const isIdMatch = possibleIds.includes(msg.id);
        const isTempMessageMatch = msg.id?.toString().startsWith('temp-') && 
                                  msg.senderId === user._id && 
                                  msg.text === messageText;
        
        if (isIdMatch || isTempMessageMatch) {
          // Extract real ID from data if possible
          const realId = possibleIds.find(id => !String(id).startsWith('temp-')) || msg.id;
          
          return { 
            ...msg,
            id: realId, // Update with real ID from server
            isDelivered: true,
            error: false
          };
        }
        return msg;
      }));
    };
    
    // Listen for all possible delivery confirmation events
    const deliveryEvents = [
      'message_delivered', 
      'message_sent', 
      'delivery_confirmation',
      'message_confirmed',
      'message_received'
    ];
    
    deliveryEvents.forEach(event => {
      socket.on(event, handleDeliveryConfirmation);
    });
    
    // Listen for message ack event that might contain sent message
    socket.on('message_ack', (data: any) => {
      console.log('Message ack received:', data);
      
      // Handle both object and string formats
      let messageData = data;
      if (typeof data === 'string') {
        try {
          messageData = JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse message_ack data');
        }
      }
      
      handleDeliveryConfirmation(messageData);
    });
    
    socket.on('typing', handleTyping);
    socket.on('user_typing', handleTyping);
    
    socket.on('read_message', handleReadReceipt);
    socket.on('message_read', handleReadReceipt);
    
    // Clean up event listeners
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message', handleNewMessage);
      socket.off('newMessage', handleNewMessage);
      
      deliveryEvents.forEach(event => {
        socket.off(event, handleDeliveryConfirmation);
      });
      
      socket.off('message_ack', handleDeliveryConfirmation);
      
      socket.off('typing', handleTyping);
      socket.off('user_typing', handleTyping);
      
      socket.off('read_message', handleReadReceipt);
      socket.off('message_read', handleReadReceipt);
    };
  }, [socket, receiverId, user?._id]);

  // Send message function
  const sendMessage = useCallback(async (text: string, image: string | null = null): Promise<boolean> => {
    if (!receiverId || !user?._id || !text.trim()) return false;
    
    // Create the tempId outside try/catch so it's available in both blocks
    const tempId = `temp-${Date.now()}`;
    
    try {
      // Create optimistic message
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
      
      // Add optimistic message
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Send through API
      const savedMessage = await messageService.sendMessage(receiverId, text, image);
      
      // Replace optimistic message with saved message
      setMessages(prev => prev.map(msg => {
        // Find the temporary message we need to update
        if (msg.id === tempId) {
          // Create a properly formatted message with delivered status
          const updatedMessage = messageService.convertToFrontendMessage(savedMessage);
          console.log('Replacing temp message with saved message:', updatedMessage);
          
          return {
            ...updatedMessage,
            isDelivered: true // Explicitly mark as delivered since it was saved in DB
          };
        }
        return msg;
      }));
      
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Mark optimistic message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, error: true } : msg
      ));
      
      setError('Failed to send message');
      return false;
    }
  }, [receiverId, user?._id]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!socket?.connected || !receiverId || !user?._id) return;
    
    const conversationId = `${user._id}_${receiverId}`;
    socket.emit('typing', { conversationId, receiverId });
  }, [socket, receiverId, user?._id]);

  // Mark message as read
  const markAsRead = useCallback((messageId: string, senderId: string) => {
    if (!socket?.connected || !user?._id) return;
    
    socket.emit('read_message', { messageId, senderId });
  }, [socket, user?._id]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    isOnline: onlineUsers.includes(receiverId || ''),
    isTyping: typingUsers[receiverId || ''] || false,
    isConnected
  };
}; 