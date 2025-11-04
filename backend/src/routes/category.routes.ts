import { Router } from 'express'
import { getCategories, getCategory, createCategory } from '../controllers/category.controller'
import { authenticateToken, requireSeller } from '../middleware/auth'

const router = Router()

// GET /api/categories - Get all categories
router.get('/', getCategories)

// POST /api/categories - Create new category (seller only)
router.post('/', authenticateToken, requireSeller, createCategory)

// GET /api/categories/:id - Get single category
router.get('/:id', getCategory)

export default router