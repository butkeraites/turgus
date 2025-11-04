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
  recordProductView,
  batchPublishProducts
} from '../controllers/product.controller'
import { authenticateToken, requireSeller, optionalAuth } from '../utils/auth'

const router = Router()

// Seller dashboard routes (must be before /:id routes)
router.get('/seller', authenticateToken, requireSeller, getSellerProducts) // Get seller's products
router.post('/batch/publish', authenticateToken, requireSeller, batchPublishProducts) // Batch publish products

// Public routes (optional authentication for enhanced features)
router.get('/', optionalAuth, getProducts) // Get products with filtering and pagination
router.get('/:id', optionalAuth, getProduct) // Get single product by ID

// Buyer routes (authentication required)
router.post('/:id/view', authenticateToken, recordProductView) // Record product view

// Seller-only routes (authentication + seller role required)
router.post('/', authenticateToken, requireSeller, createProduct) // Create product
router.put('/:id', authenticateToken, requireSeller, updateProduct) // Update product
router.delete('/:id', authenticateToken, requireSeller, deleteProduct) // Delete product
router.post('/:id/publish', authenticateToken, requireSeller, publishProduct) // Publish product
router.post('/:id/unpublish', authenticateToken, requireSeller, unpublishProduct) // Unpublish product

export default router