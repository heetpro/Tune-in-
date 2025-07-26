import { API_BASE_URL, getHeaders, handleApiResponse, ApiResponse } from './config';
import { IUser, IFriendRequest } from '@/types/index';



export const sendFriendRequest = async (userId: string): Promise<ApiResponse<IUser[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/request/${userId}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<IUser[]>(response);
  } catch (error) {
    console.error('Failed to fetch friends list:', error);
    throw error;
  }
};

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
export const getFriendRequestsList = async ():  Promise<ApiResponse<IUser[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });

    const clonedResponse = response.clone();
    try {
      const rawData = await clonedResponse.text();
      
      if (rawData && rawData.trim().startsWith('{') || rawData.trim().startsWith('[')) {
        try {
          const parsedData = JSON.parse(rawData);
        } catch (parseErr) {
          console.error('Failed to parse raw response as JSON:', parseErr);
        }
      }
    } catch (textErr) {
      console.error('Failed to read raw response text:', textErr);
    }
    
    const result = await handleApiResponse<IUser[]>(response);
    return result;
  } catch (error) {
    console.error('Failed to fetch friend requests:', error);
    throw error;
  }
};

/**
 * Search for users
 * This returns users with their friendship status:
 * - friends: User is already a friend
 * - request-sent: A friend request has been sent to this user
 * - request-received: This user has sent a friend request to the current user
 * - none: No relationship with this user
 */
export const searchForUsers = async (query: string): Promise<ApiResponse<IUser[]>> => {
  try {
    // Try different endpoint formats since the backend might use different conventions
    const endpoint = `/search?query=${encodeURIComponent(query)}`
  
    
      try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('Trying search URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include'
        });

        
        
        console.log(`Response status for ${endpoint}:`, response);
        
        if (!response.ok) {
          console.log(`Endpoint ${endpoint} returned status ${response.status}, trying next...`);
        }
        
        // Clone the response before processing
        const responseClone = response.clone();
        const rawText = await responseClone.text();
        console.log(`Raw response from ${endpoint}:`, rawText.substring(0, 100) + (rawText.length > 100 ? '...' : ''));
        
        // Parse the JSON
        try {
          const data = JSON.parse(rawText);
          
          if (Array.isArray(data)) {
            console.log(`Success with endpoint ${endpoint}, found ${data.length} users`);
            return {
              success: true,
              data: data
            };
          } else if (data && typeof data === 'object') {
            console.log(`Success with endpoint ${endpoint}, response is an object:`, data);
            if (data.data && Array.isArray(data.data)) {
              return {
                success: true,
                data: data.data
              };
            } else {
              return data;
            }
          } 
        } catch (parseErr) {
          console.error(`Error parsing JSON from ${endpoint}:`, parseErr);
        }
      } catch (endpointErr) {
        console.error(`Error with endpoint ${endpoint}:`, endpointErr);
      }
    
    console.error('All search endpoints failed');
    return { 
      success: false, 
      data: [], 
      message: 'Search failed - no working endpoint found' 
    };
  } catch (error) {
    console.error('Failed to search users:', error);
    throw error;
  }
};

/**
 */

  

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