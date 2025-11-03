import { useState, useEffect } from 'react';
import { ProductFilters as ProductFiltersType, Category } from '../../types/product';
import { productService } from '../../services/product.service';
import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface ProductFiltersProps {
  filters: ProductFiltersType;
  onFiltersChange: (filters: ProductFiltersType) => void;
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await productService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentCategories = filters.category_ids || [];
    let newCategories: string[];

    if (checked) {
      newCategories = [...currentCategories, categoryId];
    } else {
      newCategories = currentCategories.filter(id => id !== categoryId);
    }

    onFiltersChange({
      ...filters,
      category_ids: newCategories.length > 0 ? newCategories : undefined
    });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = filters.status || [];
    let newStatuses: string[];

    if (checked) {
      newStatuses = [...currentStatuses, status];
    } else {
      newStatuses = currentStatuses.filter(s => s !== status);
    }

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses as any : undefined
    });
  };

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    onFiltersChange({
      ...filters,
      sort_by: sortBy as any,
      sort_order: sortOrder as any
    });
  };

  const handleViewedChange = (viewed: boolean | undefined) => {
    onFiltersChange({
      ...filters,
      viewed
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      sort_by: 'created_at',
      sort_order: 'desc'
    });
  };

  const hasActiveFilters = () => {
    return !!(
      filters.category_ids?.length ||
      filters.status?.length ||
      filters.viewed !== undefined ||
      filters.sort_by !== 'created_at' ||
      filters.sort_order !== 'desc'
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            <FunnelIcon className="w-5 h-5" />
            <span className="font-medium">Filters & Sort</span>
            <ChevronDownIcon 
              className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {showFilters && (
        <div className="p-4 space-y-6">
          {/* Sort Options */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSortChange('created_at', 'desc')}
                className={`p-2 text-sm rounded-md border ${
                  filters.sort_by === 'created_at' && filters.sort_order === 'desc'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => handleSortChange('created_at', 'asc')}
                className={`p-2 text-sm rounded-md border ${
                  filters.sort_by === 'created_at' && filters.sort_order === 'asc'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Oldest First
              </button>
              <button
                onClick={() => handleSortChange('price', 'asc')}
                className={`p-2 text-sm rounded-md border ${
                  filters.sort_by === 'price' && filters.sort_order === 'asc'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Price: Low to High
              </button>
              <button
                onClick={() => handleSortChange('price', 'desc')}
                className={`p-2 text-sm rounded-md border ${
                  filters.sort_by === 'price' && filters.sort_order === 'desc'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Price: High to Low
              </button>
            </div>
          </div>

          {/* Status Filters */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Status</h3>
            <div className="space-y-2">
              {[
                { value: 'available', label: 'Available' },
                { value: 'reserved', label: 'Reserved' },
                { value: 'sold', label: 'Sold' }
              ].map((status) => (
                <label key={status.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status.value as any) || false}
                    onChange={(e) => handleStatusChange(status.value, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Viewed Status */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Viewed Status</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="viewed"
                  checked={filters.viewed === undefined}
                  onChange={() => handleViewedChange(undefined)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">All Products</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="viewed"
                  checked={filters.viewed === true}
                  onChange={() => handleViewedChange(true)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Viewed Only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="viewed"
                  checked={filters.viewed === false}
                  onChange={() => handleViewedChange(false)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Not Viewed</span>
              </label>
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.category_ids?.includes(category.id) || false}
                      onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}