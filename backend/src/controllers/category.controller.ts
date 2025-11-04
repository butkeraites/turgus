import { Request, Response } from 'express'
import { repositories } from '../repositories'

/**
 * Get all categories
 */
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await repositories.category.findAll()

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving categories'
    })
  }
}

/**
 * Get a single category by ID
 */
export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const category = await repositories.category.findCategoryById(id)
    
    if (!category) {
      res.status(404).json({
        error: 'Category not found',
        message: 'The requested category does not exist'
      })
      return
    }

    res.json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    })
  } catch (error) {
    console.error('Get category error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving the category'
    })
  }
}

/**
 * Create a new category
 */
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, nameEn, namePt } = req.body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        error: 'Invalid input',
        message: 'Category name is required and must be a non-empty string'
      })
      return
    }

    // Check if category already exists
    const existingCategory = await repositories.category.findByName(name.trim())
    if (existingCategory) {
      res.status(409).json({
        error: 'Category already exists',
        message: 'A category with this name already exists',
        data: existingCategory
      })
      return
    }

    // Create the category
    const category = await repositories.category.create({
      name: name.trim(),
      nameEn: nameEn?.trim(),
      namePt: namePt?.trim()
    })

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    })
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while creating the category'
    })
  }
}