"use client";

import { useAuth } from '@/context/AuthContext';
import { loginWithSpotify } from '@/api';
import Header from '@/components/Header';
import Link from 'next/link';
import { useEffect } from 'react';
import Intro from '@/components/Home/Intro';
import Info from '@/components/Home/Info';

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
      <div className="min-h-screen flex flex-col">
        <Intro />
        <Info />
    </div>
  );
}
