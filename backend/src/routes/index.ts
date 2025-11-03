import { Router } from 'express'
import authRoutes from './auth.routes'
import mediaRoutes from './media.routes'
import productRoutes from './product.routes'
import wantListRoutes from './wantList.routes'

const router = Router()

// Mount auth routes
router.use('/auth', authRoutes)

// Mount media routes
router.use('/media', mediaRoutes)

// Mount product routes
router.use('/products', productRoutes)

// Mount want list routes
router.use('/want-lists', wantListRoutes)

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
      },
      products: {
        getProducts: 'GET /api/products',
        getProduct: 'GET /api/products/:id',
        createProduct: 'POST /api/products',
        updateProduct: 'PUT /api/products/:id',
        deleteProduct: 'DELETE /api/products/:id',
        publishProduct: 'POST /api/products/:id/publish',
        unpublishProduct: 'POST /api/products/:id/unpublish',
        getSellerProducts: 'GET /api/products/seller/products'
      },
      wantLists: {
        getBuyerWantList: 'GET /api/want-lists',
        addToWantList: 'POST /api/want-lists/items',
        removeFromWantList: 'DELETE /api/want-lists/items/:id',
        getSellerWantLists: 'GET /api/want-lists/seller',
        cancelWantList: 'DELETE /api/want-lists/seller/:id',
        cleanupEmptyWantLists: 'POST /api/want-lists/seller/cleanup'
      }
    }
  })
})

export default router