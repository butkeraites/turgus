import { Router } from 'express'
import { sellerLogin, buyerRegister, buyerLogin, getCurrentUser, logout } from '../controllers/auth.controller'
import { authenticateToken } from '../utils/auth'

const router = Router()

// Seller authentication
router.post('/seller/login', sellerLogin)

// Buyer authentication
router.post('/buyer/register', buyerRegister)
router.post('/buyer/login', buyerLogin)

// Protected routes
router.get('/me', authenticateToken, getCurrentUser)
router.post('/logout', logout)

export default router