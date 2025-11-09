import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('buyer');
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToWantList, setAddingToWantList] = useState(false);
  const [isInWantList, setIsInWantList] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [totalInQueue, setTotalInQueue] = useState<number>(0);
  const [showQueueMessage, setShowQueueMessage] = useState(false);

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
        
        // Check if product is in user's want list and get queue position
        try {
          const wantList = await wantListService.getBuyerWantList();
          const isInList = wantList.items.some(item => item.product_id === productId);
          setIsInWantList(isInList);
          
          // If in want list, get queue position
          if (isInList) {
            try {
              const queueInfo = await wantListService.getQueuePosition(productId);
              setQueuePosition(queueInfo.position);
              setTotalInQueue(queueInfo.total);
            } catch (queueError) {
              console.error('Error getting queue position:', queueError);
            }
          }
        } catch (wantListError) {
          console.error('Error checking want list:', wantListError);
          setIsInWantList(false);
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError(t('product.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, navigate, t]);

  const handleAddToWantList = async () => {
    if (!product || addingToWantList) return;

    try {
      setAddingToWantList(true);
      const queueInfo = await wantListService.addToWantList(product.id);
      setIsInWantList(true);
      setQueuePosition(queueInfo.queue_position);
      setTotalInQueue(queueInfo.total_in_queue);
      setShowQueueMessage(true);
      
      // Hide message after 5 seconds
      setTimeout(() => setShowQueueMessage(false), 5000);
    } catch (err) {
      console.error('Error adding to want list:', err);
      setError(t('product.failedToAddToWantList'));
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
      const wantListItem = wantList.items.find(item => item.product_id === product.id);
      
      if (wantListItem) {
        await wantListService.removeFromWantList(wantListItem.id);
        setIsInWantList(false);
        setQueuePosition(null);
        setTotalInQueue(0);
        setShowQueueMessage(false);
      }
    } catch (err) {
      console.error('Error removing from want list:', err);
      setError(t('product.failedToRemoveFromWantList'));
    } finally {
      setAddingToWantList(false);
    }
  };



  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return t('product.notAvailable');
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return t('product.invalidDate');
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
          <p className="text-red-600 mb-4">{error || t('product.productNotFound')}</p>
          <button
            onClick={() => navigate('/buyer')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {t('product.backToProducts')}
          </button>
        </div>
      </div>
    );
  }

  // Allow adding to want list if product is available or reserved (but not sold)
  // This enables the interest queue system where buyers can join even if product is reserved
  const canAddToWantList = (product.status === 'available' || product.status === 'reserved') && !isInWantList;

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
            {t('product.backToProducts')}
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
                    {addingToWantList ? t('product.removing') : t('product.removeFromWantList')}
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
                    {addingToWantList ? t('product.adding') : t('product.iWantThis')}
                  </button>
                )}
              </div>
            </div>

            {/* Status Badge and Queue Info */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  product.status === 'available' 
                    ? 'bg-green-100 text-green-800'
                    : product.status === 'reserved'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.status === 'available' ? t('product.available') : 
                   product.status === 'reserved' ? t('product.reserved') : t('product.sold')}
                </span>
                {product.status === 'reserved' && !isInWantList && (
                  <span className="text-sm text-gray-600">
                    {t('product.reservedInfo', 'Você pode entrar na fila de interesse')}
                  </span>
                )}
              </div>
              
              {/* Queue Position Info */}
              {isInWantList && queuePosition !== null && (
                <div className={`p-3 rounded-lg ${
                  queuePosition === 1 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {queuePosition === 1 ? (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      {queuePosition === 1 ? (
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {t('product.queueFirst', 'Você é o primeiro na fila!')}
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            {t('product.queueFirstInfo', 'Quando o vendedor finalizar a ordem anterior, você receberá o produto automaticamente.')}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            {t('product.queuePosition', 'Você está na posição {{position}} de {{total}} na fila de interesse', { position: queuePosition, total: totalInQueue })}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            {t('product.queuePositionInfo', 'Você será notificado quando for sua vez. Apenas a primeira pessoa da fila recebe uma ordem automaticamente.')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Success Message after adding */}
              {showQueueMessage && queuePosition !== null && (
                <div className={`p-3 rounded-lg ${
                  queuePosition === 1 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-blue-50 border border-blue-200'
                } animate-fade-in`}>
                  <p className="text-sm font-medium text-gray-800">
                    {queuePosition === 1 
                      ? t('product.addedToQueueFirst', 'Produto adicionado! Você é o primeiro na fila.')
                      : t('product.addedToQueue', 'Produto adicionado à fila de interesse! Você está na posição {{position}} de {{total}}.', { position: queuePosition, total: totalInQueue })
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('product.description')}</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </div>

            {/* Categories */}
            {product.categories && product.categories.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('product.categories')}</h3>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('product.productDetails')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">{t('product.listedOn')}</span>
                  <span className="ml-2 text-gray-900">
                    {formatDate(product.created_at)}
                  </span>
                </div>
                {product.published_at && (
                  <div>
                    <span className="font-medium text-gray-600">{t('product.publishedOn')}</span>
                    <span className="ml-2 text-gray-900">
                      {formatDate(product.published_at)}
                    </span>
                  </div>
                )}
                {product.available_after && (
                  <div>
                    <span className="font-medium text-gray-600">{t('product.availableFrom')}</span>
                    <span className="ml-2 text-gray-900">
                      {formatDate(product.available_after)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-600">{t('product.productId')}</span>
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
                sellerId={product.seller_id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}