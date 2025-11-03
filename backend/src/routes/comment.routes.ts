import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  createComment,
  getProductComments,
  updateComment,
  deleteComment,
  moderateComment
} from '../controllers/comment.controller'

const router = Router()

// Product comment routes
router.post('/products/:productId/comments', authenticateToken, createComment)
router.get('/products/:productId/comments', getProductComments)
router.put('/comments/:commentId', authenticateToken, updateComment)
router.delete('/comments/:commentId', authenticateToken, deleteComment)
router.patch('/comments/:commentId/moderate', authenticateToken, moderateComment)

export default router