import { z } from 'zod'

// Enum schemas
export const ProductStatusSchema = z.enum(['draft', 'available', 'reserved', 'sold'])
export const WantListStatusSchema = z.enum(['active', 'completed', 'cancelled'])
export const LanguageSchema = z.enum(['pt', 'en'])

// UUID schema
export const UUIDSchema = z.string().uuid()

// Seller Account schemas
export const SellerAccountSchema = z.object({
  id: UUIDSchema,
  username: z.string().min(1).max(255),
  password_hash: z.string().min(1),
  created_at: z.date(),
  updated_at: z.date()
})

export const SellerLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

// Buyer Account schemas
export const BuyerAccountSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  telephone: z.string().min(1).max(50),
  address: z.string().min(1),
  email: z.string().email().optional(),
  password_hash: z.string().min(1),
  language: LanguageSchema,
  created_at: z.date(),
  updated_at: z.date()
})

export const BuyerRegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  telephone: z.string().min(1, 'Telephone is required').max(50, 'Telephone too long'),
  address: z.string().min(1, 'Address is required'),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  language: LanguageSchema.default('pt')
})

export const BuyerLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

// Category schemas
export const CategorySchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  name_en: z.string().min(1).max(255),
  name_pt: z.string().min(1).max(255),
  created_at: z.date()
})

// Product schemas
export const ProductSchema = z.object({
  id: UUIDSchema,
  seller_id: UUIDSchema,
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  price: z.number().positive('Price must be positive'),
  status: ProductStatusSchema,
  created_at: z.date(),
  updated_at: z.date(),
  published_at: z.date().optional()
})

export const CreateProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  category_ids: z.array(UUIDSchema).min(1, 'At least one category is required'),
  photo_ids: z.array(UUIDSchema).min(1, 'At least one photo is required')
})

export const UpdateProductSchema = CreateProductSchema.partial()

// Product Photo schemas
export const ProductPhotoSchema = z.object({
  id: UUIDSchema,
  product_id: UUIDSchema.optional(),
  filename: z.string().min(1),
  original_name: z.string().min(1),
  mime_type: z.string().regex(/^image\/(jpeg|png|webp)$/, 'Invalid image type'),
  size: z.number().positive(),
  sort_order: z.number().int().min(0),
  created_at: z.date()
})

export const UploadPhotoSchema = z.object({
  files: z.array(z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string().regex(/^image\/(jpeg|png|webp)$/, 'Invalid image type'),
    size: z.number().max(300 * 1024 * 1024, 'File too large (max 300MB)'),
    buffer: z.instanceof(Buffer)
  })).min(1, 'At least one file is required')
})

// Product View schemas
export const ProductViewSchema = z.object({
  id: UUIDSchema,
  product_id: UUIDSchema,
  buyer_id: UUIDSchema,
  viewed_at: z.date()
})

// Want List schemas
export const WantListSchema = z.object({
  id: UUIDSchema,
  buyer_id: UUIDSchema,
  status: WantListStatusSchema,
  created_at: z.date(),
  updated_at: z.date()
})

export const WantListItemSchema = z.object({
  id: UUIDSchema,
  want_list_id: UUIDSchema,
  product_id: UUIDSchema,
  added_at: z.date()
})

export const AddToWantListSchema = z.object({
  product_id: UUIDSchema
})

// Query parameter schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export const ProductFiltersSchema = z.object({
  category_ids: z.array(UUIDSchema).optional(),
  status: z.array(ProductStatusSchema).optional(),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'price', 'title']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  viewed: z.coerce.boolean().optional()
}).merge(PaginationSchema)

// API Response schemas
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }),
  timestamp: z.string(),
  path: z.string()
})

export const ApiSuccessSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional()
})

// JWT payload schema
export const JWTPayloadSchema = z.object({
  user_id: UUIDSchema,
  user_type: z.enum(['seller', 'buyer']),
  username: z.string().optional(),
  iat: z.number(),
  exp: z.number()
})

// Export type inference helpers
export type SellerLogin = z.infer<typeof SellerLoginSchema>
export type BuyerRegistration = z.infer<typeof BuyerRegistrationSchema>
export type BuyerLogin = z.infer<typeof BuyerLoginSchema>
export type CreateProduct = z.infer<typeof CreateProductSchema>
export type UpdateProduct = z.infer<typeof UpdateProductSchema>
export type ProductFilters = z.infer<typeof ProductFiltersSchema>
export type AddToWantList = z.infer<typeof AddToWantListSchema>
export type JWTPayload = z.infer<typeof JWTPayloadSchema>
export type ApiError = z.infer<typeof ApiErrorSchema>
export type ApiSuccess = z.infer<typeof ApiSuccessSchema>