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
    const response = await fetch(`${API_BASE_URL}/friends`, {
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
    const response = await fetch(`${API_BASE_URL}/friends/requests`, {
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
    const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    // Clone the response before reading its body
    const responseClone = response.clone();
    
    // Process the main response
    const result = await handleApiResponse<IUser[]>(response);
    
    // Log the raw response for debugging
    try {
      const responseBody = await responseClone.json();
      console.log('Response data:', responseBody);
      
      // If the API returns data directly without our expected wrapper structure
      if (Array.isArray(responseBody) && !result.data) {
        return {
          success: true,
          data: responseBody
        };
      }
    } catch (err) {
      console.error('Error parsing cloned response:', err);
    }
    
    return result;
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
      // Change this line - use receiverId instead of userId
      body: JSON.stringify({ receiverId: userId }),
      credentials: 'include'
    });
    
    // Rest of your function remains the same...
    const responseClone = response.clone();
    
    try {
      // Try to handle the normal way
      const result = await handleApiResponse<null>(response);
      return result;
    } catch (apiError) {
      console.error("Error handling API response:", apiError);
      
      // Fallback: Try to parse the response manually
      try {
        const responseBody = await responseClone.text();
        console.log("Raw response:", responseBody);
        
        // Check if response is empty or not JSON
        if (!responseBody || responseBody.trim() === '') {
          if (response.ok) {
            // Empty but successful response
            return { success: true, data: null };
          }
        }
        
        // Try to parse as JSON if possible
        try {
          const jsonBody = JSON.parse(responseBody);
          return { 
            success: response.ok, 
            data: null,
            message: jsonBody.message || response.statusText,
            error: response.ok ? null : jsonBody
          };
        } catch (jsonError) {
          // Not JSON, return text-based response
          return {
            success: response.ok,
            data: null,
            message: response.ok ? "Request successful" : responseBody || response.statusText
          };
        }
      } catch (fallbackError) {
        console.error("Failed to parse response in fallback handler:", fallbackError);
        throw apiError; // Throw original error if fallback fails
      }
    }
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
    console.log("accept friend request", response);
    
    // Clone the response for debugging
    const responseClone = response.clone();
    
    try {
      // Try to handle the normal way
      const result = await handleApiResponse<null>(response);
      return result;
    } catch (apiError) {
      console.error("Error handling API response:", apiError);
      
      // Fallback: Try to parse the response manually
      try {
        const responseBody = await responseClone.text();
        console.log("Raw response:", responseBody);
        
        // Check if response is empty or not JSON
        if (!responseBody || responseBody.trim() === '') {
          if (response.ok) {
            // Empty but successful response
            return { success: true, data: null };
          }
        }
        
        // Try to parse as JSON if possible
        try {
          const jsonBody = JSON.parse(responseBody);
          return { 
            success: response.ok, 
            data: null,
            message: jsonBody.message || response.statusText,
            error: response.ok ? null : jsonBody
          };
        } catch (jsonError) {
          // Not JSON, return text-based response
          return {
            success: response.ok,
            data: null,
            message: response.ok ? "Request accepted" : responseBody || response.statusText
          };
        }
      } catch (fallbackError) {
        console.error("Failed to parse response in fallback handler:", fallbackError);
        throw apiError; // Throw original error if fallback fails
      }
    }
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
    console.log("reject friend request", response);
    
    // Clone the response for debugging
    const responseClone = response.clone();
    
    try {
      // Try to handle the normal way
      const result = await handleApiResponse<null>(response);
      return result;
    } catch (apiError) {
      console.error("Error handling API response:", apiError);
      
      // Fallback: Try to parse the response manually
      try {
        const responseBody = await responseClone.text();
        console.log("Raw response:", responseBody);
        
        // Check if response is empty or not JSON
        if (!responseBody || responseBody.trim() === '') {
          if (response.ok) {
            // Empty but successful response
            return { success: true, data: null };
          }
        }
        
        // Try to parse as JSON if possible
        try {
          const jsonBody = JSON.parse(responseBody);
          return { 
            success: response.ok, 
            data: null,
            message: jsonBody.message || response.statusText,
            error: response.ok ? null : jsonBody
          };
        } catch (jsonError) {
          // Not JSON, return text-based response
          return {
            success: response.ok,
            data: null,
            message: response.ok ? "Request rejected" : responseBody || response.statusText
          };
        }
      } catch (fallbackError) {
        console.error("Failed to parse response in fallback handler:", fallbackError);
        throw apiError; // Throw original error if fallback fails
      }
    }
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
    console.log("remove friend", response);
    
    // Clone the response for debugging
    const responseClone = response.clone();
    
    try {
      // Try to handle the normal way
      const result = await handleApiResponse<null>(response);
      return result;
    } catch (apiError) {
      console.error("Error handling API response:", apiError);
      
      // Fallback: Try to parse the response manually
      try {
        const responseBody = await responseClone.text();
        console.log("Raw response:", responseBody);
        
        // Check if response is empty or not JSON
        if (!responseBody || responseBody.trim() === '') {
          if (response.ok) {
            // Empty but successful response
            return { success: true, data: null };
          }
        }
        
        // Try to parse as JSON if possible
        try {
          const jsonBody = JSON.parse(responseBody);
          return { 
            success: response.ok, 
            data: null,
            message: jsonBody.message || response.statusText,
            error: response.ok ? null : jsonBody
          };
        } catch (jsonError) {
          // Not JSON, return text-based response
          return {
            success: response.ok,
            data: null,
            message: response.ok ? "Friend removed" : responseBody || response.statusText
          };
        }
      } catch (fallbackError) {
        console.error("Failed to parse response in fallback handler:", fallbackError);
        throw apiError; // Throw original error if fallback fails
      }
    }
  } catch (error) {
    console.error('Failed to remove friend:', error);
    throw error;
  }
}; 