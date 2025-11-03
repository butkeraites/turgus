import { Response } from 'express'
import { AuthenticatedRequest } from '../utils/auth'
import { repositories } from '../repositories'
import { 
  CreateCommentSchema, 
  UpdateCommentSchema, 
  ModerateCommentSchema, 
  UUIDSchema 
} from '../schemas/validation'

/**
 * Create a new comment on a product
 */
export const createComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to comment'
      })
      return
    }

    const productIdValidation = UUIDSchema.safeParse(req.params.productId)
    if (!productIdValidation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid product ID format'
      })
      return
    }

    const productId = productIdValidation.data

    // Validate request body
    const validationResult = CreateCommentSchema.safeParse(req.body)
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid comment data',
        details: validationResult.error.errors
      })
      return
    }

    const commentData = validationResult.data

    // Check if product exists and is published
    const product = await repositories.product.findById(productId)
    if (!product) {
      res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      })
      return
    }

    if (product.status === 'draft') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Cannot comment on draft products'
      })
      return
    }

    // If replying to a comment, verify parent comment exists and belongs to this product
    if (commentData.parent_comment_id) {
      const parentComment = await repositories.productComment.findById(commentData.parent_comment_id)
      if (!parentComment) {
        res.status(404).json({
          error: 'Parent comment not found',
          message: 'The comment you are replying to does not exist'
        })
        return
      }

      if (parentComment.product_id !== productId) {
        res.status(400).json({
          error: 'Invalid reply',
          message: 'Parent comment does not belong to this product'
        })
        return
      }
    }

    // Create the comment
    const comment = await repositories.productComment.create(
      productId,
      req.user.userId,
      req.user.userType,
      commentData
    )

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    })
  } catch (error) {
    console.error('Create comment error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while creating the comment'
    })
  }
}

/**
 * Get all comments for a product
 */
export const getProductComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const productIdValidation = UUIDSchema.safeParse(req.params.productId)
    if (!productIdValidation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid product ID format'
      })
      return
    }

    const productId = productIdValidation.data

    // Check if product exists
    const product = await repositories.product.findById(productId)
    if (!product) {
      res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      })
      return
    }

    // Get comments for the product
    const comments = await repositories.productComment.findByProduct(productId)

    res.json({
      success: true,
      message: 'Comments retrieved successfully',
      data: comments
    })
  } catch (error) {
    console.error('Get product comments error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving comments'
    })
  }
}

/**
 * Update a comment (author only)
 */
export const updateComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to update comments'
      })
      return
    }

    const commentIdValidation = UUIDSchema.safeParse(req.params.commentId)
    if (!commentIdValidation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid comment ID format'
      })
      return
    }

    const commentId = commentIdValidation.data

    // Validate request body
    const validationResult = UpdateCommentSchema.safeParse(req.body)
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid comment data',
        details: validationResult.error.errors
      })
      return
    }

    const updateData = validationResult.data

    // Check if comment exists and belongs to the user
    const existingComment = await repositories.productComment.findById(commentId)
    if (!existingComment) {
      res.status(404).json({
        error: 'Comment not found',
        message: 'The requested comment does not exist'
      })
      return
    }

    if (existingComment.author_id !== req.user.userId || existingComment.author_type !== req.user.userType) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own comments'
      })
      return
    }

    // Update the comment
    const updatedComment = await repositories.productComment.update(commentId, updateData)

    if (!updatedComment) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update the comment'
      })
      return
    }

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment
    })
  } catch (error) {
    console.error('Update comment error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while updating the comment'
    })
  }
}

/**
 * Delete a comment (author only or seller for their product)
 */
export const deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to delete comments'
      })
      return
    }

    const commentIdValidation = UUIDSchema.safeParse(req.params.commentId)
    if (!commentIdValidation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid comment ID format'
      })
      return
    }

    const commentId = commentIdValidation.data

    // Check if comment exists
    const existingComment = await repositories.productComment.findById(commentId)
    if (!existingComment) {
      res.status(404).json({
        error: 'Comment not found',
        message: 'The requested comment does not exist'
      })
      return
    }

    // Check permissions: comment author or product owner (seller)
    let canDelete = false

    if (existingComment.author_id === req.user.userId && existingComment.author_type === req.user.userType) {
      // Comment author can delete their own comment
      canDelete = true
    } else if (req.user.userType === 'seller') {
      // Seller can delete comments on their products
      const product = await repositories.product.findById(existingComment.product_id)
      if (product && product.seller_id === req.user.userId) {
        canDelete = true
      }
    }

    if (!canDelete) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own comments or comments on your products'
      })
      return
    }

    // Delete the comment
    const deleted = await repositories.productComment.delete(commentId)

    if (!deleted) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete the comment'
      })
      return
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while deleting the comment'
    })
  }
}

/**
 * Moderate a comment (seller only, for their products)
 */
export const moderateComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    const commentIdValidation = UUIDSchema.safeParse(req.params.commentId)
    if (!commentIdValidation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid comment ID format'
      })
      return
    }

    const commentId = commentIdValidation.data

    // Validate request body
    const validationResult = ModerateCommentSchema.safeParse(req.body)
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid moderation data',
        details: validationResult.error.errors
      })
      return
    }

    const { is_moderated } = validationResult.data

    // Check if comment exists and belongs to seller's product
    const existingComment = await repositories.productComment.findById(commentId)
    if (!existingComment) {
      res.status(404).json({
        error: 'Comment not found',
        message: 'The requested comment does not exist'
      })
      return
    }

    const product = await repositories.product.findById(existingComment.product_id)
    if (!product || product.seller_id !== req.user.userId) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only moderate comments on your own products'
      })
      return
    }

    // Moderate the comment
    const moderatedComment = await repositories.productComment.moderate(commentId, is_moderated)

    if (!moderatedComment) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to moderate the comment'
      })
      return
    }

    res.json({
      success: true,
      message: `Comment ${is_moderated ? 'moderated' : 'unmoderated'} successfully`,
      data: moderatedComment
    })
  } catch (error) {
    console.error('Moderate comment error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while moderating the comment'
    })
  }
}