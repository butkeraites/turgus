import { Router } from 'express'
import {
  getDashboardMetrics,
  getOnlineUsersCount,
  getSalesReport,
  trackProductView,
  updateOnlineSession
} from '../controllers/analytics.controller'
import { authenticateToken, requireSeller } from '../utils/auth'

const router = Router()

// Seller analytics routes
router.get('/dashboard', authenticateToken, requireSeller, getDashboardMetrics)
router.get('/online-users', authenticateToken, requireSeller, getOnlineUsersCount)
router.get('/sales-report', authenticateToken, requireSeller, getSalesReport)

// Public tracking routes (no authentication required)
router.post('/track/product/:productId', trackProductView)
router.post('/track/session', updateOnlineSession)

export default router