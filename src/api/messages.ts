import { API_BASE_URL, getHeaders, handleApiResponse, ApiResponse } from './config';
import { IMessage, IUser } from '@/types/index';
import { emitEvent } from '@/lib/socket';

interface MessagesResponse {
  messages: IMessage[];
  recipient?: IUser;
}

/**
 * Gets users available to chat with
 */
export const getChatUsers = async (): Promise<ApiResponse<IUser[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/users`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<IUser[]>(response);
  } catch (error) {
    console.error('Failed to fetch chat users:', error);
    throw error;
  }
};

/**
 * Gets message history for a specific conversation
 */
export const getMessageHistory = async (userId: string): Promise<ApiResponse<MessagesResponse>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${userId}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<MessagesResponse>(response);
  } catch (error) {
    console.error('Failed to fetch message history:', error);
    throw error;
  }
};

/**
 * Sends a message to a specific user
 */
export const sendMessage = async (recipientId: string, message: string, image?: string): Promise<ApiResponse<IMessage>> => {
  try {
    // Create the message payload with all required fields
    const payload = {
      text: message,
      isRead: false,
      isDelivered: false,
      isDeleted: false,
      ...(image && { image })
    };

    // First try to send via socket
    console.log('Attempting to send message via socket first');
    const socketSuccess = await emitEvent('send_message', {
      receiverId: recipientId,
      ...payload
    });

    if (socketSuccess) {
      console.log('Message sent successfully via socket');
      // Create a minimal message object to satisfy the type
      const socketMessage: IMessage = {
        _id: Date.now().toString(), // Temporary ID
        receiverId: recipientId,
        senderId: '', // Will be populated by backend
        text: message,
        isRead: false,
        isDelivered: false,
        isDeleted: false,
        createdAt: new Date()
      };
      return { success: true, data: socketMessage, message: 'Message sent via socket' };
    }

    // Fall back to HTTP if socket fails
    console.log('Socket send failed, falling back to HTTP API');
    const response = await fetch(`${API_BASE_URL}/messages/send/${recipientId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    
    return await handleApiResponse<IMessage>(response);
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}; 