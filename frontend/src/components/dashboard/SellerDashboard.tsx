import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PhotoManager } from '../seller/PhotoManager';
import { ProductCreationWorkflow } from '../seller/ProductCreationWorkflow';
import { ProductManagement } from '../seller/ProductManagement';
import { ProductWithDetails } from '../../types/product';

type DashboardView = 'overview' | 'photos' | 'products' | 'orders' | 'create-product';

export function SellerDashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  const handleProductCreated = (product: ProductWithDetails) => {
    console.log('Product created:', product);
    // Could show a success message or redirect to product management
  };

  const renderContent = () => {
    switch (currentView) {
      case 'photos':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Photo Management</h2>
              <button
                onClick={() => setCurrentView('overview')}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            <PhotoManager
              selectedPhotos={selectedPhotos}
              onSelectionChange={setSelectedPhotos}
            />
          </div>
        );
      
      case 'create-product':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Product</h2>
              <button
                onClick={() => setCurrentView('overview')}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            <ProductCreationWorkflow
              onProductCreated={handleProductCreated}
              onCancel={() => setCurrentView('overview')}
            />
          </div>
        );
      
      case 'products':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <ProductManagement onBack={() => setCurrentView('overview')} />
          </div>
        );
      
      case 'orders':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
              <button
                onClick={() => setCurrentView('overview')}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            <div className="text-center py-12">
              <p className="text-gray-500">Order management coming soon...</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Seller Dashboard
            </h1>
            <p className="text-gray-600 mb-6">
              Welcome back, {user?.username}! Manage your products and sales from here.
            </p>
            
            {/* Quick Actions */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentView('create-product')}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Product
                </button>
                <button
                  onClick={() => setCurrentView('photos')}
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Manage Photos
                </button>
              </div>
            </div>

            {/* Main Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setCurrentView('photos')}
                className="bg-indigo-50 hover:bg-indigo-100 p-6 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="font-semibold text-indigo-900">Photos</h3>
                </div>
                <p className="text-sm text-indigo-700">Upload and manage product photos</p>
              </button>
              
              <button
                onClick={() => setCurrentView('products')}
                className="bg-green-50 hover:bg-green-100 p-6 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="font-semibold text-green-900">Products</h3>
                </div>
                <p className="text-sm text-green-700">Manage your product listings</p>
              </button>
              
              <button
                onClick={() => setCurrentView('orders')}
                className="bg-purple-50 hover:bg-purple-100 p-6 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="font-semibold text-purple-900">Orders</h3>
                </div>
                <p className="text-sm text-purple-700">View buyer want lists</p>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
}