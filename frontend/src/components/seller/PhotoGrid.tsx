import { useState } from 'react';
import { UploadedPhoto } from '../../types/media';
import { mediaService } from '../../services/media.service';

interface PhotoGridProps {
  photos: UploadedPhoto[];
  selectedPhotos: Set<string>;
  onSelectionChange: (selectedPhotos: Set<string>) => void;
  onDeletePhoto?: (photoId: string) => void;
  selectionMode?: boolean;
  maxSelection?: number;
}

export function PhotoGrid({ 
  photos, 
  selectedPhotos, 
  onSelectionChange, 
  onDeletePhoto,
  selectionMode = true,
  maxSelection 
}: PhotoGridProps) {
  const [deletingPhotos, setDeletingPhotos] = useState<Set<string>>(new Set());

  const handlePhotoClick = (photoId: string) => {
    if (!selectionMode) return;

    const newSelection = new Set(selectedPhotos);
    
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      if (maxSelection && newSelection.size >= maxSelection) {
        // If at max selection, replace the first selected photo
        const firstSelected = Array.from(newSelection)[0];
        newSelection.delete(firstSelected);
      }
      newSelection.add(photoId);
    }
    
    onSelectionChange(newSelection);
  };

  const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!onDeletePhoto) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this photo?');
    if (!confirmed) return;

    setDeletingPhotos(prev => new Set(prev).add(photoId));
    
    try {
      await mediaService.deletePhoto(photoId);
      onDeletePhoto(photoId);
      
      // Remove from selection if it was selected
      if (selectedPhotos.has(photoId)) {
        const newSelection = new Set(selectedPhotos);
        newSelection.delete(photoId);
        onSelectionChange(newSelection);
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setDeletingPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      // Deselect all
      onSelectionChange(new Set());
    } else {
      // Select all (up to max limit)
      const photosToSelect = maxSelection 
        ? photos.slice(0, maxSelection)
        : photos;
      onSelectionChange(new Set(photosToSelect.map(p => p.id)));
    }
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 text-gray-300 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500">No photos uploaded yet</p>
        <p className="text-sm text-gray-400 mt-1">Upload some photos to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with selection controls */}
      {selectionMode && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedPhotos.size} of {photos.length} photos selected
            {maxSelection && ` (max ${maxSelection})`}
          </div>
          <button
            onClick={handleSelectAll}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {selectedPhotos.size === photos.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo) => {
          const isSelected = selectedPhotos.has(photo.id);
          const isDeleting = deletingPhotos.has(photo.id);
          
          return (
            <div
              key={photo.id}
              className={`
                relative aspect-square rounded-lg overflow-hidden cursor-pointer
                transition-all duration-200 ease-in-out
                ${selectionMode ? 'hover:scale-105' : ''}
                ${isSelected 
                  ? 'ring-4 ring-indigo-500 ring-offset-2' 
                  : 'hover:ring-2 hover:ring-gray-300'
                }
                ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
              `}
              onClick={() => handlePhotoClick(photo.id)}
            >
              {/* Photo Image */}
              <img
                src={mediaService.getThumbnailUrl(photo.id)}
                alt={photo.originalName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Selection Overlay */}
              {selectionMode && (
                <div className={`
                  absolute inset-0 flex items-center justify-center
                  transition-opacity duration-200
                  ${isSelected 
                    ? 'bg-indigo-500 bg-opacity-30' 
                    : 'bg-black bg-opacity-0 hover:bg-opacity-20'
                  }
                `}>
                  {isSelected && (
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )}
              
              {/* Delete Button */}
              {onDeletePhoto && (
                <button
                  onClick={(e) => handleDeletePhoto(photo.id, e)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                  title="Delete photo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              
              {/* Loading Overlay for Deletion */}
              {isDeleting && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                </div>
              )}
              
              {/* Photo Info Tooltip */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 hover:opacity-100 transition-opacity">
                <p className="truncate">{photo.originalName}</p>
                <p>{(photo.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Selection Summary */}
      {selectionMode && selectedPhotos.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-900">
                {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-indigo-700">
                Ready to create product with selected photos
              </p>
            </div>
            <button
              onClick={() => onSelectionChange(new Set())}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}