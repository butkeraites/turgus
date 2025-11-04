import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryMultiSelect } from './CategoryMultiSelect';
import { CreateProductData } from '../../types/product';

interface ProductFormProps {
  initialData?: Partial<CreateProductData>;
  selectedPhotos: string[];
  onSubmit: (data: CreateProductData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  category_ids: string[];
}

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  category_ids?: string;
  photo_ids?: string;
}

export function ProductForm({
  initialData,
  selectedPhotos,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel
}: ProductFormProps) {
  const { t } = useTranslation('seller');
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    category_ids: initialData?.category_ids || []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = t('product.form.title') + ' ' + t('common:forms.required');
    } else if (formData.title.length > 255) {
      newErrors.title = t('common:forms.tooLong');
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = t('product.form.description') + ' ' + t('common:forms.required');
    }

    // Price validation
    if (!formData.price.trim()) {
      newErrors.price = t('product.form.price') + ' ' + t('common:forms.required');
    } else {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        newErrors.price = t('common:forms.invalid');
      }
    }

    // Categories validation
    if (formData.category_ids.length === 0) {
      newErrors.category_ids = t('product.form.categories') + ' ' + t('common:forms.required');
    }

    // Photos validation
    if (selectedPhotos.length === 0) {
      newErrors.photo_ids = 'At least one photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const productData: CreateProductData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category_ids: formData.category_ids,
        photo_ids: selectedPhotos
      };

      await onSubmit(productData);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatPrice = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return cleaned;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPrice(e.target.value);
    handleInputChange('price', formatted);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          {t('product.form.title')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={t('product.form.title')}
          maxLength={255}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        <p className="mt-1 text-xs text-gray-500">
          {formData.title.length}/255 characters
        </p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          {t('product.form.description')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={t('product.form.description')}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          {t('product.form.price')} (R$) <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">R$</span>
          </div>
          <input
            type="text"
            id="price"
            value={formData.price}
            onChange={handlePriceChange}
            className={`block w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
        </div>
        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
      </div>

      {/* Categories */}
      <CategoryMultiSelect
        selectedCategories={formData.category_ids}
        onSelectionChange={(categoryIds) => handleInputChange('category_ids', categoryIds)}
        error={errors.category_ids}
        required
      />

      {/* Selected Photos Summary */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('upload.selectedCount', { count: selectedPhotos.length })} <span className="text-red-500">*</span>
        </label>
        <div className={`mt-1 p-3 border rounded-md ${
          errors.photo_ids ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
        }`}>
          {selectedPhotos.length === 0 ? (
            <p className="text-sm text-gray-500">{t('upload.selectedCount', { count: 0 })}</p>
          ) : (
            <p className="text-sm text-gray-700">
              {t('upload.selectedCount', { count: selectedPhotos.length })}
            </p>
          )}
        </div>
        {errors.photo_ids && <p className="mt-1 text-sm text-red-600">{errors.photo_ids}</p>}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common:buttons.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {(isSubmitting || isLoading) && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {submitLabel || t('product.form.createProduct')}
        </button>
      </div>
    </form>
  );
}