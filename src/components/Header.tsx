'use client'

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Logo from './Logo';
import { spaceGrotesk } from '@/app/fonts';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface HeaderItem {
  label: string;
  href?: string;
  innerList?: HeaderItem[];
  clipPath?: string;
}

const headerItems: HeaderItem[] = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'About',
    href: '/about',
    clipPath: 'polygon(24% 0, 0% 100%, 100% 56%)',
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
    ],
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
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
    ],
    clipPath: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0 60%)',
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
    ],
    clipPath: 'circle(50% at 50% 50%)',
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
    ],
    clipPath: 'polygon(18% 34%, 80% 10%, 100% 35%, 100% 70%, 32% 100%, 81% 63%, 20% 90%, 0% 70%, 0% 35%, 61% 0)',
  },
]

export default function Header() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);



  return (
    <header className="absolute top-0 left-0 right-0 w-full text-white">
      <div className="w-[80%] mx-auto  flex justify-between items-center">
      <Link href="/" className={`${spaceGrotesk.className}`}>
          <Logo />
        </Link>
        <div className={`flex items-center scale-y-95 uppercase  text-sm helve`}
          style={{
            fontSize: 'clamp(0.75rem, 0.8vw, 160rem)',
            // gap: 'clamp(0.75rem, 1.26vw, 160rem)',
          }}
        >
          {headerItems.map((item) => (
            <div key={item.label} className="flex text-white hover:text-black bg-transparent hover:bg-white aspect-square items-center gap-1 p-10 cursor-pointer" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}
            style={{
              clipPath: item.clipPath,
            }}
            >
              <Link href={item.href || ''}>{item.label}</Link>

              {item.innerList && (
                <div  >
                  {isOpen ? (
                    <ChevronDown
                      style={{
                      width: 'clamp(0.75rem, 1vw, 160rem)',
                      height: 'clamp(0.75rem, 1vw, 160rem)',
                    }}
                    />
                  ) : (
                    <ChevronUp
                      style={{
                        width: 'clamp(0.75rem, 1vw, 160rem)',
                        height: 'clamp(0.75rem, 1vw, 160rem)',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <Link href="/" className={`flex text-white hover:text-black bg-transparent hover:bg-white helve uppercase aspect-square items-center gap-1 p-10 cursor-pointer`}>
          login
        </Link>

      </div>
    </header>
  );
} 