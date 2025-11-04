import { Response } from 'express'
import { AuthenticatedRequest } from '../utils/auth'
import { repositories } from '../repositories'
import { CreateProductSchema, UpdateProductSchema, ProductFiltersSchema, UUIDSchema } from '../schemas/validation'
import { z } from 'zod'

/**
 * Create a new product (seller only)
 */
export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    // Validate request body
    const validationResult = CreateProductSchema.safeParse(req.body)
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid product data',
        details: validationResult.error.errors
      })
      return
    }

    const productData = validationResult.data

    // Verify that all category IDs exist
    const categories = await repositories.category.findByIds(productData.category_ids)
    if (categories.length !== productData.category_ids.length) {
      res.status(400).json({
        error: 'Validation error',
        message: 'One or more category IDs are invalid'
      })
      return
    }

    // Verify that all photo IDs exist and are unassigned
    const photos = await repositories.productPhoto.findByIds(productData.photo_ids)
    if (photos.length !== productData.photo_ids.length) {
      res.status(400).json({
        error: 'Validation error',
        message: 'One or more photo IDs are invalid'
      })
      return
    }

    // Check if any photos are already assigned to products
    const assignedPhotos = photos.filter(photo => photo.product_id !== null)
    if (assignedPhotos.length > 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'One or more photos are already assigned to other products'
      })
      return
    }

    // Create the product
    const product = await repositories.product.create(req.user.userId, productData)

    // Fetch the full product details including photos and categories
    const productWithDetails = await repositories.product.findByIdWithDetails(product.id)

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: productWithDetails
    })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while creating the product'
    })
  }
}

/**
 * Get a single product by ID
 */
export const getProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const idValidation = UUIDSchema.safeParse(req.params.id)
    if (!idValidation.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid product ID format'
      })
      return
    }

    const productId = idValidation.data
    const buyerId = req.user?.userType === 'buyer' ? req.user.userId : undefined

    const product = await repositories.product.findByIdWithDetails(productId, buyerId)
    
    if (!product) {
      res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      })
      return
    }

    res.json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    })
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving the product'
    })
  }
}

/**
 * Update a product (seller only)
 */
export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Invalid product ID format'
      })
      return
    }

    const productId = idValidation.data

    // Check if product exists and belongs to the seller
    const existingProduct = await repositories.product.findById(productId)
    if (!existingProduct) {
      res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      })
      return
    }

    if (existingProduct.seller_id !== req.user.userId) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own products'
      })
      return
    }

    // Validate request body
    const validationResult = UpdateProductSchema.safeParse(req.body)
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid product data',
        details: validationResult.error.errors
      })
      return
    }

    const updateData = validationResult.data

    // Verify category IDs if provided
    if (updateData.category_ids) {
      const categories = await repositories.category.findByIds(updateData.category_ids)
      if (categories.length !== updateData.category_ids.length) {
        res.status(400).json({
          error: 'Validation error',
          message: 'One or more category IDs are invalid'
        })
        return
      }
    }

    // Verify photo IDs if provided
    if (updateData.photo_ids) {
      const photos = await repositories.productPhoto.findByIds(updateData.photo_ids)
      if (photos.length !== updateData.photo_ids.length) {
        res.status(400).json({
          error: 'Validation error',
          message: 'One or more photo IDs are invalid'
        })
        return
      }

      // Check if any photos are assigned to other products
      const assignedToOthers = photos.filter(photo => 
        photo.product_id !== null && photo.product_id !== productId
      )
      if (assignedToOthers.length > 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'One or more photos are already assigned to other products'
        })
        return
      }
    }

    // Update the product
    const updatedProduct = await repositories.product.update(productId, updateData)

    if (!updatedProduct) {
      res.status(404).json({
        error: 'Product not found',
        message: 'Product not found or could not be updated'
      })
      return
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while updating the product'
    })
  }
}

/**
 * Delete a product (seller only)
 */
export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Invalid product ID format'
      })
      return
    }

    const productId = idValidation.data

    // Check if product exists and belongs to the seller
    const existingProduct = await repositories.product.findById(productId)
    if (!existingProduct) {
      res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      })
      return
    }

    if (existingProduct.seller_id !== req.user.userId) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own products'
      })
      return
    }

    // Delete the product
    const deleted = await repositories.product.delete(productId)

    if (!deleted) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete the product'
      })
      return
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while deleting the product'
    })
  }
}

/**
 * Publish a product (seller only)
 */
export const publishProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Invalid product ID format'
      })
      return
    }

    const productId = idValidation.data

    // Check if product exists and belongs to the seller
    const existingProduct = await repositories.product.findById(productId)
    if (!existingProduct) {
      res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      })
      return
    }

    if (existingProduct.seller_id !== req.user.userId) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only publish your own products'
      })
      return
    }

    if (existingProduct.status !== 'draft') {
      res.status(400).json({
        error: 'Invalid operation',
        message: 'Only draft products can be published'
      })
      return
    }

    // Validate that product has required data for publication
    const productWithDetails = await repositories.product.findByIdWithDetails(productId)
    if (!productWithDetails) {
      res.status(404).json({
        error: 'Product not found',
        message: 'Product details not found'
      })
      return
    }

    // Check if product has at least one photo and one category
    if (!productWithDetails.photos || productWithDetails.photos.length === 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Product must have at least one photo to be published'
      })
      return
    }

    if (!productWithDetails.categories || productWithDetails.categories.length === 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Product must have at least one category to be published'
      })
      return
    }

    // Publish the product
    const publishedProduct = await repositories.product.publish(productId)

    if (!publishedProduct) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to publish the product'
      })
      return
    }

    // Fetch the full product details including photos and categories
    const publishedProductWithDetails = await repositories.product.findByIdWithDetails(productId)

    res.json({
      success: true,
      message: 'Product published successfully',
      data: publishedProductWithDetails
    })
  } catch (error) {
    console.error('Publish product error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while publishing the product'
    })
  }
}

/**
 * Unpublish a product (seller only)
 */
export const unpublishProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Invalid product ID format'
      })
      return
    }

    const productId = idValidation.data

    // Check if product exists and belongs to the seller
    const existingProduct = await repositories.product.findById(productId)
    if (!existingProduct) {
      res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      })
      return
    }

    if (existingProduct.seller_id !== req.user.userId) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only unpublish your own products'
      })
      return
    }

    if (!['available', 'reserved'].includes(existingProduct.status)) {
      res.status(400).json({
        error: 'Invalid operation',
        message: 'Only available or reserved products can be unpublished'
      })
      return
    }

    // Unpublish the product
    const unpublishedProduct = await repositories.product.unpublish(productId)

    if (!unpublishedProduct) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to unpublish the product'
      })
      return
    }

    // Fetch the full product details including photos and categories
    const unpublishedProductWithDetails = await repositories.product.findByIdWithDetails(productId)

    res.json({
      success: true,
      message: 'Product unpublished successfully',
      data: unpublishedProductWithDetails
    })
  } catch (error) {
    console.error('Unpublish product error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while unpublishing the product'
    })
  }
}

/**
 * Get products with filtering and pagination
 */
export const getProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Validate query parameters
    const validationResult = ProductFiltersSchema.safeParse(req.query)
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid query parameters',
        details: validationResult.error.errors
      })
      return
    }

    const filters = validationResult.data
    const buyerId = req.user?.userType === 'buyer' ? req.user.userId : undefined

    // Get products with filters
    const result = await repositories.product.findWithFilters(filters, buyerId)

    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving products'
    })
  }
}

/**
 * Get seller's products (seller only)
 */
export const getSellerProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    // Parse pagination parameters
    const paginationSchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20)
    })

    const validationResult = paginationSchema.safeParse(req.query)
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid pagination parameters',
        details: validationResult.error.errors
      })
      return
    }

    const { page, limit } = validationResult.data
    const pagination = {
      page,
      limit,
      offset: (page - 1) * limit
    }

    // Get seller's products
    const result = await repositories.product.findBySeller(req.user.userId, pagination)

    res.json({
      success: true,
      message: 'Seller products retrieved successfully',
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Get seller products error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving seller products'
    })
  }
}

/**
 * Batch publish products (seller only)
 */
export const batchPublishProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    // Get all draft products for this seller
    const draftProducts = await repositories.product.findBySeller(req.user.userId, { 
      page: 1, 
      limit: 1000, 
      offset: 0 
    })

    const unpublishedProducts = draftProducts.data.filter(product => product.status === 'draft')

    if (unpublishedProducts.length === 0) {
      res.json({
        success: true,
        message: 'No unpublished products found',
        data: {
          publishedCount: 0,
          failedCount: 0,
          results: []
        }
      })
      return
    }

    const results = []
    let publishedCount = 0
    let failedCount = 0

    // Process each unpublished product
    for (const product of unpublishedProducts) {
      try {
        // Validate that product has required data for publication
        const productWithDetails = await repositories.product.findByIdWithDetails(product.id)
        
        if (!productWithDetails?.photos || productWithDetails.photos.length === 0) {
          results.push({
            productId: product.id,
            title: product.title,
            success: false,
            error: 'Product must have at least one photo to be published'
          })
          failedCount++
          continue
        }

        if (!productWithDetails?.categories || productWithDetails.categories.length === 0) {
          results.push({
            productId: product.id,
            title: product.title,
            success: false,
            error: 'Product must have at least one category to be published'
          })
          failedCount++
          continue
        }

        // Publish the product
        const publishedProduct = await repositories.product.publish(product.id)
        
        if (publishedProduct) {
          results.push({
            productId: product.id,
            title: product.title,
            success: true,
            error: null
          })
          publishedCount++
        } else {
          results.push({
            productId: product.id,
            title: product.title,
            success: false,
            error: 'Failed to publish product'
          })
          failedCount++
        }
      } catch (error) {
        results.push({
          productId: product.id,
          title: product.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        failedCount++
      }
    }

    res.json({
      success: true,
      message: `Batch publish completed: ${publishedCount} published, ${failedCount} failed`,
      data: {
        publishedCount,
        failedCount,
        results
      }
    })
  } catch (error) {
    console.error('Batch publish error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during batch publish'
    })
  }
}

/**
 * Record a product view (buyer only)
 */
export const recordProductView = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Invalid product ID format'
      })
      return
    }

    const productId = idValidation.data

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
        message: 'Cannot view draft products'
      })
      return
    }

    // Record the view
    await repositories.product.recordView(productId, req.user.userId)

    res.json({
      success: true,
      message: 'Product view recorded successfully'
    })
  } catch (error) {
    console.error('Record product view error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while recording the product view'
    })
  }
}