import { Router } from 'express'
import {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  publishProduct,
  unpublishProduct,
  getProducts,
  getSellerProducts,
  recordProductView
} from '../controllers/product.controller'
import { authenticateToken, requireSeller } from '../utils/auth'

const router = Router()

// Public routes (no authentication required)
router.get('/', getProducts) // Get products with filtering and pagination
router.get('/:id', getProduct) // Get single product by ID

// Buyer routes (authentication required)
router.post('/:id/view', authenticateToken, recordProductView) // Record product view

// Seller-only routes (authentication + seller role required)
router.post('/', authenticateToken, requireSeller, createProduct) // Create product
router.put('/:id', authenticateToken, requireSeller, updateProduct) // Update product
router.delete('/:id', authenticateToken, requireSeller, deleteProduct) // Delete product
router.post('/:id/publish', authenticateToken, requireSeller, publishProduct) // Publish product
router.post('/:id/unpublish', authenticateToken, requireSeller, unpublishProduct) // Unpublish product

// Seller dashboard routes
router.get('/seller/products', authenticateToken, requireSeller, getSellerProducts) // Get seller's products

export default router