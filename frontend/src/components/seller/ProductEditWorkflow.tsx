import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PhotoManager } from './PhotoManager';
import { ProductForm } from './ProductForm';
import { UpdateProductData, ProductWithDetails } from '../../types/product';
import { productService } from '../../services/product.service';
import { formatPrice } from '../../utils/currency';

interface ProductEditWorkflowProps {
  product: ProductWithDetails;
  onProductUpdated: (product: ProductWithDetails) => void;
  onCancel: () => void;
}

type WorkflowStep = 'photos' | 'form' | 'success';

export function ProductEditWorkflow({ product, onProductUpdated, onCancel }: ProductEditWorkflowProps) {
  const { t } = useTranslation('seller');
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('form');
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(
    new Set(product.photos.map(p => p.id))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedProduct, setUpdatedProduct] = useState<ProductWithDetails | null>(null);

  const handlePhotosSelected = () => {
    if (selectedPhotos.size === 0) {
      alert(t('upload.selectPhotos'));
      return;
    }
    setCurrentStep('form');
  };

  const handleFormSubmit = async (productData: UpdateProductData) => {
    setIsLoading(true);
    setError(null);

    try {
      const updated = await productService.updateProduct(product.id, productData);
      setUpdatedProduct(updated);
      setCurrentStep('success');
      onProductUpdated(updated);
    } catch (err: any) {
      console.error('Failed to update product:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update product. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <nav aria-label={t('workflow.progress')}>
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
              <span className="ml-2 text-sm font-medium">{t('workflow.managePhotosButton')}</span>
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
              <span className="ml-2 text-sm font-medium">{t('workflow.step2')}</span>
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
              <span className="ml-2 text-sm font-medium">{t('workflow.step3')}</span>
            </div>
          </li>
        </ol>
      </nav>
    </div>
  );

  const renderPhotosStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('workflow.managePhotos')}</h2>
        <p className="text-gray-600">
          {t('workflow.managePhotosDescription')}
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
          {t('common:buttons.cancel')}
        </button>
        <button
          onClick={handlePhotosSelected}
          disabled={selectedPhotos.size === 0}
          className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('workflow.continueWith', { count: selectedPhotos.size })}
        </button>
      </div>
    </div>
  );

  const renderFormStep = () => {
    // Convert product data to form initial data
    // Format available_after to date-only string (YYYY-MM-DD) for date input
    const availableAfterDate = product.available_after 
      ? new Date(product.available_after).toISOString().split('T')[0]
      : undefined;
    
    const initialData: Partial<UpdateProductData> = {
      title: product.title,
      description: product.description,
      price: Number(product.price),
      category_ids: product.categories.map(c => c.id),
      available_after: availableAfterDate
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('workflow.editProductDetails')}</h2>
          <p className="text-gray-600">
            {t('workflow.editProductDetailsDescription')}
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

        <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-sm text-blue-800">
            {t('workflow.wantToChangePhotos')}
          </span>
          <button
            onClick={() => setCurrentStep('photos')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {t('workflow.managePhotosButton')}
          </button>
        </div>

        <ProductForm
          initialData={initialData}
          selectedPhotos={Array.from(selectedPhotos)}
          onSubmit={handleFormSubmit}
          onCancel={onCancel}
          isLoading={isLoading}
          submitLabel={t('product.form.updateProduct')}
        />
      </div>
    );
  };

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('workflow.productUpdated')}</h2>
        <p className="text-gray-600">
          {t('workflow.productUpdatedDescription', { title: updatedProduct?.title })}
        </p>
      </div>

      {updatedProduct && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left max-w-md mx-auto">
          <h3 className="font-medium text-gray-900 mb-2">{t('workflow.productSummary')}</h3>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">{t('workflow.summaryTitle')}</dt>
              <dd className="text-gray-900 font-medium">{updatedProduct.title}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t('workflow.summaryPrice')}</dt>
              <dd className="text-gray-900 font-medium">{formatPrice(Number(updatedProduct.price))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t('workflow.summaryStatus')}</dt>
              <dd className="text-gray-900 font-medium capitalize">{updatedProduct.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t('workflow.summaryPhotos')}</dt>
              <dd className="text-gray-900 font-medium">{updatedProduct.photos?.length || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t('workflow.summaryCategories')}</dt>
              <dd className="text-gray-900 font-medium">{updatedProduct.categories?.length || 0}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('workflow.backToProducts')}
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
