// Product related types

export type ProductStatus = 'draft' | 'available' | 'reserved' | 'sold';

export interface Category {
  id: string;
  name: string;
  name_en: string;
  name_pt: string;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  status: ProductStatus;
  available_after: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface ProductPhoto {
  id: string;
  product_id?: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  sort_order: number;
  created_at: string;
}

export interface ProductWithDetails extends Product {
  photos: ProductPhoto[];
  categories: Category[];
  seller?: {
    id: string;
    username: string;
  };
  is_viewed?: boolean;
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