import { useNavigate } from 'react-router-dom';
import { ProductWithDetails } from '../../types/product';
import { EyeIcon } from '@heroicons/react/24/outline';

interface ProductCardProps {
  product: ProductWithDetails;
  onClick?: (product: ProductWithDetails) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const navigate = useNavigate();
  const primaryPhoto = product.photos?.[0];
  const isAvailable = product.status === 'available';
  const isViewed = product.isViewed || product.is_viewed;

  const handleClick = () => {
    if (onClick) {
      onClick(product);
    } else {
      navigate(`/buyer/product/${product.id}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div
      className="relative aspect-square cursor-pointer group"
      onClick={handleClick}
    >
      {/* Product Image */}
      <div className="w-full h-full rounded-lg overflow-hidden bg-gray-200">
        {primaryPhoto ? (
          <img
            src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/media/${primaryPhoto.id}`}
            alt={product.title}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isAvailable 
                ? 'group-hover:scale-105' 
                : 'grayscale opacity-75'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500 text-xs">No Image</span>
          </div>
        )}

        {/* Status overlay for sold/reserved items */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-white font-semibold text-sm px-2 py-1 bg-black bg-opacity-60 rounded">
              {product.status === 'sold' ? 'SOLD' : 'RESERVED'}
            </span>
          </div>
        )}

        {/* Viewed indicator */}
        {isViewed && (
          <div className="absolute top-2 right-2">
            <div className="bg-black bg-opacity-60 rounded-full p-1">
              <EyeIcon className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Price overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
          <p className="text-white font-semibold text-sm">
            {formatPrice(product.price)}
          </p>
          {product.title && (
            <p className="text-white text-xs opacity-90 truncate">
              {product.title}
            </p>
          )}
        </div>

        {/* Hover overlay with additional info */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 opacity-0 group-hover:opacity-100">
          <div className="absolute top-2 left-2">
            {product.photos && product.photos.length > 1 && (
              <div className="bg-black bg-opacity-60 rounded px-2 py-1">
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