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
        
        throw {
          status: response.status,
          message: 'Authentication expired. Please login again.'
        };
      }
      
      throw {
        status: response.status,
        ...data
      };
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process response');
  }
} 