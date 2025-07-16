'use client'

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import Logo from './Logo';
import { spaceGrotesk } from '@/app/fonts';

interface HeaderItem {
  label: string;
  href?: string;
  innerList?: HeaderItem[];
}

const headerItems: HeaderItem[] = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'About',
    href: '/about',
  },
  {
    label: 'Lern',
    innerList: [
      {
        label: 'How to connect',
        href: '/safety',
      },
      {
        label: 'How to use',
        href: '/safety',
      },
      {
        label: 'to listen together',
        href: '/safety',
      },
    ]
  },
  {
    label: 'More',
    innerList: [
      {
        label: 'Privacy',
        href: '/privacy',
      },
      {
        label: 'Terms',
        href: '/terms',
      },
      {
        label: 'Support',
        href: '/support',
      },
    ]
  },
  {
    label: 'Socials',
    innerList: [
      {
        label: 'Instagram',
        href: '/instagram',
      },
      {
        label: 'Twitter',
        href: '/twitter',
      },
      {
        label: 'Discord',
        href: '/discord',
      },
    ]
  },
  {
    label: 'Pricing ',
    innerList: [
      {
        label: 'Plans',
        href: '/pricing',
      },
      {
        label: 'Terms of service',
        href: '/pricing',
      },
    ]
  },
]

export default function Header() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("Header render - Auth state:", { 
      isAuthenticated, 
      user: user ? "exists" : "null",
      loading,
      token: typeof window !== 'undefined' ? !!Cookies.get('auth_token') : false
    });
    // Only run this effect once per mount to avoid loops
  }, []);

  return (
    <header className="bg-black border-b border-white/30 text-white p-4">
      <div className=" mx-auto flex justify-center items-center">
        {/* <Link href="/" className={`${spaceGrotesk.className}`}>
          <Logo />
        </Link> */}
        <div className={`flex items-center uppercase text-white ${spaceGrotesk.className}`}>
          {headerItems.map((item) => (
            <div key={item.label}>
              <Link href={item.href || ''}>{item.label}</Link>
            </div>
          ))}
        </div>
       
      </div>
    </header>
  );
} 