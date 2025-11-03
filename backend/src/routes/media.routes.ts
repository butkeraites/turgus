import { Router } from 'express'
import { mediaController } from '../controllers/media.controller'
import { uploadMultiple, handleUploadError } from '../middleware/upload'
import { authenticateToken, requireSeller } from '../middleware/auth'

const router = Router()

// POST /api/media/upload - Upload multiple photos (seller only)
router.post('/upload',
  authenticateToken,
  requireSeller,
  uploadMultiple,
  handleUploadError,
  mediaController.uploadPhotos.bind(mediaController)
)

// GET /api/media/unassigned - Get unassigned photos (seller only)
router.get('/unassigned',
  authenticateToken,
  requireSeller,
  mediaController.getUnassignedPhotos.bind(mediaController)
)

// POST /api/media/cleanup - Cleanup old unassigned photos (seller only)
router.post('/cleanup',
  authenticateToken,
  requireSeller,
  mediaController.cleanupUnassignedPhotos.bind(mediaController)
)

// GET /api/media/:id/responsive - Get responsive image information (public)
router.get('/:id/responsive',
  mediaController.getResponsiveImageInfo.bind(mediaController)
)

// GET /api/media/:id - Get optimized image (public)
router.get('/:id',
  mediaController.getImage.bind(mediaController)
)

// DELETE /api/media/:id - Delete photo (seller only)
router.delete('/:id',
  authenticateToken,
  requireSeller,
  mediaController.deletePhoto.bind(mediaController)
)

export default router