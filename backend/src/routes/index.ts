import { Router } from 'express'
import authRoutes from './auth.routes'
import mediaRoutes from './media.routes'

const router = Router()

// Mount auth routes
router.use('/auth', authRoutes)

// Mount media routes
router.use('/media', mediaRoutes)

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
      },
      media: {
        upload: 'POST /api/media/upload',
        getImage: 'GET /api/media/:id',
        getResponsiveInfo: 'GET /api/media/:id/responsive',
        deletePhoto: 'DELETE /api/media/:id',
        getUnassigned: 'GET /api/media/unassigned',
        cleanup: 'POST /api/media/cleanup'
      }
    }
  })
})

export default router