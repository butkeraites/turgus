import { Router } from 'express'
import {
  getBuyerWantList,
  addToWantList,
  removeFromWantList,
  getSellerWantLists,
  cancelWantList,
  completeWantList,
  completeBuyerWantList,
  cleanupEmptyWantLists,
  getBuyerQueuePosition,
  getBuyerAllQueuePositions,
  getProductInterestQueue
} from '../controllers/wantList.controller'
import { authenticateToken, requireBuyer, requireSeller } from '../utils/auth'

const router = Router()

// Buyer routes (authentication + buyer role required)
router.get('/', authenticateToken, requireBuyer, getBuyerWantList) // Get buyer's want list
router.post('/items', authenticateToken, requireBuyer, addToWantList) // Add product to want list
router.delete('/items/:id', authenticateToken, requireBuyer, removeFromWantList) // Remove product from want list
router.post('/complete', authenticateToken, requireBuyer, completeBuyerWantList) // Complete buyer's own want list
router.get('/queue/position/:productId', authenticateToken, requireBuyer, getBuyerQueuePosition) // Get position in queue for a product
router.get('/queue/positions', authenticateToken, requireBuyer, getBuyerAllQueuePositions) // Get all queue positions

// Seller routes (authentication + seller role required)
router.get('/seller', authenticateToken, requireSeller, getSellerWantLists) // Get all want lists for seller
router.get('/seller/products/:productId/queue', authenticateToken, requireSeller, getProductInterestQueue) // Get interest queue for a product
router.delete('/seller/:id', authenticateToken, requireSeller, cancelWantList) // Cancel want list
router.post('/seller/:id/complete', authenticateToken, requireSeller, completeWantList) // Complete want list
router.post('/seller/cleanup', authenticateToken, requireSeller, cleanupEmptyWantLists) // Cleanup empty want lists

export default router