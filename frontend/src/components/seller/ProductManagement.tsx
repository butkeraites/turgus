import { useState } from 'react';
import { ProductList } from './ProductList';
import { ProductCreationWorkflow } from './ProductCreationWorkflow';
import { ProductWithDetails } from '../../types/product';

interface ProductManagementProps {
  onBack: () => void;
}

type ManagementView = 'list' | 'create' | 'edit';

export function ProductManagement({ onBack }: ProductManagementProps) {
  const [currentView, setCurrentView] = useState<ManagementView>('list');
  const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateProduct = () => {
    setCurrentView('create');
  };

  const handleEditProduct = (product: ProductWithDetails) => {
    setEditingProduct(product);
    setCurrentView('edit');
  };

  const handleDeleteProduct = () => {
    // Refresh the product list after deletion
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProductCreated = (product: ProductWithDetails) => {
    console.log('Product created:', product);
    setCurrentView('list');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    if (currentView === 'list') {
      onBack();
    } else {
      setCurrentView('list');
      setEditingProduct(null);
    }
  };

  const renderHeader = () => {
    const titles = {
      list: 'Product Management',
      create: 'Create New Product',
      edit: `Edit Product: ${editingProduct?.title || ''}`
    };

    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{titles[currentView]}</h2>
        <div className="flex items-center space-x-3">
          {currentView === 'list' && (
            <button
              onClick={handleCreateProduct}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Product
            </button>
          )}
          <button
            onClick={handleCancel}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {currentView === 'list' ? 'Back to Dashboard' : 'Back to Products'}
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <ProductCreationWorkflow
            onProductCreated={handleProductCreated}
            onCancel={handleCancel}
          />
        );
      
      case 'edit':
        return (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 text-gray-300 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">Product editing coming soon...</p>
            <p className="text-sm text-gray-400">
              For now, you can delete and recreate products to make changes.
            </p>
          </div>
        );
      
      default:
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <p className="text-lg font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Published</p>
                    <p className="text-lg font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Drafts</p>
                    <p className="text-lg font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Sold</p>
                    <p className="text-lg font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product List */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Your Products</h3>
                <div className="flex items-center space-x-2">
                  <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                    </svg>
                    Filter
                  </button>
                  <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Sort
                  </button>
                </div>
              </div>
              
              <ProductList
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderContent()}
    </div>
  );
}