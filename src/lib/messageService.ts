import Cookies from 'js-cookie';
import { sendMessage as socketSendMessage } from './socket';
import { Message } from '@/types/socket';
import { IMessage } from '@/types';

class MessageService {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL = 'http://localhost:3001', token: string | null = null) {
    this.baseURL = baseURL;
    this.token = token || Cookies.get('auth_token') || null;
  }

  setToken(token: string): void {
    this.token = token;
  }

  getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async getMessages(userToChatId: string): Promise<IMessage[]> {
    try {
      
      const response = await fetch(`${this.baseURL}/messages/${userToChatId}`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch messages' }));
        throw new Error(errorData.error || `Failed to fetch messages: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle different response formats from API
      let messages: IMessage[] = [];
      
      if (Array.isArray(result)) {
        messages = result;
      } else if (result.messages) {
        messages = result.messages;
      } else if (result.data?.messages) {
        messages = result.data.messages;
      }
      
      console.log(`Successfully fetched ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(receiverId: string, text: string, image: string | null = null): Promise<IMessage> {
    try {
      console.log(`Sending message to ${receiverId}: ${text}`);
      
      const payload = {
        text,
        image
      };

      const response = await fetch(`${this.baseURL}/messages/send/${receiverId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || `Failed to send message: ${response.status}`);
      }

      const savedMessage = await response.json();
      console.log('Message saved to database:', savedMessage);
      
      // Also notify via socket for real-time update
      try {
        // Import socket directly to have more control
        const { getSocket } = await import('./socket');
        
        // Get socket connection
        const socket = await getSocket().catch(err => {
          console.warn('Could not get socket connection:', err);
          return null;
        });
        
        if (socket) {
          // Prepare message for socket with real DB ID
          const socketMessage = {
            messageId: savedMessage._id,
            receiverId,
            senderId: savedMessage.senderId,
            text,
            image,
            createdAt: savedMessage.createdAt || new Date()
          };
          
          console.log('Emitting message via socket with ID:', savedMessage._id);
          
          // Try all possible event names to ensure compatibility
          socket.emit('message', socketMessage);
          socket.emit('send_message', socketMessage);
          
          // Also emit specific delivery event
          socket.emit('message_delivered', { 
            messageId: savedMessage._id,
            receiverId,
            text
          });
        } else {
          console.log('Socket unavailable, message sent via HTTP only');
        }
      } catch (socketError) {
        console.warn('Socket notification failed, but message was saved:', socketError);
      }

      return savedMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/messages/${messageId}/read`, {
        method: 'PUT',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to mark message as read' }));
        throw new Error(errorData.error || `Failed to mark message as read: ${response.status}`);
      }

      return;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Convert API message format to frontend format
  convertToFrontendMessage(message: IMessage): Message {
    return {
      id: message._id, // Use _id as the ID field
      senderId: message.senderId,
      receiverId: message.receiverId,
      text: message.text || '',
      image: message.image,
      isRead: message.isRead || false,
      isDelivered: true, // Messages from the server are always considered delivered
      isDeleted: message.isDeleted || false,
      createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
      ...(message.readAt && { readAt: new Date(message.readAt) })
    };
  }
}

// Create and export a singleton instance
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const messageService = new MessageService(apiUrl);

export default MessageService; 