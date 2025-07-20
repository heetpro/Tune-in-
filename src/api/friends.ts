import { API_BASE_URL, getHeaders, handleApiResponse, ApiResponse } from './config';
import { IUser, IFriendRequest } from '@/types/index';

interface FriendRequestsResponse {
  incoming: {
    _id: string;
    senderId: {
      _id: string;
      displayName: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
    };
    receiverId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
    respondedAt?: string;
  }[];
  outgoing: {
    _id: string;
    senderId: string;
    receiverId: {
      _id: string;
      displayName: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
    };
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
    respondedAt?: string;
  }[];
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
    console.log('Fetching friend requests from API...');
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });

    console.log("friend requests ::::", response);
    
    // Additional debugging
    console.log('Friend requests API raw response status:', response.status);
    console.log('Friend requests API raw response headers:', response.headers);
    
    // Clone the response to log the raw data
    const clonedResponse = response.clone();
    try {
      const rawData = await clonedResponse.text();
      console.log('Friend requests API raw response text:', rawData);
      
      // Try parsing if it looks like JSON
      if (rawData && rawData.trim().startsWith('{') || rawData.trim().startsWith('[')) {
        try {
          const parsedData = JSON.parse(rawData);
          console.log('Friend requests API raw parsed data:', parsedData);
        } catch (parseErr) {
          console.error('Failed to parse raw response as JSON:', parseErr);
        }
      }
    } catch (textErr) {
      console.error('Failed to read raw response text:', textErr);
    }
    
    const result = await handleApiResponse<FriendRequestsResponse>(response);
    console.log('Friend requests API processed response:', result);
    return result;
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
 * Send friend request to user (with auto-retry different endpoints)
 */
export const sendFriendRequest = async (userId: string): Promise<ApiResponse<null>> => {
  // Define possible endpoints to try
  const endpointsToTry = [
    { url: `${API_BASE_URL}/friends/requests`, body: { targetUserId: userId } },
    { url: `${API_BASE_URL}/friends/request`, body: { userId } },
    { url: `${API_BASE_URL}/friends/request`, body: { receiverId: userId } },
    { url: `${API_BASE_URL}/request`, body: { userId } },
    { url: `${API_BASE_URL}/request`, body: { receiverId: userId } },
    { url: `${API_BASE_URL}/users/friends/request`, body: { userId } },
    { url: `${API_BASE_URL}/friends/requests/${userId}`, body: {} }
  ];
  
  console.log("Friend request payload:", { userId });
  
  let lastError = null;
  
  // Try each endpoint in sequence
  for (const endpoint of endpointsToTry) {
    try {
      console.log(`Trying endpoint: ${endpoint.url} with body:`, endpoint.body);
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(endpoint.body),
        credentials: 'include'
      });
      console.log(`Response from ${endpoint.url}:`, response);
      
      // If response is OK, we found the right endpoint
      if (response.ok) {
        console.log("Found working endpoint:", endpoint.url);
        try {
          const result = await handleApiResponse<null>(response);
          return result;
        } catch (parseError) {
          // Even if parsing fails, if response was OK we return success
          return { success: true, data: null, message: "Friend request sent" };
        }
      }
      
      // If not OK but specific status code like 401 (unauthorized)
      // don't try other endpoints as they'll likely fail the same way
      if (response.status === 401) {
        const result = await handleApiResponse<null>(response);
        return result;
      }
      
      // Store the error to return if all endpoints fail
      try {
        const responseClone = response.clone();
        const responseBody = await responseClone.text();
        lastError = { 
          success: false, 
          endpoint: endpoint.url,
          status: response.status,
          message: response.statusText,
          body: responseBody
        };
      } catch (err) {
        lastError = { 
          success: false,
          endpoint: endpoint.url,
          status: response.status,
          message: response.statusText 
        };
      }
    } catch (error) {
      console.error(`Error with endpoint ${endpoint.url}:`, error);
      lastError = { success: false, endpoint: endpoint.url, error };
    }
  }
  
  // If we get here, all endpoints failed
  console.error("All friend request endpoints failed. Last error:", lastError);
  return { 
    success: false, 
    message: `All endpoints failed. Last attempt: ${lastError?.endpoint} (${lastError?.status}: ${lastError?.message})`,
    error: lastError
  };
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