"use client";

import { useAuth } from '@/context/AuthContext';
import { loginWithSpotify } from '@/api';
import Header from '@/components/Header';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Home() {
  // const { user, loading, isAuthenticated } = useAuth();
  
  // Add debug logging to track re-renders
  // useEffect(() => {
  //   console.log('Home page rendered with auth state:', { 
  //     isAuthenticated, 
  //     hasUser: !!user, 
  //     loading 
  //   });
  // }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex flex-col items-center justify-center h-screen">
        {/* <h1 className={`${poppins.className} text-4xl text-black font-bold`}>Hello World</h1> */}
      </div>
    </div>
  );
}
