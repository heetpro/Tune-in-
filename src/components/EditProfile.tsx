"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { editProfile } from '@/api/user';
import { X, MapPin, AtSign, User2 } from 'lucide-react';
import { spaceGrotesk } from '@/app/fonts';
import { ImageUpload } from './ImageUpload';

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfile = ({ isOpen, onClose }: EditProfileProps) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    profilePicture: '',
    location: {
      city: ''
    }
  });

  // Pre-fill form data with existing user info
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        displayName: user.displayName || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
        location: {
          city: user.location?.city || ''
        }
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'city') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          city: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      profilePicture: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Prepare profile data - only include fields that have changed
      const profileData: any = {};
      
      if (user?.username !== formData.username && formData.username) {
        profileData.username = formData.username;
      }
      
      if (user?.displayName !== formData.displayName && formData.displayName) {
        profileData.displayName = formData.displayName;
      }
      
      if (user?.bio !== formData.bio) {
        profileData.bio = formData.bio;
      }
      
      if (user?.profilePicture !== formData.profilePicture && formData.profilePicture) {
        profileData.profilePicture = formData.profilePicture;
      }
      
      if (user?.location?.city !== formData.location.city && formData.location.city) {
        profileData.location = {
          city: formData.location.city,
          country: user?.location?.country || 'Unknown',
          coordinates: user?.location?.coordinates || { lat: 0, lng: 0 }
        };
      }
      
      // Only make API call if there are changes
      if (Object.keys(profileData).length > 0) {
        console.log('Submitting profile updates:', profileData);
        
        const response = await editProfile(profileData);
        
        if (response.success) {
          setSuccess('Profile updated successfully');
          await refreshUser();
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setError(response.message || 'Failed to update profile');
        }
      } else {
        setSuccess('No changes to update');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-[90%] max-w-md bg-[#964FFF] rounded-2xl p-6 ${spaceGrotesk.className}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-white font-bold">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/10 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture Upload */}
          <ImageUpload 
            initialImage={formData.profilePicture}
            onImageChange={handleImageChange}
            className="mb-6"
          />

          {/* Display Name */}
          <div>
            <label className="block text-white text-sm mb-1">Display Name</label>
            <div className="flex items-center gap-2">
              <User2 className="text-white w-5 h-5" />
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full p-3 border-2 rounded-lg text-sm placeholder:text-white/50 
                  bg-transparent text-white focus:bg-white focus:text-black
                  transition-all duration-300 focus:placeholder:text-black
                  focus:border-white outline-none"
                placeholder="Display name"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-white text-sm mb-1">Username</label>
            <div className="flex items-center gap-2">
              <AtSign className="text-white w-5 h-5" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-3 border-2 rounded-lg text-sm placeholder:text-white/50 
                  bg-transparent text-white focus:bg-white focus:text-black
                  transition-all duration-300 focus:placeholder:text-black
                  focus:border-white outline-none"
                placeholder="Username"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-white text-sm mb-1">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full p-3 border-2 rounded-lg text-sm placeholder:text-white/50 
                bg-transparent text-white focus:bg-white focus:text-black
                transition-all duration-300 focus:placeholder:text-black
                focus:border-white outline-none resize-none"
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-white text-sm mb-1">Location</label>
            <div className="flex items-center gap-2">
              <MapPin className="text-white w-5 h-5" />
              <input
                type="text"
                name="city"
                value={formData.location.city}
                onChange={handleChange}
                className="w-full p-3 border-2 rounded-lg text-sm placeholder:text-white/50 
                  bg-transparent text-white focus:bg-white focus:text-black
                  transition-all duration-300 focus:placeholder:text-black
                  focus:border-white outline-none"
                placeholder="City"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-black font-semibold px-2 bg-yellow-300 p-1 w-fit rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="text-sm text-black font-semibold px-2 bg-green-300 p-1 w-fit rounded-lg">
              {success}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border-2 border-white text-white rounded-xl hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-white text-[#964FFF] rounded-xl hover:bg-gray-100 disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
