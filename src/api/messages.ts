import { API_BASE_URL, getHeaders, handleApiResponse, ApiResponse } from './config';
import { IMessage, IUser } from '@/types/index';

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
    const payload = {
      text: message,
      ...(image && { image })
    };

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