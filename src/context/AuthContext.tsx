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

  // Function to check if user needs to complete onboarding
  const needsOnboarding = (userData: IUser | null) => {
    if (!userData) return false;
    
    // Check if onboarding is explicitly marked as completed
    if (userData.hasCompletedOnboarding === true) {
      return false;
    }
    
    // Check if any required field is missing
    return !userData.displayName ||
      !userData.age ||
      !userData.gender ||
      !userData.location?.city ||
      !userData.intrestedIn?.length ||
      !userData.username;
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Don't refresh if there's no token
      const token = Cookies.get('auth_token');
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      
      const response = await getMyProfile();
      
      
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        
        // Check if user needs onboarding and redirect if necessary
        // Only do this if user is authenticated and not already on setup page
        if (needsOnboarding(response.data) && 
            pathname !== '/setup' && 
            pathname !== '/login' && 
            !pathname?.startsWith('/auth/')) {
          router.push('/setup');
        }
      } else {
        // Don't throw error here, handle it directly
        setError(response.message || 'Failed to fetch user profile');
        setIsAuthenticated(false);
        setUser(null);
        
        // Clear tokens if unauthorized
        if (response.error?.status === 401) {
          Cookies.remove('auth_token');
          Cookies.remove('refresh_token');
          
          // Don't redirect if we're already on login or auth pages
          if (!pathname?.startsWith('/login') && !pathname?.startsWith('/auth/')) {
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
      
      
      // Set authenticated state immediately to avoid verification loops
      if (savedToken) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error setting cookies:', error);
    }
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
          const authCheck = await checkUserAuth();
          
          if (authCheck.success && authCheck.data?.exists) {
            await refreshUser();
          } else {
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

  // Handle redirects based on auth status and onboarding needs
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // If user needs onboarding and isn't on the setup page, redirect to setup
      if (needsOnboarding(user) && 
          pathname !== '/setup' && 
          pathname !== '/login' && 
          !pathname?.startsWith('/auth/')) {
        router.push('/setup');
      }
    }
  }, [loading, isAuthenticated, user, pathname]);

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