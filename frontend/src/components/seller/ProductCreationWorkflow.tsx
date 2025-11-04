import { useState } from 'react';
import { PhotoManager } from './PhotoManager';
import { ProductForm } from './ProductForm';
import { CreateProductData, ProductWithDetails } from '../../types/product';
import { productService } from '../../services/product.service';

interface ProductCreationWorkflowProps {
  onProductCreated: (product: ProductWithDetails) => void;
  onCancel: () => void;
  preSelectedPhotos?: Set<string>;
}

type WorkflowStep = 'photos' | 'form' | 'success';

export function ProductCreationWorkflow({ onProductCreated, onCancel, preSelectedPhotos }: ProductCreationWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(preSelectedPhotos && preSelectedPhotos.size > 0 ? 'form' : 'photos');
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(preSelectedPhotos || new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<ProductWithDetails | null>(null);

  const handlePhotosSelected = () => {
    if (selectedPhotos.size === 0) {
      alert('Please select at least one photo before proceeding.');
      return;
    }
    setCurrentStep('form');
  };

  const handleBackToPhotos = () => {
    setCurrentStep('photos');
    setError(null);
  };

  const handleFormSubmit = async (productData: CreateProductData) => {
    setIsLoading(true);
    setError(null);

    try {
      const product = await productService.createProduct(productData);
      setCreatedProduct(product);
      setCurrentStep('success');
      onProductCreated(product);
    } catch (err: any) {
      console.error('Failed to create product:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create product. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep('photos');
    setSelectedPhotos(new Set());
    setCreatedProduct(null);
    setError(null);
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          <li className="relative">
            <div className={`flex items-center ${
              currentStep === 'photos' ? 'text-indigo-600' : 'text-green-600'
            }`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep === 'photos' 
                  ? 'border-indigo-600 bg-indigo-600 text-white' 
                  : 'border-green-600 bg-green-600 text-white'
              }`}>
                {currentStep === 'photos' ? '1' : '✓'}
              </div>
              <span className="ml-2 text-sm font-medium">Select Photos</span>
            </div>
          </li>
          
          <div className="flex-1 mx-4">
            <div className={`h-0.5 ${
              ['form', 'success'].includes(currentStep) ? 'bg-green-600' : 'bg-gray-300'
            }`} />
          </div>
          
          <li className="relative">
            <div className={`flex items-center ${
              currentStep === 'form' 
                ? 'text-indigo-600' 
                : currentStep === 'success' 
                ? 'text-green-600' 
                : 'text-gray-500'
            }`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep === 'form'
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : currentStep === 'success'
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white text-gray-500'
              }`}>
                {currentStep === 'success' ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Product Details</span>
            </div>
          </li>
          
          <div className="flex-1 mx-4">
            <div className={`h-0.5 ${
              currentStep === 'success' ? 'bg-green-600' : 'bg-gray-300'
            }`} />
          </div>
          
          <li className="relative">
            <div className={`flex items-center ${
              currentStep === 'success' ? 'text-green-600' : 'text-gray-500'
            }`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep === 'success'
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white text-gray-500'
              }`}>
                {currentStep === 'success' ? '✓' : '3'}
              </div>
              <span className="ml-2 text-sm font-medium">Complete</span>
            </div>
          </li>
        </ol>
      </nav>
    </div>
  );

  const renderPhotosStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Product Photos</h2>
        <p className="text-gray-600">
          Choose the photos you want to include with your product listing.
        </p>
      </div>

      <PhotoManager
        selectedPhotos={selectedPhotos}
        onSelectionChange={setSelectedPhotos}
        showUploader={true}
      />

      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          onClick={handlePhotosSelected}
          disabled={selectedPhotos.size === 0}
          className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );

  const renderFormStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Details</h2>
        <p className="text-gray-600">
          Add title, description, price, and categories for your product.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <ProductForm
        selectedPhotos={Array.from(selectedPhotos)}
        onSubmit={handleFormSubmit}
        onCancel={handleBackToPhotos}
        isLoading={isLoading}
        submitLabel="Create Product"
      />
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Created Successfully!</h2>
        <p className="text-gray-600">
          Your product "{createdProduct?.title}" has been created as a draft.
        </p>
      </div>

      {createdProduct && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left max-w-md mx-auto">
          <h3 className="font-medium text-gray-900 mb-2">Product Summary</h3>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Title:</dt>
              <dd className="text-gray-900 font-medium">{createdProduct.title}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Price:</dt>
              <dd className="text-gray-900 font-medium">€{Number(createdProduct.price).toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status:</dt>
              <dd className="text-gray-900 font-medium capitalize">{createdProduct.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Photos:</dt>
              <dd className="text-gray-900 font-medium">{createdProduct.photos?.length || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Categories:</dt>
              <dd className="text-gray-900 font-medium">{createdProduct.categories?.length || 0}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handleStartOver}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Another Product
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}
      
      <div className="bg-white rounded-lg shadow p-6">
        {currentStep === 'photos' && renderPhotosStep()}
        {currentStep === 'form' && renderFormStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
}