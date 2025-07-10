"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import MusicProfile from '@/components/MusicProfile';
import { useRouter, useSearchParams } from 'next/navigation';
import { setUsername } from '@/api/user';
import { syncSpotifyData } from '@/api/spotify';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}

function Profile() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsernameState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncingData, setSyncingData] = useState(false);
  const isSetup = searchParams.get('setup') === 'true';

  useEffect(() => {
    if (user?.username) {
      setUsernameState(user.username);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        // Refresh user data to get the updated username
        await refreshUser();
        
        // If this is initial setup, redirect to profile without query params
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

  const handleSyncSpotifyData = async () => {
    try {
      setSyncingData(true);
      setError(null);
      
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto p-4 flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto p-4 flex-grow">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{isSetup ? 'Complete Your Profile' : 'Your Profile'}</h1>
          
          {isSetup && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-blue-700">Welcome! Please set a username to complete your profile setup.</p>
            </div>
          )}
          
          {/* User Profile Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center mb-6">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.displayName} 
                  className="w-20 h-20 rounded-full mr-4" 
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-300 mr-4 flex items-center justify-center">
                  <span className="text-2xl text-gray-600">{user?.displayName?.charAt(0) || '?'}</span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">{user?.displayName}</h2>
                {user?.spotifyId && (
                  <p className="text-sm text-gray-600">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                      Spotify Connected
                    </span>
                  </p>
                )}
              </div>
            </div>
            
            {/* Username Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsernameState(e.target.value)}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-300 focus:outline-none"
                  placeholder="Enter your username"
                />
              </div>
              
              {error && (
                <div className="mb-4 p-2 bg-red-50 text-red-700 border border-red-200 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-2 bg-green-50 text-green-700 border border-green-200 rounded">
                  {success}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : isSetup ? 'Complete Setup' : 'Update Username'}
                </button>
                
                {user?.username && (
                  <button
                    type="button"
                    onClick={handleSyncSpotifyData}
                    disabled={syncingData}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {syncingData ? 'Syncing...' : 'Sync Spotify Data'}
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* Account Info Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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
              {user?.age && (
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