import { useNavigate } from 'react-router-dom';
import { ProductWithDetails } from '../../types/product';
import { EyeIcon } from '@heroicons/react/24/outline';
import { LazyImage } from '../shared/LazyImage';
import { useHapticFeedback } from '../../utils/haptics';
import { formatPrice } from '../../utils/currency';
import { mediaService } from '../../services/media.service';

interface ProductCardProps {
  product: ProductWithDetails;
  onClick?: (product: ProductWithDetails) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const navigate = useNavigate();
  const { buttonPress } = useHapticFeedback();
  const primaryPhoto = product.photos?.[0];
  const isAvailable = product.status === 'available';
  const isViewed = product.isViewed || product.is_viewed;

  const handleClick = () => {
    buttonPress(); // Haptic feedback on tap
    if (onClick) {
      onClick(product);
    } else {
      navigate(`/buyer/product/${product.id}`);
    }
  };

  return (
    <div
      className="relative aspect-square cursor-pointer group touch-manipulation"
      onClick={handleClick}
    >
      {/* Product Image */}
      <div className="w-full h-full rounded-lg overflow-hidden bg-gray-200">
        {primaryPhoto ? (
          <LazyImage
            src={mediaService.getPhotoUrl(primaryPhoto.id, 'medium')}
            alt={product.title}
            className={`transition-all duration-300 ${
              isAvailable 
                ? 'group-hover:scale-105 group-active:scale-95' 
                : 'grayscale opacity-75'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500 text-xs">No Image</span>
          </div>
        )}

        {/* Status overlay for sold/reserved items */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-white font-semibold text-xs sm:text-sm px-2 py-1 bg-black bg-opacity-60 rounded">
              {product.status === 'sold' ? 'SOLD' : 'RESERVED'}
            </span>
          </div>
        )}

        {/* Viewed indicator */}
        {isViewed && (
          <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
            <div className="bg-black bg-opacity-60 rounded-full p-1">
              <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
          </div>
        )}

        {/* Price overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1.5 sm:p-2">
          <p className="text-white font-semibold text-xs sm:text-sm">
            {formatPrice(product.price)}
          </p>
          {product.title && (
            <p className="text-white text-xs opacity-90 truncate">
              {product.title}
            </p>
          )}
        </div>

        {/* Hover/Touch overlay with additional info */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 group-active:bg-opacity-30 transition-all duration-200 opacity-0 group-hover:opacity-100 group-active:opacity-100">
          <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
            {product.photos && product.photos.length > 1 && (
              <div className="bg-black bg-opacity-60 rounded px-1.5 sm:px-2 py-1">
                <span className="text-white text-xs">
                  +{product.photos.length - 1} more
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}