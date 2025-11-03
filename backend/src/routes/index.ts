import { Router } from 'express'
import authRoutes from './auth.routes'

const router = Router()

// Mount auth routes
router.use('/auth', authRoutes)

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Turgus API Server',
    version: '1.0.0',
    endpoints: {
      auth: {
        sellerLogin: 'POST /api/auth/seller/login',
        buyerRegister: 'POST /api/auth/buyer/register',
        buyerLogin: 'POST /api/auth/buyer/login',
        getCurrentUser: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
      }
    }
  })
})

export default router