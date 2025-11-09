import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrashIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { wantListService } from '../../services/wantList.service';
import { WantList as WantListType } from '../../types/wantList';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { formatPrice } from '../../utils/currency';
import { mediaService } from '../../services/media.service';

interface QueueInfo {
  [productId: string]: { position: number | null; total: number };
}

export function WantList() {
  const { t } = useTranslation('buyer');
  const [wantList, setWantList] = useState<WantListType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [queueInfo, setQueueInfo] = useState<QueueInfo>({});
  const [completing, setCompleting] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadWantList();
  }, []);

  const loadWantList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wantListService.getBuyerWantList();
      setWantList(data);
      
      // Load queue positions for all products in the want list
      const queueInfoMap: QueueInfo = {};
      for (const item of data.items) {
        try {
          const queueInfo = await wantListService.getQueuePosition(item.product_id);
          queueInfoMap[item.product_id] = queueInfo;
        } catch (queueError) {
          console.error('Error loading queue position for product:', item.product_id, queueError);
        }
      }
      setQueueInfo(queueInfoMap);
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

  const handleCompleteSelection = async () => {
    if (!wantList || !wantList.id) {
      setError(t('wantList.cannotComplete', 'Não é possível completar a seleção'));
      return;
    }

    try {
      setCompleting(true);
      setError(null);
      setCompletionMessage(null);
      
      await wantListService.completeBuyerWantList();
      
      setCompletionMessage(t('wantList.completedSuccess', 'Seleção completada com sucesso! O vendedor processará seu pedido.'));
      
      // Reload want list to show updated status
      setTimeout(() => {
        loadWantList();
      }, 2000);
    } catch (err: any) {
      console.error('Error completing selection:', err);
      const errorMessage = err.response?.data?.message || t('wantList.failedToComplete', 'Falha ao completar a seleção. Por favor, tente novamente.');
      setError(errorMessage);
    } finally {
      setCompleting(false);
    }
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

  // Calculate total price from items (fallback if total_price is not available or invalid)
  const calculatedTotal = wantList.items.reduce((sum, item) => {
    const price = parseFloat(String(item.product?.price || 0));
    return sum + (isNaN(price) ? 0 : price);
  }, 0);
  
  const totalPrice = wantList.total_price && !isNaN(Number(wantList.total_price)) 
    ? Number(wantList.total_price)
    : calculatedTotal;

  return (
    <div className="space-y-6">
      {/* Want List Summary */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-indigo-900">{t('wantList.title')}</h3>
            <p className="text-sm text-indigo-700">
              {t('wantList.items', { count: wantList.item_count || wantList.items.length })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-900">
              {formatPrice(totalPrice)}
            </p>
            <p className="text-sm text-indigo-700">{t('wantList.total', { amount: formatPrice(totalPrice) })}</p>
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
                    src={mediaService.getPhotoUrl(item.product.photos[0].id, 'small')}
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
                    {item.added_at ? (
                      <>Added {new Date(item.added_at).toLocaleDateString('pt-PT')}</>
                    ) : (
                      <>Added {item.addedAt ? new Date(item.addedAt).toLocaleDateString('pt-PT') : t('wantList.dateNotAvailable', 'Data não disponível')}</>
                    )}
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
                
                {/* Queue Position Info */}
                {queueInfo[item.product_id] && queueInfo[item.product_id].position !== null && (
                  <div className={`mt-3 p-2 rounded-lg ${
                    queueInfo[item.product_id].position === 1 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {queueInfo[item.product_id].position === 1 ? (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-2 flex-1">
                        {queueInfo[item.product_id].position === 1 ? (
                          <p className="text-xs font-medium text-green-800">
                            {t('product.queueFirst', 'Você é o primeiro na fila!')}
                          </p>
                        ) : (
                          <p className="text-xs font-medium text-blue-800">
                            {t('product.queuePosition', 'Posição {{position}} de {{total}} na fila', { 
                              position: queueInfo[item.product_id].position, 
                              total: queueInfo[item.product_id].total 
                            })}
                          </p>
                        )}
                      </div>
                    </div>
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
      <div className="pt-4 border-t border-gray-200">
        {/* Check if all products are in position 1 */}
        {(() => {
          const allItemsInQueue = wantList.items.every(item => 
            queueInfo[item.product_id] && queueInfo[item.product_id].position !== null
          );
          const allInPosition1 = wantList.items.every(item => 
            queueInfo[item.product_id] && queueInfo[item.product_id].position === 1
          );
          const hasItemsNotInPosition1 = wantList.items.some(item => 
            queueInfo[item.product_id] && queueInfo[item.product_id].position !== null && queueInfo[item.product_id].position !== 1
          );

          if (hasItemsNotInPosition1) {
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      {t('wantList.waitingInQueue', 'Aguardando na fila de interesse')}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {t('wantList.waitingInQueueInfo', 'Alguns produtos ainda não estão na primeira posição da fila. Apenas quando você for o primeiro na fila para todos os produtos, poderá completar a seleção.')}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          if (allInPosition1 && allItemsInQueue) {
            return (
              <div className="space-y-3">
                {completionMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800">{completionMessage}</p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {t('wantList.readyToProceed', 'Pronto para prosseguir com sua seleção?')}
                  </p>
                  <button
                    onClick={handleCompleteSelection}
                    disabled={completing}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completing ? (
                      <span className="flex items-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">{t('wantList.completing', 'Completando...')}</span>
                      </span>
                    ) : (
                      t('wantList.completeSelection', 'Completar Seleção')
                    )}
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {t('wantList.readyToProceed', 'Pronto para prosseguir com sua seleção?')}
              </p>
              <button
                disabled
                className="px-6 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                title={t('wantList.waitingForQueue', 'Aguardando posição na fila')}
              >
                {t('wantList.completeSelection', 'Completar Seleção')}
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}