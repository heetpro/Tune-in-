import { API_BASE_URL, getHeaders, handleApiResponse, ApiResponse } from './config';
import { IUser } from '@/types/index';
import Cookies from 'js-cookie';

/**
 * Gets the current user's profile
 */
export const getMyProfile = async (): Promise<ApiResponse<IUser>> => {
  try {
    const token = Cookies.get('auth_token');
    console.log(`Fetching user profile from: ${API_BASE_URL}/profile/me`);
    console.log('Auth token present:', !!token);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
    
    console.log('Using headers:', headers);
    
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
      mode: 'cors'
    });
    
    console.log('Profile API response status:', response.status);
    
    if (!response.ok) {
      console.error('Error fetching profile:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || 'Unknown error' };
      }
      
      if (response.status === 401) {
        Cookies.remove('auth_token');
        Cookies.remove('refresh_token');
      }
      
      return {
        success: false,
        message: errorData.message || `API error: ${response.status} ${response.statusText}`,
        error: errorData
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error
    };
  }
};

/**
 * Updates the user's username
 */
export const setUsername = async (username: string): Promise<ApiResponse<null>> => {
  try {
    const token = Cookies.get('auth_token');
    console.log(`Updating username to: ${username}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
    
    const response = await fetch(`${API_BASE_URL}/username`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ username }),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      console.error('Error updating username:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || 'Unknown error' };
      }
      
      return {
        success: false,
        message: errorData.message || `API error: ${response.status} ${response.statusText}`,
        error: errorData
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to update username:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error
    };
  }
}; 