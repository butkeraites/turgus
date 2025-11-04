import { useState, useEffect } from 'react';
import { ProductPhoto } from '../../types/product';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { mediaService } from '../../services/media.service';

interface PhotoGalleryProps {
  photos: ProductPhoto[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sort photos by order
  const sortedPhotos = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? sortedPhotos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === sortedPhotos.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Swipe gesture handling
  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: () => {
      if (sortedPhotos.length > 1) goToNext();
    },
    onSwipeRight: () => {
      if (sortedPhotos.length > 1) goToPrevious();
    },
    threshold: 50,
    preventScroll: true
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!sortedPhotos || sortedPhotos.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

  const currentPhoto = sortedPhotos[currentIndex];

  return (
    <div 
      ref={swipeRef}
      className="relative w-full h-full bg-black group touch-manipulation"
    >
      {/* Main Image */}
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={mediaService.getPhotoUrl(currentPhoto.id, 'large')}
          alt={`Product photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Navigation Arrows */}
      {sortedPhotos.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous photo"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next photo"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Photo Counter */}
      {sortedPhotos.length > 1 && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {sortedPhotos.length}
        </div>
      )}

      {/* Thumbnail Navigation */}
      {sortedPhotos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {sortedPhotos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => goToSlide(index)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-white'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={mediaService.getPhotoUrl(photo.id, 'thumb')}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Swipe Indicator */}
      {sortedPhotos.length > 1 && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Swipe or use arrow keys to navigate
        </div>
      )}
    </div>
  );
}