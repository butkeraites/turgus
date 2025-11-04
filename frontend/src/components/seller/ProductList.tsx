import { useState, useEffect } from 'react';
import { ProductWithDetails } from '../../types/product';
import { productService } from '../../services/product.service';
import { mediaService } from '../../services/media.service';
import { formatPrice } from '../../utils/currency';

interface ProductListProps {
  onEditProduct: (product: ProductWithDetails) => void;
  onDeleteProduct: (productId: string) => void;
  refreshTrigger?: number;
}

export function ProductList({ onEditProduct, onDeleteProduct, refreshTrigger }: ProductListProps) {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  const loadProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result = await productService.getSellerProducts(page, 10);
      setProducts(result.data);
      setCurrentPage(result.pagination.page);
      setTotalPages(result.pagination.total_pages);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1);
  }, [refreshTrigger]);

  const handlePublishToggle = async (product: ProductWithDetails) => {
    const productId = product.id;
    setActionLoading(prev => new Set(prev).add(productId));

    try {
      let updatedProduct: ProductWithDetails;
      
      if (product.status === 'draft') {
        updatedProduct = await productService.publishProduct(productId);
      } else {
        updatedProduct = await productService.unpublishProduct(productId);
      }

      // Update the product in the list
      setProducts(prev => 
        prev.map(p => p.id === productId ? updatedProduct : p)
      );
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      alert('Failed to update product status. Please try again.');
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleDelete = async (product: ProductWithDetails) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.title}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    const productId = product.id;
    setActionLoading(prev => new Set(prev).add(productId));

    try {
      await productService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      onDeleteProduct(productId);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      available: { color: 'bg-green-100 text-green-800', label: 'Available' },
      reserved: { color: 'bg-yellow-100 text-yellow-800', label: 'Reserved' },
      sold: { color: 'bg-red-100 text-red-800', label: 'Sold' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-600">Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 text-red-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => loadProducts(currentPage)}
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
        <div className="mx-auto w-16 h-16 text-gray-300 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p className="text-gray-500 mb-2">No products found</p>
        <p className="text-sm text-gray-400">Create your first product to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const isActionLoading = actionLoading.has(product.id);
          const primaryPhoto = product.photos[0];
          
          return (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100">
                {primaryPhoto ? (
                  <img
                    src={mediaService.getPhotoUrl(primaryPhoto.id, 'medium')}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                    {product.title}
                  </h3>
                  {getStatusBadge(product.status)}
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(product.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{product.photos.length} photo{product.photos.length !== 1 ? 's' : ''}</span>
                  <span>{product.categories.length} categor{product.categories.length !== 1 ? 'ies' : 'y'}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditProduct(product)}
                    disabled={isActionLoading}
                    className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handlePublishToggle(product)}
                    disabled={isActionLoading}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      product.status === 'draft'
                        ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                    }`}
                  >
                    {isActionLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      product.status === 'draft' ? 'Publish' : 'Unpublish'
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(product)}
                    disabled={isActionLoading}
                    className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActionLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => loadProducts(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => loadProducts(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => loadProducts(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => loadProducts(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}