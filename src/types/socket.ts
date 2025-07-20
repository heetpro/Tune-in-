import { IUser } from './index';

// Message related interfaces
export interface Message {
  id?: string;            // Optional for new messages, required when received from server
  senderId: string;       // User ID of sender
  receiverId: string;     // User ID of recipient
  text: string;           // Message content
  isRead: boolean;        // Whether message has been read (REQUIRED)
  isDelivered: boolean;   // Whether message has been delivered (REQUIRED)
  isDeleted: boolean;     // Soft delete flag (REQUIRED)
  createdAt?: Date;       // Creation timestamp
  readAt?: Date;          // When the message was read
  image?: string;         // Optional image URL
  error?: boolean;        // Whether the message had an error sending
}

// For sending new messages (matches what server expects)
export interface SendMessagePayload {
  receiverId: string;
  text: string;
}

// Server response format
export interface MessageResponse {
  status: 'ok' | 'error';
  message: Message | string;
}

// User related interfaces
export interface User {
  _id: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  status?: 'online' | 'offline' | 'away';
}

// For profile information in chats
export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  isOnline?: boolean;
  userData?: IUser;       // Full user data for profile modal and other features
}

// Conversation schema
export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastActivity: Date;
  unreadCount?: number;   // Calculated on frontend
  participantInfo?: {     // Populated on frontend
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
}

// Socket event interfaces
export interface UserStatusEvent {
  userId: string;
  status: 'online' | 'offline';
}

export interface TypingEvent {
  userId: string;
  conversationId: string;
  timestamp: number;
}

export interface ReadReceiptEvent {
  messageId: string;
}

// Payload types for socket events
export interface ReadMessageEvent {
  messageId: string;
  senderId: string;
}

export interface TypingIndicatorEvent {
  conversationId: string;
  receiverId: string;
} 