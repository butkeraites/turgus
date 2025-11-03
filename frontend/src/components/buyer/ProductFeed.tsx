import { useState, useEffect, useCallback } from 'react';
import { ProductWithDetails, ProductFilters } from '../../types/product';
import { productService } from '../../services/product.service';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface ProductFeedProps {
  filters: ProductFilters;
}

export function ProductFeed({ filters }: ProductFeedProps) {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadProducts = useCallback(async (pageNum: number, reset = false) => {
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
        status: filters.status || ['available', 'reserved', 'sold']
      });

      if (reset || pageNum === 1) {
        setProducts(response.data);
      } else {
        setProducts(prev => [...prev, ...response.data]);
      }

      setHasMore(response.pagination.has_next);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  // Load initial products
  useEffect(() => {
    loadProducts(1, true);
  }, [loadProducts]);

  // Refresh products when component becomes visible (to update view status)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh the first page to update view status
        loadProducts(1, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instagram-like grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

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