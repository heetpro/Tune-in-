"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import MusicProfile from '@/components/MusicProfile';
import { useRouter, useSearchParams } from 'next/navigation';
import { setUsername, editProfile } from '@/api/user';
import ProtectedRoute from '@/components/ProtectedRoute';
import { spaceGrotesk } from '@/app/fonts';
import { Ellipsis, SearchCheck, Share2, Edit, RefreshCcw, UserMinus, Eye, EyeOff, MapPin, Calendar, ChevronRight, User2, AtSign, Mars, Venus } from 'lucide-react';
import type { OnboardingFormData, SpotifyArtist, SpotifyGenre, SpotifyTrack } from '@/types';
import { useGeocoding } from '@/lib/geocoding';
import EditProfile from '@/components/EditProfile';
import { getMusicProfile } from '@/api';

export const Profile = () => {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncingData, setSyncingData] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAge, setShowAge] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const { reverseGeocode, loading: isLoadingLocation } = useGeocoding();
  const [showEditProfile, setShowEditProfile] = useState(false);


  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [topGenres, setTopGenres] = useState<SpotifyGenre[]>([]);
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [activeTab, setActiveTab] = useState<'artists' | 'tracks' | 'genres'>('artists');
  const [dataAvailable, setDataAvailable] = useState(true);

  const fetchMusicData = async () => {
    setError(null);

    try {
      console.log(`Fetching music profile data, will display ${timeRange} data`);

      // Only use the music profile endpoint
      const musicProfileResponse = await getMusicProfile();
      console.log('Music profile response:', musicProfileResponse);

      if (musicProfileResponse.success && musicProfileResponse.data?.musicProfile) {
        const { musicProfile } = musicProfileResponse.data;
        console.log('Music profile data:', musicProfile);

        let artistsData: SpotifyArtist[] = [];
        let tracksData: SpotifyTrack[] = [];
        let genresData: SpotifyGenre[] = [];

        // Handle nested structure for top artists
        if (musicProfile.topArtists && musicProfile.topArtists[timeRange]) {
          console.log(`Found ${timeRange} artists:`, musicProfile.topArtists[timeRange]);
          artistsData = musicProfile.topArtists[timeRange] || [];
        } else {
          console.log('No artists data for the selected time range');
        }

        // Handle nested structure for top tracks
        if (musicProfile.topTracks && musicProfile.topTracks[timeRange]) {
          console.log(`Found ${timeRange} tracks:`, musicProfile.topTracks[timeRange]);
          tracksData = musicProfile.topTracks[timeRange] || [];
        } else {
          console.log('No tracks data for the selected time range');
        }

        // Handle top genres (may not be time-range specific)
        if (musicProfile.topGenres) {
          if (Array.isArray(musicProfile.topGenres)) {
            // If topGenres is a simple array
            console.log('Found genres:', musicProfile.topGenres);
            genresData = musicProfile.topGenres;
          } else if (musicProfile.topGenres[timeRange]) {
            // If topGenres is also nested by time range
            console.log(`Found ${timeRange} genres:`, musicProfile.topGenres[timeRange]);
            genresData = musicProfile.topGenres[timeRange];
          } else {
            console.log('No genres data for the selected time range');
          }
        }

        // Update all state at once
        setTopArtists(artistsData);
        setTopTracks(tracksData);
        setTopGenres(genresData);

        // Check if any data is available
        const hasData = artistsData.length > 0 || tracksData.length > 0 || genresData.length > 0;
        setDataAvailable(hasData);

      } else {
        console.error('Failed to get music profile data');
        setTopArtists([]);
        setTopTracks([]);
        setTopGenres([]);
        setDataAvailable(false);
      }
    } catch (error: any) {
      console.error('Failed to fetch music data:', error);
      setError(error.message || 'Failed to load music profile');
      setTopArtists([]);
      setTopTracks([]);
      setTopGenres([]);
      setDataAvailable(false);
    } finally {

    }
  };



  const [formData, setFormData] = useState<OnboardingFormData>({
    username: '',
    displayName: '',
    dateOfBirth: '',
    gender: 'male',
    intrestedIn: [],
    location: {
      city: '',
      coordinates: undefined
    }
  });

  const steps = [
    { title: 'Display Name', field: 'displayName', icon: User2 },
    { title: 'Date of Birth', field: 'dateOfBirth', icon: Calendar },
    { title: 'Gender', field: 'gender', icon: User2 },
    { title: 'Interested In', field: 'intrestedIn', icon: User2 },
    { title: 'Location', field: 'location', icon: MapPin },
    { title: 'Username', field: 'username', icon: AtSign }
  ];

  const needsUserInfo = () => {
    if (!user) return false;

    // If onboarding is explicitly marked as completed, don't show the form
    if (user.hasCompletedOnboarding === true) {
      return false;
    }

    // Check if any required field is missing
    const missingInfo = !user.displayName ||
      !user.age ||
      !user.gender ||
      !user.location?.city ||
      !user.intrestedIn?.length ||
      !user.username;

    console.log("User onboarding status:", {
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      displayName: !!user.displayName,
      age: !!user.age,
      gender: !!user.gender,
      location: !!user.location?.city,
      interestedIn: !!user.intrestedIn?.length,
      username: !!user.username,
      missingInfo
    });

    return missingInfo;
  };

  // Pre-fill form data with existing user info
  useEffect(() => {
    if (user && needsUserInfo()) {
      setFormData(prev => ({
        ...prev,
        username: user.username || prev.username,
        displayName: user.displayName || prev.displayName,
        gender: user.gender || prev.gender,
        intrestedIn: user.intrestedIn || prev.intrestedIn,
        location: {
          city: user.location?.city || prev.location.city,
          coordinates: user.location?.coordinates ? {
            lat: user.location.coordinates.lat,
            lng: user.location.coordinates.lng
          } : undefined
        }
      }));
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
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Use our geocoding service
      const locationData = await reverseGeocode(latitude, longitude);

      if (locationData) {
        setFormData(prev => ({
          ...prev,
          location: {
            city: locationData.city,
            coordinates: {
              lat: locationData.latitude,
              lng: locationData.longitude
            }
          }
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to detect location. Please enter manually.');
    }
  };

  const handleNextStep = async () => {
    const currentField = steps[currentStep].field;

    // Validation for each step
    switch (currentField) {
      case 'displayName':
        if (!formData.displayName.trim()) {
          setError('Display name cannot be empty');
          return;
        }
        break;

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

      case 'username':
        if (!formData.username.trim()) {
          setError('Username cannot be empty');
          return;
        }
        if (formData.username.length < 3 || formData.username.length > 30) {
          setError('Username must be between 3 and 30 characters');
          return;
        }
        break;
    }

    setError(null);

    if (currentStep === steps.length - 1) {
      // Submit all user info data
      try {
        setIsSubmitting(true);

        // Calculate age from date of birth
        const age = calculateAge(formData.dateOfBirth);

        // Prepare profile data - only include fields that have values
        const profileData: any = {
          hasCompletedOnboarding: true
        };

        // Only add fields that have actual values
        if (formData.username) profileData.username = formData.username;
        if (formData.displayName) profileData.displayName = formData.displayName;
        if (age) profileData.age = age;
        if (formData.gender) profileData.gender = formData.gender;
        if (formData.intrestedIn && formData.intrestedIn.length > 0) {
          profileData.intrestedIn = formData.intrestedIn;
        }

        // Only add location if city is provided
        if (formData.location.city) {
          profileData.location = {
            city: formData.location.city,
            country: 'Unknown', // Add a default country value
            coordinates: formData.location.coordinates || {
              lat: 0,
              lng: 0
            }
          };
        }

        console.log("Submitting profile data:", profileData);

        // Save all profile data at once
        const response = await editProfile(profileData);

        if (response.success) {
          setSuccess('Profile updated successfully');

          // Force a complete refresh of user data
          await refreshUser();

          // Add a small delay to ensure the refreshed data is processed
          setTimeout(() => {
            // Check if we still need user info after refresh
            if (!needsUserInfo()) {
              router.push('/profile');
            } else {
              console.log("Still missing user info after refresh, not redirecting");
            }
          }, 1000);
        } else {
          setError(response.message || 'Failed to update profile');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to save profile data');
        console.error("Error saving profile:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
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

  // Show user info form if required fields are missing
  if (needsUserInfo()) {
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
                    className={`h-1 flex-1 rounded-full ${index <= currentStep ? 'bg-white' : 'bg-white/30'
                      }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex-col flex gap-4">
              {currentStep === 0 && (
                <div className="flex items-center gap-2">
                  <User2 className="text-white" />
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Enter display name"
                    className="w-full p-3 border-2 rounded-lg text-sm placeholder:text-white focus:bg-white focus:text-black transition-all duration-300 focus:placeholder:text-black text-white focus:border-white outline-none"
                  />
                </div>
              )}

              {currentStep === 1 && (
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

              {currentStep === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  {['male', 'female', 'non-binary', 'other'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData(prev => ({ ...prev, gender: option as any }))}
                      className={`p-3 border-2 rounded-lg text-sm capitalize ${formData.gender === option
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
                      className={`p-3 border-2 rounded-lg text-sm capitalize ${formData.intrestedIn.includes(option)
                        ? 'bg-white text-[#964FFF] border-white'
                        : 'text-white border-white/50 hover:border-white'
                        }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentStep === 4 && (
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

              {currentStep === 5 && (
                <div className="flex items-center gap-2">
                  <AtSign className="text-white" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && handleNextStep()}
                    placeholder="Enter username"
                    className="w-full p-3 border-2 rounded-lg text-sm placeholder:text-white focus:bg-white focus:text-black transition-all duration-300 focus:placeholder:text-black text-white focus:border-white outline-none"
                  />
                </div>
              )}

              {error && (
                <div className="-mt-1 text-sm text-black font-semibold px-2 bg-yellow-300 p-1 w-fit rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="-mt-1 text-sm text-black font-semibold px-2 bg-green-300 p-1 w-fit rounded-lg">
                  {success}
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
        <div className="w-full h-full relative">
          <div className="flex absolute justify-end right-0 dropdown-container">

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
                    setShowEditProfile(true);
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
          <div className="rounded-lg  mb-6">
            <div className="">
              {user?.profilePicture ? (
                <div className="inline-block border-4 border-white rounded-3xl">
                  <img
                    src={user.profilePicture}
                    alt={user.displayName}
                    className="w-32 h-32 p-1 object-cover rounded-3xl select-none"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full mr-4 flex items-center justify-center">
                  <span className="text-3xl text-white">{user?.displayName?.charAt(0) || '?'}</span>
                </div>
              )}
              <div className='flex flex-col gap-2'>
                <div className="flex flex-col"><h2 className="text-2xl font-semibold text-white">{user?.displayName}
                  <span className="text-sm ml-1  font-semibold text-white/80">
                    {user?.gender == "female" ? "(she/her)" : user?.gender == "male" ? "(he/him)" : "(they/them)"}
                  </span>
                </h2>
                  <h2 className="text-md -mt-1 font-semibold text-white/80">@{user?.username}</h2>
                </div>

                <div className="flex text-md font-semibold max-w-md text-white">{user?.bio}</div>

                <div className="flex text-white gap-2">
                  <div className="flex items-center gap-0.5">
                    <MapPin className="w-4 h-4 text-white" />
                    <div className="text-md font-semibold text-white/80">{user?.location?.city}</div>
                  </div>
                  <div className=""> {"|"}</div>
                  <div className="flex items-center gap-0.5">
                    {user?.gender == "female" ? <Venus className="w-4 h-4 text-white" /> : <Mars className="w-4 h-4 text-white" />}

                    <div className="text-md font-semibold text-white/80">{user?.age}</div>
                  </div>



                </div>
              </div>
            </div>
          </div>



          {/* Music Profile Section */}
          {user && user._id && (
            <MusicProfile userId={user._id} />
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfile
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </div>
  );
}; 