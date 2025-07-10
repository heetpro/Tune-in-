import { API_BASE_URL, ApiResponse } from './config';
import Cookies from 'js-cookie';

/**
 * Redirects to Spotify login page
 */
export const loginWithSpotify = (): void => {
  window.location.href = `${API_BASE_URL}/spotify/login`;
};

/**
 * Logs out the current user and clears cookies
 */
export const logout = async (): Promise<ApiResponse<null>> => {
  try {
    const token = Cookies.get('auth_token');
    console.log('Logging out user...');
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
    
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      mode: 'cors'
    });
    
    // Clear stored tokens regardless of response
    Cookies.remove('auth_token');
    Cookies.remove('refresh_token');
    
    if (!response.ok) {
      console.error('Error during logout:', response.status, response.statusText);
      return {
        success: false,
        message: 'Error during logout, but cookies were cleared'
      };
    }
    
    try {
      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Logged out successfully',
        data: null
      };
    } catch (e) {
      return {
        success: true,
        message: 'Logged out successfully',
        data: null
      };
    }
  } catch (error) {
    console.error('Logout failed:', error);
    // Clear cookies anyway
    Cookies.remove('auth_token');
    Cookies.remove('refresh_token');
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error during logout',
      error
    };
  }
};

/**
 * Checks if the user has completed onboarding
 */
export const checkOnboardingStatus = async (): Promise<ApiResponse<{ hasCompletedOnboarding: boolean }>> => {
  try {
    const token = Cookies.get('auth_token');
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
    
    const response = await fetch(`${API_BASE_URL}/onboarding`, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      console.error('Failed to check onboarding status:', response.status, response.statusText);
      const errorText = await response.text();
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || 'Unknown error' };
      }
      
      return {
        success: false,
        message: errorData.message || 'Failed to check onboarding status',
        error: errorData
      };
    }
    
    const data = await response.json();
    
    // If backend already returns in correct format
    if (data.hasOwnProperty('success')) {
      return data;
    }
    
    // Otherwise, wrap the data
    return {
      success: true,
      data: { hasCompletedOnboarding: data.hasCompletedOnboarding || false }
    };
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to check onboarding status',
      error
    };
  }
}; 