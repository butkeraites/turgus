import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProductFeed } from '../buyer/ProductFeed';
import { ProductFilters } from '../buyer/ProductFilters';
import { WantList } from '../buyer/WantList';
import { ProductFilters as ProductFiltersType } from '../../types/product';
import { ShoppingBagIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';

type BuyerView = 'browse' | 'wantlist';

export function BuyerDashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<BuyerView>('browse');
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

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setCurrentView('browse')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'browse'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <ViewfinderCircleIcon className="w-5 h-5 mr-2" />
                  Browse Products
                </div>
              </button>
              <button
                onClick={() => setCurrentView('wantlist')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'wantlist'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <ShoppingBagIcon className="w-5 h-5 mr-2" />
                  My Want List
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {currentView === 'browse' ? (
          <>
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
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              My Want List
            </h2>
            <WantList />
          </div>
        )}
      </div>
    </div>
  );
}