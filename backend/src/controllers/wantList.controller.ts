import { Response } from 'express'
import { AuthenticatedRequest } from '../utils/auth'
import { repositories } from '../repositories'
import { AddToWantListSchema, UUIDSchema } from '../schemas/validation'
import { AnalyticsService } from '../services/analytics.service'
import { pool } from '../config/database'

const analyticsService = new AnalyticsService(pool)

/**
 * Get buyer's want list
 */
export const getBuyerWantList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'buyer') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Buyer access required'
      })
      return
    }

    const wantList = await repositories.wantList.findByBuyer(req.user.userId)

    if (!wantList) {
      // Return empty want list structure if none exists
      res.json({
        success: true,
        message: 'Want list retrieved successfully',
        data: {
          id: null,
          buyer_id: req.user.userId,
          status: 'active',
          items: [],
          total_price: 0,
          item_count: 0,
          created_at: null,
          updated_at: null
        }
      })
      return
    }

    res.json({
      success: true,
      message: 'Want list retrieved successfully',
      data: wantList
    })
  } catch (error) {
    console.error('Get buyer want list error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving the want list'
    })
  }
}

/**
 * Add product to buyer's want list
 */
export const addToWantList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'buyer') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Buyer access required'
      })
      return
    }

    // Validate request body
    const validationResult = AddToWantListSchema.safeParse(req.body)
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: validationResult.error.errors
      })
      return
    }

    const { product_id } = validationResult.data

    // Check if product exists and is available
    const product = await repositories.product.findById(product_id)
    if (!product) {
      res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      })
      return
    }

    if (product.status !== 'available') {
      res.status(400).json({
        error: 'Product unavailable',
        message: 'This product is not available for reservation'
      })
      return
    }

    // Check if product is already in buyer's want list
    const hasItem = await repositories.wantList.hasItem(req.user.userId, product_id)
    if (hasItem) {
      res.status(400).json({
        error: 'Already in want list',
        message: 'This product is already in your want list'
      })
      return
    }

    // Add product to want list
    const wantListItem = await repositories.wantList.addItem(req.user.userId, product_id)

    res.status(201).json({
      success: true,
      message: 'Product added to want list successfully',
      data: wantListItem
    })
  } catch (error) {
    console.error('Add to want list error:', error)
    
    if (error instanceof Error && error.message === 'Product already in want list') {
      res.status(400).json({
        error: 'Already in want list',
        message: 'This product is already in your want list'
      })
      return
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while adding the product to your want list'
    })
  }
}

/**
 * Remove product from buyer's want list by want list item ID
 */
export const removeFromWantList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'buyer') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Buyer access required'
      })
      return
    }

    const idValidation = UUIDSchema.safeParse(req.params.id)
    if (!idValidation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid want list item ID format'
      })
      return
    }

    const itemId = idValidation.data

    // Remove item from want list
    const removed = await repositories.wantList.removeItemById(itemId)

    if (!removed) {
      res.status(404).json({
        error: 'Item not found',
        message: 'Want list item not found or could not be removed'
      })
      return
    }

    res.json({
      success: true,
      message: 'Product removed from want list successfully'
    })
  } catch (error) {
    console.error('Remove from want list error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while removing the product from your want list'
    })
  }
}

/**
 * Get all want lists for seller (containing seller's products)
 */
export const getSellerWantLists = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    const wantLists = await repositories.wantList.findBySeller(req.user.userId)

    res.json({
      success: true,
      message: 'Seller want lists retrieved successfully',
      data: wantLists
    })
  } catch (error) {
    console.error('Get seller want lists error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving want lists'
    })
  }
}

/**
 * Cancel a want list (seller action)
 */
export const cancelWantList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    const idValidation = UUIDSchema.safeParse(req.params.id)
    if (!idValidation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid want list ID format'
      })
      return
    }

    const wantListId = idValidation.data

    // Verify that the want list contains seller's products
    const sellerWantLists = await repositories.wantList.findBySeller(req.user.userId)
    const wantListExists = sellerWantLists.some(wl => wl.id === wantListId)

    if (!wantListExists) {
      res.status(404).json({
        error: 'Want list not found',
        message: 'Want list not found or does not contain your products'
      })
      return
    }

    // Cancel the want list
    const cancelled = await repositories.wantList.cancel(wantListId)

    if (!cancelled) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to cancel the want list'
      })
      return
    }

    res.json({
      success: true,
      message: 'Want list cancelled successfully'
    })
  } catch (error) {
    console.error('Cancel want list error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while cancelling the want list'
    })
  }
}

/**
 * Complete a want list (seller action)
 */
export const completeWantList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    const idValidation = UUIDSchema.safeParse(req.params.id)
    if (!idValidation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid want list ID format'
      })
      return
    }

    const wantListId = idValidation.data

    // Verify that the want list contains seller's products
    const sellerWantLists = await repositories.wantList.findBySeller(req.user.userId)
    const wantListExists = sellerWantLists.some(wl => wl.id === wantListId)

    if (!wantListExists) {
      res.status(404).json({
        error: 'Want list not found',
        message: 'Want list not found or does not contain your products'
      })
      return
    }

    // Get want list details before completing for analytics
    const wantListDetails = await repositories.wantList.findById(wantListId)
    
    // Complete the want list
    const completed = await repositories.wantList.complete(wantListId)

    if (!completed) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to complete the want list'
      })
      return
    }

    // Record sale analytics if we have the want list details
    if (wantListDetails) {
      try {
        await analyticsService.recordSale(
          req.user.userId, // seller ID
          wantListDetails.buyerId,
          wantListId,
          wantListDetails.totalPrice,
          wantListDetails.itemCount
        )
      } catch (analyticsError) {
        console.error('Failed to record sale analytics:', analyticsError)
        // Don't fail the completion if analytics fails
      }
    }

    res.json({
      success: true,
      message: 'Want list completed successfully'
    })
  } catch (error) {
    console.error('Complete want list error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while completing the want list'
    })
  }
}

/**
 * Clean up empty want lists (maintenance endpoint)
 */
export const cleanupEmptyWantLists = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    const cleanedCount = await repositories.wantList.cleanupEmptyWantLists()

    res.json({
      success: true,
      message: 'Empty want lists cleaned up successfully',
      data: {
        cleaned_count: cleanedCount
      }
    })
  } catch (error) {
    console.error('Cleanup empty want lists error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while cleaning up empty want lists'
    })
  }
}