import { API_BASE_URL, getHeaders, handleApiResponse, ApiResponse } from './config';
import { IUser, IFriendRequest } from '@/types/index';

interface FriendRequestsResponse {
  incoming: Array<IFriendRequest & { sender: IUser }>;
  outgoing: Array<IFriendRequest & { receiver: IUser }>;
}

/**
 * Gets the current user's friends list
 */
export const getFriendsList = async (): Promise<ApiResponse<IUser[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<IUser[]>(response);
  } catch (error) {
    console.error('Failed to fetch friends list:', error);
    throw error;
  }
};

/**
 * Gets the current user's friend requests
 */
export const getFriendRequestsList = async (): Promise<ApiResponse<FriendRequestsResponse>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<FriendRequestsResponse>(response);
  } catch (error) {
    console.error('Failed to fetch friend requests:', error);
    throw error;
  }
};

/**
 * Search for users
 */
export const searchForUsers = async (query: string): Promise<ApiResponse<IUser[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<IUser[]>(response);
  } catch (error) {
    console.error('Failed to search users:', error);
    throw error;
  }
};

/**
 * Send friend request to user
 */
export const sendFriendRequest = async (userId: string): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId }),
      credentials: 'include'
    });
    
    return await handleApiResponse<null>(response);
  } catch (error) {
    console.error('Failed to send friend request:', error);
    throw error;
  }
};

/**
 * Accept friend request
 */
export const acceptFriendRequest = async (requestId: string): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/request/${requestId}/accept`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<null>(response);
  } catch (error) {
    console.error('Failed to accept friend request:', error);
    throw error;
  }
};

/**
 * Reject friend request
 */
export const rejectFriendRequest = async (requestId: string): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/request/${requestId}/reject`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<null>(response);
  } catch (error) {
    console.error('Failed to reject friend request:', error);
    throw error;
  }
};

/**
 * Remove friend
 */
export const removeFriend = async (friendId: string): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${friendId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<null>(response);
  } catch (error) {
    console.error('Failed to remove friend:', error);
    throw error;
  }
}; 