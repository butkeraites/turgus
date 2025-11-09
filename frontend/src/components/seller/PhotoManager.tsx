import { useState, useEffect, useCallback } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import { UploadedPhoto } from '../../types/media';
import { mediaService } from '../../services/media.service';

interface PhotoManagerProps {
  selectedPhotos: Set<string>;
  onSelectionChange: (selectedPhotos: Set<string>) => void;
  maxSelection?: number;
  showUploader?: boolean;
}

export function PhotoManager({ 
  selectedPhotos, 
  onSelectionChange, 
  maxSelection,
  showUploader = true 
}: PhotoManagerProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [allPhotos, setAllPhotos] = useState<Array<UploadedPhoto & { isAssigned: boolean; productId?: string; productTitle?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (showAll) {
        // Load all photos (assigned and unassigned)
        const all = await mediaService.getAllPhotos();
        setAllPhotos(all);
        // For selection, only show unassigned photos
        const unassigned = all.filter(p => !p.isAssigned);
        setPhotos(unassigned);
      } else {
        // Load only unassigned photos
        const unassignedPhotos = await mediaService.getUnassignedPhotos();
        setPhotos(unassignedPhotos);
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
      setError('Failed to load photos. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handlePhotosUploaded = (newPhotos: UploadedPhoto[]) => {
    setPhotos(prev => [...newPhotos, ...prev]);
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleRefresh = () => {
    loadPhotos();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-600">Loading photos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 text-red-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      {showUploader && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Upload Photos</h3>
            {photos.length > 0 && (
              <button
                onClick={handleRefresh}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            )}
          </div>
          <PhotoUploader onPhotosUploaded={handlePhotosUploaded} />
        </div>
      )}

      {/* Photo Grid Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">
              {showAll ? 'All Photos' : 'Available Photos'}
              {showAll && allPhotos.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({allPhotos.filter(p => !p.isAssigned).length} available, {allPhotos.filter(p => p.isAssigned).length} assigned)
                </span>
              )}
              {!showAll && photos.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({photos.length} photo{photos.length !== 1 ? 's' : ''})
                </span>
              )}
            </h3>
            <button
              onClick={() => {
                setShowAll(!showAll);
                loadPhotos();
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showAll ? 'Show Only Available' : 'Show All Photos'}
            </button>
          </div>
          {maxSelection && (
            <div className="text-sm text-gray-500">
              Select up to {maxSelection} photo{maxSelection !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        {showAll && allPhotos.length > 0 && (
          <div className="mb-4 space-y-4">
            {/* Assigned Photos Section */}
            {allPhotos.filter(p => p.isAssigned).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Assigned to Products ({allPhotos.filter(p => p.isAssigned).length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {allPhotos.filter(p => p.isAssigned).map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-green-300">
                        <img
                          src={mediaService.getThumbnailUrl(photo.id)}
                          alt={photo.originalName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                        ✓
                      </div>
                      {photo.productTitle && (
                        <div className="mt-1 text-xs text-gray-600 truncate" title={photo.productTitle}>
                          {photo.productTitle}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Unassigned Photos Section */}
            {allPhotos.filter(p => !p.isAssigned).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Available ({allPhotos.filter(p => !p.isAssigned).length})
                </h4>
              </div>
            )}
          </div>
        )}
        
        <PhotoGrid
          photos={photos}
          selectedPhotos={selectedPhotos}
          onSelectionChange={onSelectionChange}
          onDeletePhoto={handleDeletePhoto}
          maxSelection={maxSelection}
        />
      </div>
    </div>
  );
}