import { useState, useRef, useEffect } from 'react';
import { ProductPhoto } from '../../types/product';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PhotoGalleryProps {
  photos: ProductPhoto[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

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

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && sortedPhotos.length > 1) {
      goToNext();
    }
    if (isRightSwipe && sortedPhotos.length > 1) {
      goToPrevious();
    }
  };

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
      ref={galleryRef}
      className="relative w-full h-full bg-black group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Image */}
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/media/${currentPhoto.id}`}
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
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/media/${photo.id}`}
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