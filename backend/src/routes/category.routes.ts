import { Router } from 'express'
import { getCategories, getCategory } from '../controllers/category.controller'

const router = Router()

// GET /api/categories - Get all categories
router.get('/', getCategories)

// GET /api/categories/:id - Get single category
router.get('/:id', getCategory)

export default router