import { useState, useEffect, useRef } from 'react';
import { Category } from '../../types/product';
import { productService } from '../../services/product.service';

interface CategoryMultiSelectProps {
  selectedCategories: string[];
  onSelectionChange: (categoryIds: string[]) => void;
  error?: string;
  required?: boolean;
}

export function CategoryMultiSelect({ 
  selectedCategories, 
  onSelectionChange, 
  error,
  required = false 
}: CategoryMultiSelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const fetchedCategories = await productService.getCategories();
      console.log('Loaded categories:', fetchedCategories);
      setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);

    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newSelection = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredCategories.map(cat => cat.id));
    }
  };

  const handleCreateCategory = async (name: string) => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const newCategory = await productService.createCategory({ name });
      
      // Add the new category to the list
      setCategories(prev => [newCategory, ...prev]);
      
      // Auto-select the new category
      onSelectionChange([...selectedCategories, newCategory.id]);
      
      // Clear search and close dropdown
      setSearchTerm('');
      setIsOpen(false);
      
      // Show success message (optional)
      console.log('Category created successfully:', newCategory);
    } catch (error: any) {
      console.error('Failed to create category:', error);
      
      // Handle the case where category already exists
      if (error.response?.status === 409) {
        const existingCategory = error.response.data.data;
        if (existingCategory && !selectedCategories.includes(existingCategory.id)) {
          onSelectionChange([...selectedCategories, existingCategory.id]);
          setSearchTerm('');
          setIsOpen(false);
        }
      } else {
        alert('Failed to create category. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };



  const filteredCategories = (categories || []).filter(category => {
    if (!category || typeof category.name !== 'string') return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      category.name.toLowerCase().includes(searchLower) ||
      (category.nameEn && category.nameEn.toLowerCase().includes(searchLower)) ||
      (category.namePt && category.namePt.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Categories {required && <span className="text-red-500">*</span>}
        </label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700">
        Categories {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Selected Categories Display / Trigger */}
      <div
        className={`
          relative w-full min-h-[2.5rem] px-3 py-2 border rounded-md cursor-pointer
          transition-colors duration-200
          ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-500' : ''}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedCategories.length === 0 ? (
              <span className="text-gray-500">Select categories...</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedCategories.slice(0, 3).map(categoryId => {
                  const category = categories.find(cat => cat.id === categoryId);
                  return category ? (
                    <span
                      key={categoryId}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {category.name}
                    </span>
                  ) : null;
                })}
                {selectedCategories.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    +{selectedCategories.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Select All */}
          <div className="p-3 border-b border-gray-200">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {selectedCategories.length === filteredCategories.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Category List */}
          <div className="max-h-40 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="p-3">
                <div className="text-sm text-gray-500 text-center mb-3">
                  No categories found
                </div>
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => handleCreateCategory(searchTerm.trim())}
                    disabled={isCreating}
                    className="w-full px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCreating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>Create "{searchTerm.trim()}" category</>
                    )}
                  </button>
                )}
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                      {(category.nameEn !== category.name || category.namePt !== category.name) && (
                        <div className="text-xs text-gray-500">
                          {[category.nameEn, category.namePt]
                            .filter(name => name !== category.name)
                            .join(' • ')}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Selection Summary */}
      {selectedCategories.length > 0 && (
        <p className="text-xs text-gray-500">
          {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
        </p>
      )}
    </div>
  );
}