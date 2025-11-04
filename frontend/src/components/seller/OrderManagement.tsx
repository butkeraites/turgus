import { useState, useEffect } from 'react';
import { TrashIcon, UserIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { wantListService } from '../../services/wantList.service';
import { WantListWithBuyer } from '../../types/wantList';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { formatPrice } from '../../utils/currency';
import { mediaService } from '../../services/media.service';

export function OrderManagement() {
  const [wantLists, setWantLists] = useState<WantListWithBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingLists, setCancellingLists] = useState<Set<string>>(new Set());
  const [completingLists, setCompletingLists] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWantLists();
  }, []);

  const loadWantLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wantListService.getSellerWantLists();
      setWantLists(data);
    } catch (err) {
      console.error('Error loading want lists:', err);
      setError('Failed to load want lists');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWantList = async (wantListId: string) => {
    if (!confirm('Are you sure you want to cancel this entire want list? This will make all products available again.')) {
      return;
    }

    try {
      setCancellingLists(prev => new Set(prev).add(wantListId));
      await wantListService.cancelWantList(wantListId);
      
      // Reload want lists to get updated data
      await loadWantLists();
    } catch (err) {
      console.error('Error cancelling want list:', err);
      setError('Failed to cancel want list');
    } finally {
      setCancellingLists(prev => {
        const newSet = new Set(prev);
        newSet.delete(wantListId);
        return newSet;
      });
    }
  };

  const handleCompleteWantList = async (wantListId: string) => {
    if (!confirm('Are you sure you want to confirm this order as completed? This will mark all products as sold and cannot be undone.')) {
      return;
    }

    try {
      setCompletingLists(prev => new Set(prev).add(wantListId));
      await wantListService.completeWantList(wantListId);
      
      // Reload want lists to get updated data
      await loadWantLists();
    } catch (err) {
      console.error('Error completing want list:', err);
      setError('Failed to complete want list');
    } finally {
      setCompletingLists(prev => {
        const newSet = new Set(prev);
        newSet.delete(wantListId);
        return newSet;
      });
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          onClick={loadWantLists}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (wantLists.length === 0) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          When buyers add your products to their want lists, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-indigo-900 mb-2">Order Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-indigo-700">Active Orders</p>
            <p className="text-2xl font-bold text-indigo-900">{wantLists.length}</p>
          </div>
          <div>
            <p className="text-indigo-700">Total Items</p>
            <p className="text-2xl font-bold text-indigo-900">
              {wantLists.reduce((sum, wl) => sum + wl.itemCount, 0)}
            </p>
          </div>
          <div>
            <p className="text-indigo-700">Pending Revenue</p>
            <p className="text-2xl font-bold text-indigo-900">
              {formatPrice(wantLists.reduce((sum, wl) => sum + wl.totalPrice, 0))}
            </p>
          </div>
          <div>
            <p className="text-green-700">Ready to Confirm</p>
            <p className="text-2xl font-bold text-green-900">{wantLists.length}</p>
          </div>
        </div>
        {wantLists.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              💰 When you confirm orders, the total value of <strong>{formatPrice(wantLists.reduce((sum, wl) => sum + wl.totalPrice, 0))}</strong> will be recorded as received revenue.
            </p>
          </div>
        )}
      </div>

      {/* Want Lists */}
      <div className="space-y-6">
        {wantLists.map((wantList) => (
          <div
            key={wantList.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
          >
            {/* Want List Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Order #{wantList.id?.slice(-8) || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Created {formatDate(wantList.createdAt!)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatPrice(wantList.totalPrice)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {wantList.itemCount} {wantList.itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <button
                    onClick={() => wantList.id && handleCancelWantList(wantList.id)}
                    disabled={!wantList.id || cancellingLists.has(wantList.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Cancel entire want list"
                  >
                    {wantList.id && cancellingLists.has(wantList.id) ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <TrashIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Buyer Information */}
            <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Buyer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{wantList.buyer.name}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{wantList.buyer.telephone}</span>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{wantList.buyer.address}</span>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="px-6 py-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Selected Products</h4>
              <div className="space-y-4">
                {wantList.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.product.photos && item.product.photos.length > 0 ? (
                        <img
                          src={mediaService.getPhotoUrl(item.product.photos[0].id, 'small')}
                          alt={item.product.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 truncate">
                        {item.product.title}
                      </h5>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {item.product.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-indigo-600">
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
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-600">
                    Contact buyer: 
                  </p>
                  <button
                    onClick={() => window.open(`tel:${wantList.buyer.telephone}`, '_self')}
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    {wantList.buyer.telephone}
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => wantList.id && handleCompleteWantList(wantList.id)}
                    disabled={!wantList.id || completingLists.has(wantList.id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {wantList.id && completingLists.has(wantList.id) ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <span>Confirm Order</span>
                    )}
                  </button>
                  <button
                    onClick={() => wantList.id && handleCancelWantList(wantList.id)}
                    disabled={!wantList.id || cancellingLists.has(wantList.id)}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}