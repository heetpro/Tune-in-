import Cookies from 'js-cookie';

// Make sure this URL matches your actual backend API URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
};

// Default headers for all API calls
export const getHeaders = () => {
  const headers: HeadersInit = {
    'Authorization': `Bearer ${Cookies.get('auth_token')}`,
    'Content-Type': 'application/json',
  };

  const token = Cookies.get('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Utility to handle API responses consistently
export async function handleApiResponse<T>(response: Response, cacheKey?: string): Promise<ApiResponse<T>> {
  try {
    // Handle empty responses gracefully
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      
      // If the response is empty but successful, return a simplified response
      if (!text && response.ok) {
        return {
          success: true,
          data: null as any,
          message: 'Operation completed successfully'
        };
      }
      
      // Return error for non-JSON responses that aren't successful
      if (!response.ok) {
        return {
          success: false,
          message: text || response.statusText,
          error: { status: response.status, text }
        };
      }
      
      // For successful non-JSON responses, try to handle them appropriately
      return {
        success: true,
        data: text as any,
        message: 'Operation completed successfully'
      };
    }
    
    // Standard JSON handling
    try {
      const data = await response.json();
      
      if (!response.ok) {
        // Handle unauthorized errors
        if (response.status === 401) {
          console.error('Unauthorized API request:', response.url);
          // Clear any existing tokens
          Cookies.remove('auth_token');
          Cookies.remove('refresh_token');
          
          // Redirect to login if we're in a browser
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return {
            success: false,
            message: 'Authentication expired. Please login again.',
            error: { status: response.status, ...data }
          };
        }
        
        return {
          success: false,
          message: data.message || response.statusText,
          error: { status: response.status, ...data }
        };
      }
      
      // If the API directly returns an array when we expect it
      if (Array.isArray(data)) {
        return {
          success: true,
          data: data as any,
        };
      }
      
      // Handle standard API responses
      if (data.success !== undefined) {
        return data;
      }
      
      // Otherwise wrap the response in our standard format
      return {
        success: true,
        data: data as T,
      };
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      throw jsonError;
    }
  } catch (error) {
    console.error('Error processing API response:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process response');
  }
} 

interface ApiRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
}

export const apiRequest = async ({ url, method = 'GET', data = null, headers = {} }: ApiRequestOptions) => {
  try {
    const token = Cookies.get('auth_token');
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...headers
    };
    
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include',
      mode: 'cors'
    };
    
    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
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
    
    const responseData = await response.json();
    
    if (responseData.hasOwnProperty('success')) {
      return responseData;
    }
    
    return {
      success: true,
      data: responseData
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error
    };
  }
}; 