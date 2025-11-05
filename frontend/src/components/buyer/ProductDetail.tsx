import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductWithDetails } from '../../types/product';
import { productService } from '../../services/product.service';
import { wantListService } from '../../services/wantList.service';
import { analyticsService } from '../../services/analytics.service';
import { PhotoGallery } from './PhotoGallery';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { CommentSection } from '../shared/CommentSection';
import { ArrowLeftIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { formatPrice } from '../../utils/currency';

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToWantList, setAddingToWantList] = useState(false);
  const [isInWantList, setIsInWantList] = useState(false);

  useEffect(() => {
    if (!productId) {
      navigate('/buyer');
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const productData = await productService.getProduct(productId);
        setProduct(productData);
        
        // Record the view
        try {
          await productService.recordView(productId);
          // Also track for analytics
          await analyticsService.trackProductView(productId);
        } catch (viewError) {
          console.error('Error recording view:', viewError);
          // Don't fail the whole component if view tracking fails
        }
        
        // Check if product is in user's want list
        try {
          const wantList = await wantListService.getBuyerWantList();
          const isInList = wantList.items.some(item => item.productId === productId);
          setIsInWantList(isInList);
        } catch (wantListError) {
          console.error('Error checking want list:', wantListError);
          setIsInWantList(false);
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, navigate]);

  const handleAddToWantList = async () => {
    if (!product || addingToWantList) return;

    try {
      setAddingToWantList(true);
      await wantListService.addToWantList(product.id);
      setIsInWantList(true);
    } catch (err) {
      console.error('Error adding to want list:', err);
      setError('Failed to add product to want list. Please try again.');
    } finally {
      setAddingToWantList(false);
    }
  };

  const handleRemoveFromWantList = async () => {
    if (!product || addingToWantList) return;

    try {
      setAddingToWantList(true);
      // Find the want list item ID for this product
      const wantList = await wantListService.getBuyerWantList();
      const wantListItem = wantList.items.find(item => item.productId === product.id);
      
      if (wantListItem) {
        await wantListService.removeFromWantList(wantListItem.id);
        setIsInWantList(false);
      }
    } catch (err) {
      console.error('Error removing from want list:', err);
      setError('Failed to remove product from want list. Please try again.');
    } finally {
      setAddingToWantList(false);
    }
  };



  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'Not available';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/buyer')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const isAvailable = product.status === 'available';
  const canAddToWantList = isAvailable && !isInWantList;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/buyer')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Products
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Photo Gallery */}
          <div className="aspect-square md:aspect-video">
            <PhotoGallery photos={product.photos} />
          </div>

          {/* Product Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h1>
                <p className="text-3xl font-bold text-indigo-600 mb-4">
                  {formatPrice(product.price)}
                </p>
              </div>

              {/* Want List Button */}
              <div className="ml-4">
                {isInWantList ? (
                  <button
                    onClick={handleRemoveFromWantList}
                    disabled={addingToWantList}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <HeartIconSolid className="w-5 h-5 mr-2" />
                    {addingToWantList ? 'Removing...' : 'Remove from Want List'}
                  </button>
                ) : (
                  <button
                    onClick={handleAddToWantList}
                    disabled={!canAddToWantList || addingToWantList}
                    className={`flex items-center px-4 py-2 rounded-md transition-colors disabled:opacity-50 ${
                      canAddToWantList
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <HeartIcon className="w-5 h-5 mr-2" />
                    {addingToWantList ? 'Adding...' : 'I Want This'}
                  </button>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                product.status === 'available' 
                  ? 'bg-green-100 text-green-800'
                  : product.status === 'reserved'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.status === 'available' ? 'Available' : 
                 product.status === 'reserved' ? 'Reserved' : 'Sold'}
              </span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </div>

            {/* Categories */}
            {product.categories && product.categories.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category) => (
                    <span
                      key={category.id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Product Details */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Listed on:</span>
                  <span className="ml-2 text-gray-900">
                    {formatDate(product.createdAt)}
                  </span>
                </div>
                {product.publishedAt && (
                  <div>
                    <span className="font-medium text-gray-600">Published on:</span>
                    <span className="ml-2 text-gray-900">
                      {formatDate(product.publishedAt)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-600">Product ID:</span>
                  <span className="ml-2 text-gray-900 font-mono text-xs">
                    {product.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t pt-6 mt-6">
              <CommentSection 
                productId={product.id} 
                sellerId={product.sellerId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}