// Database entity types for Turgus marketplace

// Enum types
export type ProductStatus = 'draft' | 'available' | 'reserved' | 'sold'
export type WantListStatus = 'active' | 'completed' | 'cancelled'
export type Language = 'pt' | 'en'
export type AuthorType = 'buyer' | 'seller'

// Seller Account interface
export interface SellerAccount {
  id: string
  username: string
  password_hash: string
  created_at: Date
  updated_at: Date
}

// Buyer Account interface
export interface BuyerAccount {
  id: string
  name: string
  telephone: string
  address: string
  email?: string
  password_hash: string
  language: Language
  created_at: Date
  updated_at: Date
}

// Category interface
export interface Category {
  id: string
  name: string
  name_en: string
  name_pt: string
  created_at: Date
}

// Product interface
export interface Product {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  status: ProductStatus
  available_after: Date
  created_at: Date
  updated_at: Date
  published_at?: Date
}

// Product Photo interface
export interface ProductPhoto {
  id: string
  product_id?: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  sort_order: number
  created_at: Date
}

// Product Category junction interface
export interface ProductCategory {
  id: string
  product_id: string
  category_id: string
  created_at: Date
}

// Product View interface
export interface ProductView {
  id: string
  product_id: string
  buyer_id: string
  viewed_at: Date
}

// Want List interface
export interface WantList {
  id: string
  buyer_id: string
  status: WantListStatus
  created_at: Date
  updated_at: Date
}

// Want List Item interface
export interface WantListItem {
  id: string
  want_list_id: string
  product_id: string
  added_at: Date
}

// Product Comment interface
export interface ProductComment {
  id: string
  product_id: string
  author_id: string
  author_type: AuthorType
  parent_comment_id?: string
  content: string
  is_moderated: boolean
  created_at: Date
  updated_at: Date
}

// Extended interfaces with relations (for API responses)
export interface ProductWithPhotos extends Product {
  photos: ProductPhoto[]
  categories: Category[]
  is_viewed?: boolean
}

export interface ProductWithDetails extends ProductWithPhotos {
  seller: Pick<SellerAccount, 'id' | 'username'>
}

export interface WantListWithItems extends WantList {
  items: (WantListItem & {
    product: ProductWithPhotos
  })[]
  total_price: number
  item_count: number
}

export interface WantListWithBuyer extends WantListWithItems {
  buyer: Pick<BuyerAccount, 'id' | 'name' | 'telephone' | 'address'>
}

export interface ProductCommentWithAuthor extends ProductComment {
  author_name: string
  replies?: ProductCommentWithAuthor[]
}

export interface ProductWithComments extends ProductWithDetails {
  comments: ProductCommentWithAuthor[]
}

// Database query result types
export interface DatabaseResult<T = any> {
  rows: T[]
  rowCount: number
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}