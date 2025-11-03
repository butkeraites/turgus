import React, { useState, useRef, useCallback } from 'react';
import { UploadProgress, UploadedPhoto } from '../../types/media';
import { mediaService } from '../../services/media.service';

interface PhotoUploaderProps {
  onPhotosUploaded: (photos: UploadedPhoto[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function PhotoUploader({ 
  onPhotosUploaded, 
  maxFiles = 20,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}: PhotoUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList | File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];
    const fileArray = Array.from(files);

    if (fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { valid, errors };
    }

    fileArray.forEach((file) => {
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`);
        return;
      }

      if (file.size > 300 * 1024 * 1024) { // 300MB limit
        errors.push(`${file.name}: File too large. Maximum size is 300MB.`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    if (valid.length === 0) return;

    setIsUploading(true);
    
    // Initialize progress tracking
    const initialProgress: UploadProgress[] = valid.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    setUploadProgress(initialProgress);

    try {
      // Update status to uploading
      setUploadProgress(prev => 
        prev.map(p => ({ ...p, status: 'uploading' as const }))
      );

      const response = await mediaService.uploadPhotos(valid, (progress) => {
        setUploadProgress(prev => 
          prev.map(p => ({ ...p, progress }))
        );
      });

      // Update with results
      const updatedProgress = initialProgress.map((item, index) => {
        const uploadedPhoto = response.files[index];
        const error = response.errors?.find(e => e.filename === item.file.name);
        
        return {
          ...item,
          progress: 100,
          status: error ? 'error' as const : 'success' as const,
          error: error?.error,
          uploadedPhoto
        };
      });

      setUploadProgress(updatedProgress);

      // Notify parent component
      onPhotosUploaded(response.files);

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(prev => 
        prev.map(p => ({ 
          ...p, 
          status: 'error' as const, 
          error: 'Upload failed. Please try again.' 
        }))
      );
    } finally {
      setIsUploading(false);
    }
  }, [maxFiles, acceptedTypes, onPhotosUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same files again
    e.target.value = '';
  }, [handleFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragOver 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragOver ? 'Drop photos here' : 'Upload product photos'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop photos here, or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-2">
              JPEG, PNG, WebP • Max {maxFiles} files • Up to 300MB each
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      {uploadProgress.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Upload Progress</h4>
          {uploadProgress.map((item, index) => (
            <div key={index} className="bg-white border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {item.file.name}
                </span>
                <span className="text-xs text-gray-500">
                  {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.status === 'error' 
                      ? 'bg-red-500' 
                      : item.status === 'success'
                      ? 'bg-green-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${
                  item.status === 'error' 
                    ? 'text-red-600' 
                    : item.status === 'success'
                    ? 'text-green-600'
                    : 'text-indigo-600'
                }`}>
                  {item.status === 'pending' && 'Waiting...'}
                  {item.status === 'uploading' && 'Uploading...'}
                  {item.status === 'success' && 'Complete'}
                  {item.status === 'error' && 'Failed'}
                </span>
                <span className="text-xs text-gray-500">
                  {item.progress}%
                </span>
              </div>
              
              {/* Error Message */}
              {item.error && (
                <p className="text-xs text-red-600 mt-1">{item.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}