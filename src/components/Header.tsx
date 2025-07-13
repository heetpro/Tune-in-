import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Cookies from 'js-cookie';

export default function Header() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  // Debug logging but prevent re-renders
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
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Music Dating App
        </Link>
        
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="hover:text-gray-300">
                Home
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link href="/friends" className="hover:text-gray-300">
                    Friends
                  </Link>
                </li>
                <li>
                  <Link href="/messages" className="hover:text-gray-300">
                    Messages
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-gray-300">
                    Profile
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => logout()} 
                    className="hover:text-gray-300"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                {!loading && (
                  <Link 
                    href="/login"
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Login
                  </Link>
                )}
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
} 