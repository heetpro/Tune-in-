"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react' ;
import { getMyProfile, logout } from '@/api';
import { IUser } from '@/types/index';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const refreshInProgress = useRef(false);

  const refreshUser = async () => {
    // Prevent concurrent refresh calls
    if (refreshInProgress.current) {
      console.log('Refresh already in progress, skipping');
      return;
    }

    // Don't refresh if there's no token
    if (!Cookies.get('auth_token')) {
      console.log('No auth token found, skipping refresh');
      setLoading(false);
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    
    try {
      refreshInProgress.current = true;
      setLoading(true);
      console.log('Refreshing user profile...');
      
      const response = await getMyProfile();
      
      if (response.data) {
        console.log('User data received:', response.data);
        setUser(response.data);
        setIsAuthenticated(true);
        setError(null);
      } else {
        console.warn('No user data in response');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err.message);
      // Clear tokens if unauthorized
      if (err.status === 401) {
        Cookies.remove('auth_token');
        Cookies.remove('refresh_token');
      }
      setUser(null);
      setIsAuthenticated(false);
      setError('Failed to fetch user profile');
    } finally {
      setLoading(false);
      refreshInProgress.current = false;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Clear stored tokens (the logout API function already does this, but we'll do it here as well for safety)
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  // Check auth status whenever the component mounts or when URL changes
  useEffect(() => {
    console.log('AuthContext: Checking authentication state');
    console.log('Auth token exists:', !!Cookies.get('auth_token'));
    
    const checkAuth = async () => {
      // Check if user has auth token in cookies
      const hasToken = !!Cookies.get('auth_token');
      console.log('Auth check - token exists:', hasToken);
      
      if (hasToken) {
        await refreshUser();
      } else {
        setLoading(false);
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setInitialCheckDone(true);
    };
    
    checkAuth();
  }, []);

  // Add a URL change listener to recheck auth status
  useEffect(() => {
    // Listen for URL changes
    const handleRouteChange = () => {
      console.log('URL changed, rechecking auth status');
      
      // Only refresh if we have a token to prevent unnecessary API calls
      if (Cookies.get('auth_token') && !refreshInProgress.current) {
        refreshUser();
      }
    };

    // Set up listener for URL changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        logout: handleLogout,
        refreshUser,
        isAuthenticated
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