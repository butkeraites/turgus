import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProductFeed } from '../buyer/ProductFeed';
import { ProductFilters } from '../buyer/ProductFilters';
import { WantList } from '../buyer/WantList';
import { ProductFilters as ProductFiltersType } from '../../types/product';
import { Container } from '../layout/Container';
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
    <div className="min-h-screen-mobile bg-gray-50">
      <Container className="py-4 md:py-8">
        {/* Welcome Header - Hidden on mobile to save space */}
        <div className="hidden md:block bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Discover amazing products in our marketplace
          </p>
        </div>

        {/* Navigation Tabs - Mobile optimized */}
        <div className="bg-white rounded-lg shadow mb-4 md:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex px-4 md:px-6">
              <button
                onClick={() => setCurrentView('browse')}
                className={`flex-1 md:flex-none py-3 md:py-4 px-1 border-b-2 font-medium text-sm touch-manipulation ${
                  currentView === 'browse'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center md:justify-start">
                  <ViewfinderCircleIcon className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Browse Products</span>
                  <span className="sm:hidden">Browse</span>
                </div>
              </button>
              <button
                onClick={() => setCurrentView('wantlist')}
                className={`flex-1 md:flex-none py-3 md:py-4 px-1 border-b-2 font-medium text-sm touch-manipulation ${
                  currentView === 'wantlist'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center md:justify-start">
                  <ShoppingBagIcon className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">My Want List</span>
                  <span className="sm:hidden">Want List</span>
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
            <div className="bg-white rounded-lg shadow p-3 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
                Browse Products
              </h2>
              <ProductFeed filters={filters} />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-3 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
              My Want List
            </h2>
            <WantList />
          </div>
        )}
      </Container>
    </div>
  );
}