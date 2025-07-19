"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import MusicProfile from '@/components/MusicProfile';
import { useRouter, useSearchParams } from 'next/navigation';
import { setUsername } from '@/api/user';
import { syncSpotifyData } from '@/api/spotify';
import ProtectedRoute from '@/components/ProtectedRoute';
import { spaceGrotesk } from '@/app/fonts';
import { Ellipsis, SearchCheck, Share2, Edit, RefreshCcw, UserMinus, Eye, EyeOff, X } from 'lucide-react';

export const Profile = () => {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsernameState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncingData, setSyncingData] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAge, setShowAge] = useState(true);
  const isSetup = searchParams.get('setup') === 'true';

  useEffect(() => {
    if (user?.username) {
      setUsernameState(user.username);
    }
  }, [user]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    if (username.length < 3 || username.length > 30) {
      setError('Username must be between 3 and 30 characters');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await setUsername(username);
      
      if (response.success) {
        setSuccess('Username updated successfully');
        await refreshUser();
        
        if (isSetup) {
          setTimeout(() => {
            router.push('/profile');
          }, 1500);
        }
      } else {
        setError(response.message || 'Failed to update username');
      }
    } catch (err: any) {
      console.error('Error updating username:', err);
      setError(err.message || 'An error occurred while updating username');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  const handleSyncSpotifyData = async () => {
    try {
      setSyncingData(true);
      setError(null);
      setShowDropdown(false);
      
      const response = await syncSpotifyData();
      
      if (response.success) {
        setSuccess('Spotify data synced successfully!');
        await refreshUser();
      } else {
        setError(response.message || 'Failed to sync Spotify data');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sync Spotify data');
    } finally {
      setSyncingData(false);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setSuccess('Profile link copied to clipboard!');
    setShowDropdown(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto p-4 flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!user?.username) {
    return (
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-2 z-50 ${spaceGrotesk.className}`}>
        <div className="flex w-[20vw]">
        <div className="bg-[#964FFF] rounded-2xl p-4 w-full ">
          <div className="mb-4  ">
            <h2 className="text-lg text-white font-bold">Set username{"."}</h2>
          </div>

          <div className="flex-col flex gap-3">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsernameState(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter username"
                className="w-full p-2 border-2 rounded-lg 
                text-sm placeholder:text-white  
                focus:bg-white
                focus:text-black
                transition-all duration-300
                focus:placeholder:text-black
                text-white focus:border-white outline-none"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className=" -mt-1 text-sm text-black font-semibold px-2 bg-yellow-300 p-1 w-fit rounded-lg">
                username already taken{"."} 
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                {success}
              </div>
            )}

            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="w-fit px-5 md:hidden bg-white hover:bg-transparent  border-2 border-white hover:text-white cursor-pointer text-black py-2.5  rounded-xl font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Setting Username...' : 'Set Username'}
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[90vh] overflow-y-auto mt-[10vh] w-[40%] flex border-4 rounded-t-4xl border-[#964FFF] bg-[#964FFF] flex-col ${spaceGrotesk.className}`}>
      <main className="p-4 flex-grow">
        <div className="">
          <div className="flex justify-between relative dropdown-container">
            <h1 className="text-lg text-white font-semibold mb-6">
              {isSetup ? '@me' : `@${user?.username}`}
            </h1>
            <Ellipsis 
              className='w-10 h-10 cursor-pointer hover:bg-white/10 rounded-full px-1 text-white'
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            />
            {showDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg py-2 z-50">
                <button 
                  className="w-full px-4 cursor-pointer py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    router.push('/profile/edit');
                    setShowDropdown(false);
                  }}
                >
                  <Edit className="w-4 h-4" /> Edit Profile
                </button>
                  
                <button 
                  className="w-full px-4 cursor-pointer  py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    setShowAge(!showAge);
                    setShowDropdown(false);
                  }}
                >
                  {showAge ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAge ? 'Hide Age' : 'Show Age'}
                </button>
                <button 
                  className="w-full px-4 cursor-pointer py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  onClick={handleShareProfile}
                >
                  <Share2 className="w-4 h-4" /> Share Profile
                </button>
                <button 
                  className="w-full px-4 py-2 cursor-pointer text-left hover:bg-gray-100 text-red-600 flex items-center gap-2"
                  onClick={() => {
                    // TODO: Implement deactivate profile
                    setShowDropdown(false);
                  }}
                >
                  <UserMinus className="w-4 h-4" /> Deactivate
                </button>
              </div>
            )}
          </div>
        
          
          {/* User Profile Section */}
          <div className=" rounded-lg shadow-md mb-6">
            <div className="">
              {user?.profilePicture ? (
                <div className="inline-block border-4 border-white rounded-3xl">
                  <img 
                    src={user.profilePicture} 
                    alt={user.displayName} 
                    className="w-48 h-48 p-1 rounded-3xl" 
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full  mr-4 flex items-center justify-center">
                  <span className="text-2xl text-white">{user?.displayName?.charAt(0) || '?'}</span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-white">{user?.displayName}</h2>
                {user?.spotifyId && (
                  <div className="text-sm text-gray-600">
                    <span className="flex items-center font-semibold w-fit text-white gap-1 bg-green-500 text-[10px] px-2 py-1 rounded-full mr-2">
                      <div className="">Spotify</div><SearchCheck className='w-3 h-3 text-white' />
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            
          </div>
          

          <div className=" p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Display Name:</span> 
                <span className="ml-2">{user?.displayName}</span>
              </div>
              {user?.firstName && (
                <div>
                  <span className="text-gray-600">Name:</span> 
                  <span className="ml-2">{user.firstName} {user.lastName}</span>
                </div>
              )}
              {showAge && user?.age && (
                <div>
                  <span className="text-gray-600">Age:</span> 
                  <span className="ml-2">{user.age}</span>
                </div>
              )}

              {user?.gender && (
                <div>
                  <span className="text-gray-600">Gender:</span> 
                  <span className="ml-2">{user.gender}</span>
                </div>
              )}
              {user?.bio && (
                <div>
                  <span className="text-gray-600">Bio:</span> 
                  <span className="ml-2">{user.bio}</span>
                </div>
              )}
              {user?.city && (
                <div>
                  <span className="text-gray-600">City:</span> 
                  <span className="ml-2">{user.city}</span>
                </div>
              )}
              {user?.country && (
                <div>
                  <span className="text-gray-600">Country:</span> 
                  <span className="ml-2">{user.country}</span>
                </div>
              )}
              {user?.intrestedIn && user.intrestedIn.length > 0 && (
                <div>
                  <span className="text-gray-600">Interested In:</span> 
                  <span className="ml-2">{user.intrestedIn.join(', ')}</span>
                </div>
              )}
              {user?.spotifyFollowers !== undefined && (
                <div>
                  <span className="text-gray-600">Spotify Followers:</span> 
                  <span className="ml-2">{user.spotifyFollowers}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Music Profile Section */}
          {user && user._id && (
            <MusicProfile userId={user._id} />
          )}
        </div>
      </main>
    </div>
  );
} 