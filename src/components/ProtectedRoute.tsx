"use client";

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkUserAuth } from '@/api/auth';
import Cookies from 'js-cookie';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps): ReactNode => {
  const { user, loading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      setChecking(true);
      
      if (!loading && !isAuthenticated) {
        const token = Cookies.get('auth_token');
        
        if (token) {
          // Do a quick auth check first
          const authCheck = await checkUserAuth();
          
          if (!authCheck.success || !authCheck.data?.exists) {
            console.log('Protected route: Token is invalid');
            router.replace('/login');
          } else {
            console.log('Protected route: Quick auth check passed');
            await refreshUser();
          }
        } else {
          console.log('Protected route: No token found');
          router.replace('/login');
        }
      }
      
      setChecking(false);
    };

    verifyAuth();
  }, [isAuthenticated, loading, router, refreshUser]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return <>{children}</>;
};

export default ProtectedRoute; 