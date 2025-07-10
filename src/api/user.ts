import { API_BASE_URL, getHeaders, handleApiResponse, getCachedResponse, ApiResponse } from './config';
import { IUser } from '@/types/index';

const PROFILE_CACHE_KEY = 'user_profile';

/**
 * Gets the current user's profile
 */
export const getMyProfile = async (): Promise<ApiResponse<IUser>> => {
  try {
    // Check cache first
    const cachedResponse = getCachedResponse(PROFILE_CACHE_KEY);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<IUser>(response, PROFILE_CACHE_KEY);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

/**
 * Updates the user's username
 */
export const setUsername = async (username: string): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/username`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username }),
      credentials: 'include'
    });
    
    return await handleApiResponse<null>(response);
  } catch (error) {
    console.error('Failed to update username:', error);
    throw error;
  }
}; 