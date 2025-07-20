"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { spaceGrotesk } from '@/app/fonts';
import { User2, Calendar, MapPin, AtSign, ChevronRight } from 'lucide-react';
import { OnboardingFormData } from '@/types';
import { useGeocoding } from '@/lib/geocoding';
import { editProfile } from '@/api/user';

const SetupPage = () => {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { reverseGeocode, loading: isLoadingLocation } = useGeocoding();

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

  // Check if user has completed onboarding
  const needsUserInfo = () => {
    if (!user) return true;

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

    return missingInfo;
  };

  // Redirect to messages if onboarding is already completed
  useEffect(() => {
    if (!loading && user && !needsUserInfo()) {
      router.push('/messages');
    }
  }, [user, loading]);

  // Pre-fill form data with existing user info
  useEffect(() => {
    if (user) {
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

      // Use geocoding service
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

        // Save all profile data at once
        const response = await editProfile(profileData);

        if (response.success) {
          setSuccess('Profile updated successfully');

          // Force a complete refresh of user data
          await refreshUser();

          // Add a small delay to ensure the refreshed data is processed
          setTimeout(() => {
            // Redirect to messages page
            router.push('/messages');
          }, 1000);
        } else {
          setError(response.message || 'Failed to update profile');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to save profile data');
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

  // Only show the setup form if the user needs to complete it
  if (user && needsUserInfo()) {
    return (
      <div className={`flex min-h-screen items-center justify-center p-2 z-50 ${spaceGrotesk.className}`}>
        <div className="flex w-[90vw] md:w-[400px]">
          <div className="bg-[#8D50F9] rounded-2xl p-6 w-full">
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
                        ? 'bg-white text-[#8D50F9] border-white'
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
                        ? 'bg-white text-[#8D50F9] border-white'
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
                    className="w-full p-3 border-2 border-white rounded-lg text-sm text-white hover:bg-white hover:text-[#8D50F9] transition-colors"
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
                className="w-full mt-2 px-5 bg-white hover:bg-transparent border-2 border-white hover:text-white cursor-pointer text-[#8D50F9] py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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

  return null;
};

export default SetupPage; 