'use client';

// This file ensures Cloudinary is properly configured with environment variables

// Check if Cloudinary environment variables are set
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
                 process.env.CLOUDINARY_CLOUD_NAME;
                 
const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || 
              process.env.CLOUDINARY_API_KEY;

// Export configuration for use in components
export const cloudinaryConfig = {
  cloudName,
  apiKey
};

// Log warning if configuration is missing
if (!cloudName) {
  console.warn('Cloudinary cloud name is missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your .env.local file.');
}

if (!apiKey) {
  console.warn('Cloudinary API key is missing. Please set NEXT_PUBLIC_CLOUDINARY_API_KEY in your .env.local file.');
}

export const isCloudinaryConfigured = Boolean(cloudName && apiKey); 