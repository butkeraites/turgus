import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrashIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { wantListService } from '../../services/wantList.service';
import { WantList as WantListType } from '../../types/wantList';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export function WantList() {
  const { t } = useTranslation('buyer');
  const [wantList, setWantList] = useState<WantListType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWantList();
  }, []);

  const loadWantList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wantListService.getBuyerWantList();
      setWantList(data);
    } catch (err) {
      console.error('Error loading want list:', err);
      setError(t('common:status.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setRemovingItems(prev => new Set(prev).add(itemId));
      await wantListService.removeFromWantList(itemId);
      
      // Reload want list to get updated data
      await loadWantList();
    } catch (err) {
      console.error('Error removing item:', err);
      setError(t('wantList.itemRemoved'));
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadWantList}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!wantList || wantList.items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('wantList.empty')}</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start browsing products and add items you're interested in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Want List Summary */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-indigo-900">{t('wantList.title')}</h3>
            <p className="text-sm text-indigo-700">
              {t('wantList.items', { count: wantList.itemCount })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-900">
              {formatPrice(wantList.totalPrice)}
            </p>
            <p className="text-sm text-indigo-700">{t('wantList.total', { amount: formatPrice(wantList.totalPrice) })}</p>
          </div>
        </div>
      </div>

      {/* Want List Items */}
      <div className="space-y-4">
        {wantList.items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              {/* Product Image */}
              <div className="flex-shrink-0">
                {item.product.photos && item.product.photos.length > 0 ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/media/${item.product.photos[0].id}`}
                    alt={item.product.title}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-400 text-xs">{t('common:status.noData')}</span>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-medium text-gray-900 truncate">
                  {item.product.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {item.product.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-lg font-semibold text-indigo-600">
                    {formatPrice(item.product.price)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Categories */}
                {item.product.categories && item.product.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.product.categories.map((category) => (
                      <span
                        key={category.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={removingItems.has(item.id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  title={t('wantList.removeItem')}
                >
                  {removingItems.has(item.id) ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <TrashIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Ready to proceed with your selection?
        </p>
        <button
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          onClick={() => {
            // TODO: Implement completion flow
            console.log('Complete want list selection');
          }}
        >
          Complete Selection
        </button>
      </div>
    </div>
  );
}