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