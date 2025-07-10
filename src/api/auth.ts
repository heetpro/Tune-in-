import { API_BASE_URL, getHeaders, handleApiResponse, ApiResponse } from './config';
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
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    // Clear stored tokens regardless of response
    Cookies.remove('auth_token');
    Cookies.remove('refresh_token');
    
    return await handleApiResponse<null>(response);
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

/**
 * Checks if the user has completed onboarding
 */
export const checkOnboardingStatus = async (): Promise<ApiResponse<{ hasCompletedOnboarding: boolean }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/onboarding`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<{ hasCompletedOnboarding: boolean }>(response);
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    throw error;
  }
}; 