import { CloudinaryUploadWidgetResults } from 'next-cloudinary';

// Helper type for Cloudinary upload results
export type CloudinaryResult = CloudinaryUploadWidgetResults;

// Default upload preset - you should create this in your Cloudinary dashboard
export const DEFAULT_UPLOAD_PRESET = 'dating_app_uploads';

// Helper function to get public ID from a Cloudinary URL
export const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1612345678/folder/filename.jpg
    const regex = /\/v\d+\/(.+?)(?:\.[^.]+)?$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Helper function to transform Cloudinary URLs
export const transformImage = (url: string, options: Record<string, string | number>): string => {
  if (!url) return '';
  
  try {
    // Find the upload part of the URL
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;
    
    // Build transformation string
    const transformations = Object.entries(options)
      .map(([key, value]) => `${key}_${value}`)
      .join(',');
    
    // Insert transformations
    return `${url.substring(0, uploadIndex + 8)}${transformations}/${url.substring(uploadIndex + 8)}`;
  } catch (error) {
    console.error('Error transforming image URL:', error);
    return url;
  }
}; 