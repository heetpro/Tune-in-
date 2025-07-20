"use client";

import { useState, useRef } from 'react';
import { Camera, Loader2, AlertCircle, User2 } from 'lucide-react';

interface ImageUploadProps {
  initialImage?: string;
  onImageChange: (url: string) => void;
  className?: string;
}

export const ImageUpload = ({ initialImage, onImageChange, className = '' }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Create a temporary preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Create a FormData instance
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload through our API route
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload response:', data);

      // Update with the actual cloud URL
      setPreviewUrl(data.url);
      onImageChange(data.url);

    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative mb-4">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-24 h-24 rounded-full object-cover border-2 border-white"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
            <User2 className="w-12 h-12 text-white" />
          </div>
        )}
        
        <label className="absolute bottom-0 right-0 bg-white text-[#8D50F9] p-2 rounded-full hover:bg-gray-100 cursor-pointer">
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
            ref={fileInputRef}
            disabled={isUploading}
          />
        </label>
      </div>
      
      {error && (
        <div className="text-yellow-300 text-xs flex items-center justify-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}; 