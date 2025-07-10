import Cookies from 'js-cookie';

export const API_BASE_URL = 'http://localhost:3001';

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
};

// Cache to prevent excessive API calls
const apiCache: Record<string, {data: any, timestamp: number}> = {};
const CACHE_TTL = 10000; // 10 seconds

// Default headers for all API calls
export const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = Cookies.get('auth_token');
  if (token) {
    console.log('Found auth token in cookies for API request');
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('No auth token found for API request');
  }

  return headers;
};

// Check if we have a valid cached response
export const getCachedResponse = (cacheKey: string) => {
  const cached = apiCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Using cached response for ${cacheKey}`);
    return cached.data;
  }
  return null;
};

// Store response in cache
export const cacheResponse = (cacheKey: string, data: any) => {
  apiCache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!Cookies.get('auth_token');
};

// Utility to handle API responses consistently
export async function handleApiResponse<T>(response: Response, cacheKey?: string): Promise<ApiResponse<T>> {
  if (!response.ok) {
    // Handle unauthorized errors (expired token)
    if (response.status === 401) {
      console.error('Unauthorized API request:', response.url);
      // Clear any existing tokens
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      
      // Redirect to login if we're in a browser
      if (typeof window !== 'undefined') {
        console.log('Redirecting to login page due to unauthorized request');
        window.location.href = '/login';
        
        throw {
          status: response.status,
          message: 'Authentication required. Redirecting to login...'
        };
      }
    }
    
    const errorData = await response.json().catch(() => ({
      message: 'An unexpected error occurred'
    }));
    
    console.error(`API error for ${response.url}:`, errorData);
    
    throw {
      status: response.status,
      ...errorData
    };
  }
  
  const data = await response.json();
  
  // Cache the successful response if a cache key is provided
  if (cacheKey) {
    cacheResponse(cacheKey, data);
  }
  
  return data;
} 