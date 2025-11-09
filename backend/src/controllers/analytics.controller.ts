import { Response } from 'express'
import { AuthenticatedRequest } from '../utils/auth'
import { AnalyticsService } from '../services/analytics.service'
import { pool } from '../config/database'

const analyticsService = new AnalyticsService(pool)

/**
 * Get dashboard metrics for seller
 */
export const getDashboardMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    const metrics = await analyticsService.getDashboardMetrics(req.user.userId)

    res.json({
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: metrics
    })
  } catch (error) {
    console.error('Get dashboard metrics error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving dashboard metrics'
    })
  }
}

/**
 * Get real-time online users count
 */
export const getOnlineUsersCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    const count = await analyticsService.getOnlineUsersCount(req.user.userId)

    res.json({
      success: true,
      message: 'Online users count retrieved successfully',
      data: { count }
    })
  } catch (error) {
    console.error('Get online users count error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving online users count'
    })
  }
}

/**
 * Get sales report
 */
export const getSalesReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'seller') {
      res.status(403).json({
        error: 'Access denied',
        message: 'Seller access required'
      })
      return
    }

    const { startDate, endDate, buyerIds } = req.query

    if (!startDate || !endDate) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Start date and end date are required'
      })
      return
    }

    const buyerIdsArray = buyerIds ? 
      (Array.isArray(buyerIds) ? buyerIds as string[] : [buyerIds as string]) : 
      undefined

    const report = await analyticsService.getSalesReport(
      req.user.userId,
      startDate as string,
      endDate as string,
      buyerIdsArray
    )

    res.json({
      success: true,
      message: 'Sales report retrieved successfully',
      data: report
    })
  } catch (error) {
    console.error('Get sales report error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving sales report'
    })
  }
}

/**
 * Track product view (called when someone views a product)
 */
export const trackProductView = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params
    const sessionId = req.headers['x-session-id'] as string
    const ipAddress = req.ip
    const userAgent = req.headers['user-agent']

    await analyticsService.trackProductView(
      productId,
      req.user?.userId,
      sessionId,
      ipAddress,
      userAgent
    )

    // Update online session if user is logged in
    if (req.user || sessionId) {
      await analyticsService.updateOnlineSession(
        req.user?.userId,
        sessionId,
        ipAddress,
        userAgent
      )
    }

    res.json({
      success: true,
      message: 'Product view tracked successfully'
    })
  } catch (error) {
    console.error('Track product view error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while tracking product view'
    })
  }
}

/**
 * Update online session (heartbeat)
 */
export const updateOnlineSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sessionId = req.headers['x-session-id'] as string
    const ipAddress = req.ip
    const userAgent = req.headers['user-agent']

    await analyticsService.updateOnlineSession(
      req.user?.userId,
      sessionId,
      ipAddress,
      userAgent
    )

    res.json({
      success: true,
      message: 'Online session updated successfully'
    })
  } catch (error) {
    console.error('Update online session error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while updating online session'
    })
  }
}

/**
 * Track want list add (called when someone adds a product to their want list)
 */
export const trackWantListAdd = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params

    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User must be logged in to track want list adds'
      })
      return
    }

    // Validate productId format
    if (!productId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
      res.status(400).json({
        error: 'Invalid product ID',
        message: 'Product ID must be a valid UUID'
      })
      return
    }

    await analyticsService.trackWantListAdd(productId, req.user.userId)

    res.json({
      success: true,
      message: 'Want list add tracked successfully'
    })
  } catch (error) {
    console.error('Track want list add error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while tracking want list add',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    })
  }
}