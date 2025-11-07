// Product related types

export type ProductStatus = 'draft' | 'available' | 'reserved' | 'sold';

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  namePt: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  status: ProductStatus;
  availableAfter: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ProductPhoto {
  id: string;
  productId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  sortOrder: number;
  createdAt: string;
}

export interface ProductWithDetails extends Product {
  photos: ProductPhoto[];
  categories: Category[];
  isViewed?: boolean;
  is_viewed?: boolean; // Backend returns this field name
}

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  category_ids: string[];
  photo_ids: string[];
  available_after?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface ProductFilters {
  category_ids?: string[];
  status?: ProductStatus[];
  min_price?: number;
  max_price?: number;
  search?: string;
  sort_by?: 'created_at' | 'price' | 'title';
  sort_order?: 'asc' | 'desc';
  viewed?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  data: ProductWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}