"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkUserAuth } from '@/api/auth';
import Cookies from 'js-cookie';
import Loader from './Loader';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps): ReactNode => {
  const { user, loading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    // Remove the from=auth parameter from URL to prevent refresh loops
    const fromAuth = searchParams.get('from') === 'auth';
    if (fromAuth) {
      
      // Create a new URL object based on the current URL
      const url = new URL(window.location.href);
      // Delete the 'from' parameter
      url.searchParams.delete('from');
      
      // Use history.replaceState to update the URL without triggering a page reload
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    const verifyAuth = async () => {
      setChecking(true);
      
      // Skip verification if we just came from auth success
      const fromAuth = searchParams.get('from') === 'auth';
      if (fromAuth) {
        setChecking(false);
        return;
      }
      
      if (!loading && !isAuthenticated) {
        const token = Cookies.get('auth_token');
        
        if (token) {
          // Do a quick auth check first
          const authCheck = await checkUserAuth();
          
          if (!authCheck.success || !authCheck.data?.exists) {
            router.replace('/login');
          } else {
            await refreshUser();
          }
        } else {
          console.log('Protected route: No token found');
        }
      }
      
      setChecking(false);
    };

    verifyAuth();
  }, [isAuthenticated, loading, router, refreshUser, searchParams]);

  if (loading || checking) {
    return (
      <div className="flex items-center w-full bg-[#2a2a2a] justify-center h-screen">
       <Loader/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return <>{children}</>;
};

export default ProtectedRoute; 