"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getMyProfile } from '@/api/user';
import { checkUserAuth } from '@/api/auth';
import { IUser } from '@/types/index';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Don't refresh if there's no token
      const token = Cookies.get('auth_token');
      if (!token) {
        console.log('No auth token found, skipping refresh');
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      console.log('Attempting to refresh user profile...');
      console.log('Token being used:', token?.substring(0, 15) + '...');
      
      const response = await getMyProfile();
      console.log('Profile refresh response:', response);
      console.log('User data received:', {
        hasCompletedOnboarding: response.data?.hasCompletedOnboarding,
        username: response.data?.username,
        displayName: response.data?.displayName,
        age: response.data?.age,
        gender: response.data?.gender,
        location: response.data?.location,
        intrestedIn: response.data?.intrestedIn
      });
      
      if (response.success && response.data) {
        console.log('User profile refreshed successfully');
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        console.error('Failed to get user data:', response.message || 'No error message');
        // Don't throw error here, handle it directly
        setError(response.message || 'Failed to fetch user profile');
        setIsAuthenticated(false);
        setUser(null);
        
        // Clear tokens if unauthorized
        if (response.error?.status === 401) {
          console.log('Clearing tokens due to auth error');
          Cookies.remove('auth_token');
          Cookies.remove('refresh_token');
          
          // Don't redirect if we're already on login or auth pages
          if (!pathname?.startsWith('/login') && !pathname?.startsWith('/auth/')) {
            console.log('Redirecting to login due to auth error');
            router.push('/login');
          }
        }
      }
    } catch (err: any) {
      console.error('Error in refreshUser function:', err);
      setError(err.message || 'Failed to load user data');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, refreshToken: string) => {
    console.log('Setting tokens in cookies...');
    console.log('Token:', token.substring(0, 15) + '...');
    console.log('Refresh token:', refreshToken.substring(0, 15) + '...');
    
    try {
      // Remove any existing tokens first
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      
      // Set tokens with proper options
      Cookies.set('auth_token', token, { 
        expires: 1, // 1 day
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' // Changed from strict to lax for cross-domain redirects
      });
      
      Cookies.set('refresh_token', refreshToken, { 
        expires: 30, // 30 days
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' // Changed from strict to lax for cross-domain redirects
      });
      
      // Verify cookies were set
      const savedToken = Cookies.get('auth_token');
      const savedRefresh = Cookies.get('refresh_token');
      
      console.log('Cookies set successfully:', {
        authTokenSet: !!savedToken,
        refreshTokenSet: !!savedRefresh
      });
    } catch (error) {
      console.error('Error setting cookies:', error);
    }
    
    // Don't refresh user here - let the caller handle it
  };

  const handleLogout = async () => {
    try {
      // Clear stored tokens
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  // Check auth status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check if user has auth token in cookies
      const token = Cookies.get('auth_token');
      
      if (token) {
        try {
          // First do a quick check to see if the token is valid
          console.log('Performing quick auth check...');
          const authCheck = await checkUserAuth();
          
          if (authCheck.success && authCheck.data?.exists) {
            console.log('Auth check successful, token is valid');
            // Token is valid, now get the full profile
            await refreshUser();
          } else {
            console.log('Auth check failed, token is invalid');
            // Token is invalid, clear it
            Cookies.remove('auth_token');
            Cookies.remove('refresh_token');
            setLoading(false);
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Error during auth check:', err);
          await refreshUser(); // Fall back to full refresh if quick check fails
        }
      } else {
        setLoading(false);
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        logout: handleLogout,
        refreshUser,
        isAuthenticated,
        login
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 