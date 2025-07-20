import { API_BASE_URL, getHeaders, handleApiResponse, ApiResponse } from './config';
import { IUser, OnboardingFormData } from '@/types/index';
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
    
    // The backend returns the user object directly, not wrapped in a success/data structure
    const userData = await response.json();
    console.log('Received user data:', userData);
    
    // Convert to our expected format based on updated backend response
    return {
      success: true,
      data: {
        _id: userData.id || userData._id,
        spotifyId: userData.spotifyId,
        username: userData.username,
        displayName: userData.displayName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profilePicture: userData.profilePicture,
        bio: userData.bio,
        age: userData.age,
        gender: userData.gender,
        intrestedIn: userData.intrestedIn || [],
        lastSeen: userData.lastSeen,
        friends: userData.friends || [],
        friendRequests: userData.friendRequests || { incoming: [], outgoing: [] },
        location: userData.location || {
          city: userData.city || '',
          country: userData.country || '',
          coordinates: {
            lat: 0,
            lng: 0
          }
        },
        privacySettings: userData.privacySettings || {
          showAge: true,
          showLocation: true,
          showLastSeen: true
        },
        notifications: userData.notifications || {
          newMessages: true,
          newLikes: true,
          newMatches: true,
          newFriendRequests: true
        },
        hasCompletedOnboarding: userData.hasCompletedOnboarding === true,
        isPremium: userData.isPremium || false,
        isVerified: userData.isVerified || false,
        isBanned: userData.isBanned || false,
        isAdmin: userData.isAdmin || false,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    };
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
    
    // Backend might return different response format
    const responseData = await response.json();
    
    // Ensure we return the expected format
    return {
      success: true,
      message: responseData.message || 'Username updated successfully',
      data: null
    };
  } catch (error) {
    console.error('Failed to update username:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error
    };
  }
}; 

export const editProfile = async (profileData: Partial<IUser>): Promise<ApiResponse<null>> => {
  try {
    const token = Cookies.get('auth_token');
    console.log('Updating profile data:', profileData);
    
    // Clean up the profile data to remove any undefined or empty values
    const cleanProfileData = Object.entries(profileData).reduce((acc, [key, value]) => {
      // Only include defined values
      if (value !== undefined && value !== null) {
        // For objects like location, only include if they have properties
        if (typeof value === 'object' && !Array.isArray(value)) {
          const objValue = value as Record<string, any>;
          if (Object.keys(objValue).length > 0) {
            acc[key] = objValue;
          }
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as Record<string, any>);
    
    console.log('Cleaned profile data for API:', cleanProfileData);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
    
    console.log('Making API call to:', `${API_BASE_URL}/profile/edit`);
    
    const response = await fetch(`${API_BASE_URL}/profile/edit`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(cleanProfileData),
      credentials: 'include',
      mode: 'cors'
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      console.error('Error updating profile:', response.status, response.statusText);
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
    
    const responseData = await response.json();
    console.log('Profile update success response:', responseData);
    
    return {
      success: true,
      message: responseData.message || 'Profile updated successfully',
      data: null
    };
  } catch (error) {
    console.error('Failed to update profile:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error
    };
  }   
}; 

/**
 * Get user profile by ID
 */
export const getUserById = async (userId: string): Promise<ApiResponse<IUser>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<IUser>(response);
  } catch (error) {
    console.error('Failed to fetch user profile by ID:', error);
    throw error;
  }
}; 