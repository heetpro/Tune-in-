"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { IMessage } from '@/types/index';
import { getMessageHistory, sendMessage } from '@/api';
import { getSocket, emitEvent, listenEvent, removeListener } from '@/lib/socket';
import { Socket } from 'socket.io-client';

interface ChatProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

const Chat: React.FC<ChatProps> = ({ recipientId, recipientName, recipientAvatar }) => {
  const { 
    messages, 
    sendMessage: chatSendMessage, 
    markAsRead, 
    sendTypingIndicator,
    onlineUsers,
    typingUsers,
    isConnected,
  } = useChat();
  
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get messages for this conversation
  const conversationMessages = messages[recipientId] || [];
  
  // Determine if recipient is online
  const isRecipientOnline = onlineUsers.includes(recipientId);
  
  // Determine if recipient is typing
  const isTyping = typingUsers[recipientId]?.userId === recipientId;
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);
  
  // Mark messages as read when viewed
  useEffect(() => {
    if (!user?._id) return;
    
    conversationMessages.forEach(message => {
      if (message.senderId === recipientId && !message.isRead) {
        markAsRead(message.id, message.senderId);
      }
    });
  }, [conversationMessages, markAsRead, recipientId, user?._id]);
  
  // Handle input change and send typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    // Send typing indicator when user types
    if (e.target.value) {
      sendTypingIndicator(recipientId, recipientId);
    }
  };
  
  // Handle form submission to send message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() || isSending) return;
    
    setIsSending(true);
    const success = await chatSendMessage(recipientId, inputText);
    setIsSending(false);
    
    if (success) {
      setInputText('');
    }
  };
  
  // Format timestamp to readable time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="chat-container">
      {/* Header with recipient info */}
      <div className="chat-header">
        <div className="recipient-info">
          {recipientAvatar && (
            <img 
              src={recipientAvatar} 
              alt={recipientName} 
              className="avatar"
            />
          )}
          <div>
            <h3>{recipientName}</h3>
            <span className={`status ${isRecipientOnline ? 'online' : 'offline'}`}>
              {isRecipientOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="messages-container">
        {conversationMessages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          <>
            {conversationMessages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.senderId === user?._id ? 'outgoing' : 'incoming'}`}
              >
                <div className="message-bubble">
                  <p>{message.text}</p>
                  <div className="message-meta">
                    <span className="time">{formatTime(message.createdAt)}</span>
                    {message.senderId === user?._id && (
                      <span className="status">
                        {message.isRead ? (
                          <span className="read">✓✓</span>
                        ) : message.isDelivered ? (
                          <span className="delivered">✓</span>
                        ) : null}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="typing-indicator">
                <span>{recipientName} is typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Message input form */}
      <form onSubmit={handleSubmit} className="message-input-form">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={!isConnected || isSending}
          className="message-input"
        />
        <button 
          type="submit" 
          disabled={!isConnected || !inputText.trim() || isSending}
          className="send-button"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
      
      {/* Connection status */}
      {!isConnected && (
        <div className="connection-error">
          Disconnected. Trying to reconnect...
        </div>
      )}
    </div>
  );
};

export default Chat; 