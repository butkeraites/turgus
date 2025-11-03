import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProductFeed } from '../buyer/ProductFeed';
import { ProductFilters } from '../buyer/ProductFilters';
import { ProductFilters as ProductFiltersType } from '../../types/product';

export function BuyerDashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ProductFiltersType>({
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Discover amazing products in our marketplace
          </p>
        </div>

        {/* Filters */}
        <ProductFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
        />

        {/* Product Feed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Browse Products
          </h2>
          <ProductFeed filters={filters} />
        </div>
      </div>
    </div>
  );
}