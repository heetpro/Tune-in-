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
import { Ellipsis, SearchCheck, Share2, Edit, RefreshCcw, UserMinus, Eye, EyeOff, MapPin, Calendar, ChevronRight, User2 } from 'lucide-react';
import type { OnboardingFormData } from '@/types';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    username: '',
    dateOfBirth: '',
    gender: 'male',
    intrestedIn: [],
    location: {
      city: '',
      coordinates: undefined
    }
  });

  const steps = [
    { title: 'Date of Birth', field: 'dateOfBirth', icon: Calendar },
    { title: 'Gender', field: 'gender', icon: User2 },
    { title: 'Interested In', field: 'intrestedIn', icon: User2 },
    { title: 'Location', field: 'location', icon: MapPin }
  ];

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

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const detectLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      
      // Use reverse geocoding to get city name
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
      );
      const data = await response.json();
      const city = data.results[0]?.components?.city || 'Unknown City';

      setFormData(prev => ({
        ...prev,
        location: {
          city,
          coordinates: { latitude, longitude }
        }
      }));
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to detect location. Please enter manually.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleNextStep = async () => {
    const currentField = steps[currentStep].field;
    
    // Validation for each step
    switch (currentField) {
      case 'dateOfBirth':
        const age = calculateAge(formData.dateOfBirth);
        if (age < 18) {
          setError('You must be at least 18 years old');
          return;
        }
        break;
        
      case 'intrestedIn':
        if (formData.intrestedIn.length === 0) {
          setError('Please select at least one option');
          return;
        }
        break;
        
      case 'location':
        if (!formData.location.city) {
          setError('Please enter your city or use location detection');
          return;
        }
        break;
    }

    setError(null);
    
    if (currentStep === steps.length - 1) {
      // Submit user info data
      try {
        setIsSubmitting(true);
        // TODO: Add API call to save user info
        await refreshUser();
        setShowUsernameSetup(true);
      } catch (err: any) {
        setError(err.message || 'Failed to save profile data');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleUsernameSubmit = async () => {
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
        router.push('/profile');
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

  const needsUserInfo = () => {
    if (!user) return false;
    
    // Check if any required field is missing
    return !user.hasCompletedOnboarding || 
           !user.age || 
           !user.gender ||
           !user.location?.city ||
           !user.intrestedIn?.length;
  };

  const needsUsername = () => {
    return user && !user.username && !needsUserInfo();
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

  // Show username setup after completing user info
  if (needsUsername() || showUsernameSetup) {
    return (
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-2 z-50 ${spaceGrotesk.className}`}>
        <div className="flex w-[20vw]">
          <div className="bg-[#964FFF] rounded-2xl p-4 w-full">
            <div className="mb-4">
              <h2 className="text-lg text-white font-bold">Set username{"."}</h2>
            </div>

            <div className="flex-col flex gap-3">
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsernameState(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && handleUsernameSubmit()}
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
                <div className="-mt-1 text-sm text-black font-semibold px-2 bg-yellow-300 p-1 w-fit rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleUsernameSubmit}
                disabled={isSubmitting}
                className="w-fit px-5 md:hidden bg-white hover:bg-transparent border-2 border-white hover:text-white cursor-pointer text-black py-2.5 rounded-xl font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Setting Username...' : 'Set Username'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show user info form if required fields are missing
  if (needsUserInfo()) {
    // Pre-fill form data with existing user info
    useEffect(() => {
      if (user) {
        const coordinates = user.location?.coordinates ? {
          latitude: Number(user.location.coordinates.latitude),
          longitude: Number(user.location.coordinates.longitude)
        } : undefined;

        setFormData(prev => ({
          ...prev,
          gender: user.gender || prev.gender,
          intrestedIn: user.intrestedIn || prev.intrestedIn,
          location: {
            city: user.location?.city || prev.location.city,
            coordinates
          }
        }));
      }
    }, [user]);

    return (
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-2 z-50 ${spaceGrotesk.className}`}>
        <div className="flex w-[90vw] md:w-[400px]">
          <div className="bg-[#964FFF] rounded-2xl p-6 w-full">
            <div className="mb-6">
              <h2 className="text-xl text-white font-bold mb-2">{steps[currentStep].title}</h2>
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index <= currentStep ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex-col flex gap-4">
              {currentStep === 0 && (
                <div className="flex items-center gap-2">
                  <Calendar className="text-white" />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border-2 rounded-lg text-sm text-white bg-transparent focus:bg-white focus:text-black transition-all duration-300 focus:border-white outline-none"
                  />
                </div>
              )}

              {currentStep === 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {['male', 'female', 'non-binary', 'other'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData(prev => ({ ...prev, gender: option as any }))}
                      className={`p-3 border-2 rounded-lg text-sm capitalize ${
                        formData.gender === option
                          ? 'bg-white text-[#964FFF] border-white'
                          : 'text-white border-white/50 hover:border-white'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  {['male', 'female', 'everyone'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        const newInterested = formData.intrestedIn.includes(option)
                          ? formData.intrestedIn.filter(i => i !== option)
                          : [...formData.intrestedIn, option];
                        setFormData(prev => ({ ...prev, intrestedIn: newInterested }));
                      }}
                      className={`p-3 border-2 rounded-lg text-sm capitalize ${
                        formData.intrestedIn.includes(option)
                          ? 'bg-white text-[#964FFF] border-white'
                          : 'text-white border-white/50 hover:border-white'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-white" />
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, city: e.target.value }
                      }))}
                      placeholder="Enter your city"
                      className="w-full p-3 border-2 rounded-lg text-sm placeholder:text-white focus:bg-white focus:text-black transition-all duration-300 focus:placeholder:text-black text-white focus:border-white outline-none"
                    />
                  </div>
                  <button
                    onClick={detectLocation}
                    disabled={isLoadingLocation}
                    className="w-full p-3 border-2 border-white rounded-lg text-sm text-white hover:bg-white hover:text-[#964FFF] transition-colors"
                  >
                    {isLoadingLocation ? 'Detecting...' : 'Detect My Location'}
                  </button>
                </div>
              )}

              {error && (
                <div className="-mt-1 text-sm text-black font-semibold px-2 bg-yellow-300 p-1 w-fit rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleNextStep}
                disabled={isSubmitting}
                className="w-full mt-2 px-5 bg-white hover:bg-transparent border-2 border-white hover:text-white cursor-pointer text-[#964FFF] py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
                {!isSubmitting && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rest of the profile component remains the same...
  return (
    <div className={`h-[90vh] overflow-y-auto mt-[10vh] w-[40%] flex border-4 rounded-t-4xl border-[#964FFF] bg-[#964FFF] flex-col ${spaceGrotesk.className}`}>
      <main className="p-4 flex-grow">
        <div className="">
          <div className="flex justify-between relative dropdown-container">
            <h1 className="text-lg text-white font-semibold mb-6">
              @{user?.username}
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
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setSuccess('Profile link copied to clipboard!');
                    setShowDropdown(false);
                    setTimeout(() => setSuccess(null), 3000);
                  }}
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
          <div className="rounded-lg shadow-md mb-6">
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
                <div className="w-20 h-20 rounded-full mr-4 flex items-center justify-center">
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
          
          {/* Account Info Section */}
          <div className="p-6 rounded-lg shadow-md mb-6">
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
              {user?.location?.city && (
                <div>
                  <span className="text-gray-600">City:</span> 
                  <span className="ml-2">{user.location.city}</span>
                </div>
              )}
              {user?.intrestedIn && user.intrestedIn.length > 0 && (
                <div>
                  <span className="text-gray-600">Interested In:</span> 
                  <span className="ml-2">{user.intrestedIn.join(', ')}</span>
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
}; 