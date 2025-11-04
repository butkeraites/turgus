import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ProductWithDetails, ProductFilters } from '../../types/product';
import { productService } from '../../services/product.service';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ResponsiveGrid } from '../layout/ResponsiveGrid';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface ProductFeedProps {
  filters: ProductFilters;
}

export function ProductFeed({ filters }: ProductFeedProps) {
  const { t } = useTranslation('buyer');
  const location = useLocation();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadProducts = useCallback(async (pageNum: number, reset = false, bustCache = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);

      const response = await productService.getProducts({
        ...filters,
        page: pageNum,
        limit: 20,
        // If no status filter is set, show all published products
        ...(filters.status === undefined && { status: ['available', 'reserved', 'sold'] })
      }, bustCache);

      if (reset || pageNum === 1) {
        setProducts(response.data);
      } else {
        setProducts(prev => [...prev, ...response.data]);
      }

      setHasMore(response.pagination.has_next);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('common:status.error'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, t]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await loadProducts(1, true, true); // Bust cache on manual refresh
  }, [loadProducts]);

  // Pull to refresh hook
  const [pullToRefreshRef, pullToRefreshState] = usePullToRefresh<HTMLDivElement>({
    onRefresh: handleRefresh,
    threshold: 80,
    enabled: !loading && !loadingMore
  });

  // Load initial products
  useEffect(() => {
    loadProducts(1, true);
  }, [loadProducts]);

  // Refresh products when navigating back to this page (to update view status)
  useEffect(() => {
    // Only refresh if we're on the buyer dashboard/feed page
    if (location.pathname === '/buyer') {
      // Add a small delay to ensure the navigation is complete
      const timeoutId = setTimeout(() => {
        loadProducts(1, true, true); // Bust cache when navigating back
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, loadProducts]);

  // Refresh products when component becomes visible (to update view status)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh the first page to update view status
        loadProducts(1, true, true); // Bust cache when page becomes visible
      }
    };

    const handleFocus = () => {
      // Window regained focus, refresh products to update view status
      loadProducts(1, true, true); // Bust cache when window gains focus
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadProducts]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (loadingMore || !hasMore) return;

    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 1000) {
      loadProducts(page + 1);
    }
  }, [loadingMore, hasMore, page, loadProducts]);

  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => loadProducts(1, true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('feed.noProducts')}</p>
      </div>
    );
  }

  return (
    <div 
      ref={pullToRefreshRef}
      className="space-y-6 relative"
      style={{
        transform: pullToRefreshState.isPulling 
          ? `translateY(${pullToRefreshState.pullDistance}px)` 
          : 'translateY(0)',
        transition: pullToRefreshState.isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      {(pullToRefreshState.isPulling || pullToRefreshState.isRefreshing) && (
        <div 
          className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center text-gray-500"
          style={{
            opacity: pullToRefreshState.pullDistance / 80
          }}
        >
          <ArrowPathIcon 
            className={`w-6 h-6 mb-1 ${
              pullToRefreshState.isRefreshing ? 'animate-spin' : ''
            }`} 
          />
          <span className="text-xs">
            {pullToRefreshState.isRefreshing 
              ? 'Refreshing...' 
              : pullToRefreshState.pullDistance >= 80 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </span>
        </div>
      )}

      {/* Instagram-like grid layout */}
      <ResponsiveGrid 
        cols={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
        gap="sm"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ResponsiveGrid>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}

      {/* End of results indicator */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">You've reached the end!</p>
        </div>
      )}
    </div>
  );
}