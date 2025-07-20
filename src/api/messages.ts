import { API_BASE_URL, getHeaders, handleApiResponse, ApiResponse } from './config';
import { IMessage, IUser } from '@/types/index';
import { Message } from '@/types/socket';
import { emitEvent, sendMessage as socketSendMessage } from '@/lib/socket';
import { getFriendsList } from './friends';

interface MessagesResponse {
  messages: IMessage[];
  recipient?: IUser;
}

/**
 * Gets users available to chat with
 */
export const getChatUsers = async (): Promise<ApiResponse<IUser[]>> => {
  try {
    // First try the dedicated chat users endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/messages/users`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });
      
      const result = await handleApiResponse<IUser[]>(response);
      
      // If we got valid data, return it
      if (result.success && result.data && result.data.length > 0) {
        return result;
      }
      
      
    } catch (error) {
      console.error('Failed to fetch chat users from primary endpoint:', error);
    }
    
    // Fallback: use the friends list if chat users endpoint fails or returns empty
    return await getFriendsList();
    
  } catch (error) {
    console.error('Failed to fetch chat users:', error);
    throw error;
  }
};

/**
 * Fetches message history between current user and specified user
 */
export const getMessageHistory = async (userId: string): Promise<ApiResponse<{ messages: IMessage[] }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${userId}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<{ messages: IMessage[] }>(response);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
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
      image: image || null
    };

    // Always use HTTP first to ensure the message is saved to the database
    const response = await fetch(`${API_BASE_URL}/messages/send/${recipientId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    
    const result = await handleApiResponse<IMessage>(response);
    
    if (result.success && result.data) {
      // Message saved to database successfully
      // Now try to send via socket for real-time delivery if needed
      try {
        socketSendMessage(recipientId, message);
      } catch (socketError) {
        console.error('Socket notification failed, but message was saved:', socketError);
        // Don't fail the operation since the message is already saved
      }
      
      return result;
    }
    
    return result;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}; 