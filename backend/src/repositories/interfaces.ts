// Repository interfaces for Turgus marketplace

import {
  SellerAccount,
  BuyerAccount,
  Category,
  Product,
  ProductPhoto,
  ProductView,
  WantList,
  WantListItem,
  ProductComment,
  ProductWithPhotos,
  ProductWithDetails,
  ProductCommentWithAuthor,
  WantListWithItems,
  WantListWithBuyer,
  PaginatedResult,
  PaginationParams
} from '../types/database'

import {
  CreateProduct,
  UpdateProduct,
  ProductFilters,
  BuyerRegistration,
  CreateComment,
  UpdateComment
} from '../schemas/validation'

// Seller Account Repository Interface
export interface ISellerAccountRepository {
  findByUsername(username: string): Promise<SellerAccount | null>
  findById(id: string): Promise<SellerAccount | null>
  verifyPassword(username: string, password: string): Promise<SellerAccount | null>
}

// Buyer Account Repository Interface
export interface IBuyerAccountRepository {
  create(data: BuyerRegistration): Promise<BuyerAccount>
  findById(id: string): Promise<BuyerAccount | null>
  findByEmail(email: string): Promise<BuyerAccount | null>
  update(id: string, data: Partial<BuyerAccount>): Promise<BuyerAccount | null>
  verifyPassword(email: string, password: string): Promise<BuyerAccount | null>
  exists(email: string): Promise<boolean>
}

// Category Repository Interface
export interface ICategoryRepository {
  findAll(): Promise<Category[]>
  findCategoryById(id: string): Promise<Category | null>
  findByIds(ids: string[]): Promise<Category[]>
  findByName(name: string): Promise<Category | null>
}

// Product Repository Interface
export interface IProductRepository {
  create(sellerId: string, data: CreateProduct): Promise<Product>
  findById(id: string): Promise<Product | null>
  findByIdWithDetails(id: string, buyerId?: string): Promise<ProductWithDetails | null>
  update(id: string, data: UpdateProduct): Promise<Product | null>
  delete(id: string): Promise<boolean>
  publish(id: string): Promise<Product | null>
  unpublish(id: string): Promise<Product | null>
  updateStatus(id: string, status: string): Promise<Product | null>
  findBySeller(sellerId: string, pagination: PaginationParams): Promise<PaginatedResult<ProductWithPhotos>>
  findWithFilters(filters: ProductFilters, buyerId?: string): Promise<PaginatedResult<ProductWithPhotos>>
  addCategories(productId: string, categoryIds: string[]): Promise<void>
  removeCategories(productId: string, categoryIds?: string[]): Promise<void>
  getCategories(productId: string): Promise<Category[]>
  recordView(productId: string, buyerId: string): Promise<void>
}

// Product Photo Repository Interface
export interface IProductPhotoRepository {
  create(data: Omit<ProductPhoto, 'id' | 'created_at'>): Promise<ProductPhoto>
  findPhotoById(id: string): Promise<ProductPhoto | null>
  findByIds(ids: string[]): Promise<ProductPhoto[]>
  findByProduct(productId: string): Promise<ProductPhoto[]>
  assignToProduct(photoIds: string[], productId: string): Promise<void>
  unassignFromProduct(photoIds: string[]): Promise<void>
  delete(id: string): Promise<boolean>
  updateSortOrder(photoId: string, sortOrder: number): Promise<void>
  getUnassignedPhotos(olderThanHours?: number): Promise<ProductPhoto[]>
  cleanupUnassignedPhotos(olderThanHours: number): Promise<number>
}

// Product View Repository Interface
export interface IProductViewRepository {
  create(productId: string, buyerId: string): Promise<ProductView>
  findByBuyer(buyerId: string, pagination: PaginationParams): Promise<PaginatedResult<ProductWithPhotos>>
  hasViewed(productId: string, buyerId: string): Promise<boolean>
  getViewCount(productId: string): Promise<number>
}

// Want List Repository Interface
export interface IWantListRepository {
  findOrCreateForBuyer(buyerId: string): Promise<WantList>
  findByBuyer(buyerId: string): Promise<WantListWithItems | null>
  findBySeller(sellerId: string): Promise<WantListWithBuyer[]>
  addItem(buyerId: string, productId: string): Promise<WantListItem>
  removeItem(buyerId: string, productId: string): Promise<boolean>
  removeItemById(itemId: string): Promise<boolean>
  hasItem(buyerId: string, productId: string): Promise<boolean>
  getItemCount(buyerId: string): Promise<number>
  getTotalPrice(buyerId: string): Promise<number>
  cancel(wantListId: string): Promise<boolean>
  complete(wantListId: string): Promise<boolean>
  cleanupEmptyWantLists(): Promise<number>
}

// Product Comment Repository Interface
export interface IProductCommentRepository {
  create(productId: string, authorId: string, authorType: 'buyer' | 'seller', data: CreateComment): Promise<ProductComment>
  findById(id: string): Promise<ProductComment | null>
  findByProduct(productId: string): Promise<ProductCommentWithAuthor[]>
  update(id: string, data: UpdateComment): Promise<ProductComment | null>
  delete(id: string): Promise<boolean>
  moderate(id: string, isModerated: boolean): Promise<ProductComment | null>
  findByAuthor(authorId: string, authorType: 'buyer' | 'seller', pagination: PaginationParams): Promise<PaginatedResult<ProductCommentWithAuthor>>
  getCommentCount(productId: string): Promise<number>
}

// Repository factory interface
export interface IRepositoryFactory {
  sellerAccount: ISellerAccountRepository
  buyerAccount: IBuyerAccountRepository
  category: ICategoryRepository
  product: IProductRepository
  productPhoto: IProductPhotoRepository
  productView: IProductViewRepository
  wantList: IWantListRepository
  productComment: IProductCommentRepository
}