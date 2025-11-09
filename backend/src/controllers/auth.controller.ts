import { Request, Response } from 'express'
import { authenticateSeller, registerBuyer, authenticateBuyer, getUserInfo } from '../services/auth.service'
import { AuthenticatedRequest } from '../utils/auth'

/**
 * Seller login endpoint
 */
export const sellerLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Username and password are required'
      })
      return
    }

    const authResult = await authenticateSeller({ username, password })

    res.json({
      success: true,
      message: 'Seller authenticated successfully',
      data: authResult
    })
  } catch (error) {
    console.error('Seller login error:', error)
    
    if (error instanceof Error && error.message === 'Invalid username or password') {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password'
      })
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred during authentication'
      })
    }
  }
}

/**
 * Buyer registration endpoint
 */
export const buyerRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, telephone, address, email, password, language } = req.body

    if (!name || !telephone || !address || !password) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Name, telephone, address, and password are required'
      })
      return
    }

    const authResult = await registerBuyer({
      name,
      telephone,
      address,
      email,
      password,
      language
    })

    res.status(201).json({
      success: true,
      message: 'Buyer registered successfully',
      data: authResult
    })
  } catch (error) {
    console.error('Buyer registration error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Email already registered') {
        res.status(409).json({
          error: 'Registration failed',
          message: 'Email already registered'
        })
      } else if (error.message === 'Name, telephone, and address are required') {
        res.status(400).json({
          error: 'Validation error',
          message: error.message
        })
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'An error occurred during registration'
        })
      }
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred during registration'
      })
    }
  }
}

/**
 * Buyer login endpoint
 */
export const buyerLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== BUYER LOGIN DEBUG ===')
    console.log('Request body:', req.body)
    console.log('Content-Type:', req.headers['content-type'])
    console.log('Body keys:', Object.keys(req.body || {}))
    console.log('========================')
    
    const { telephone, password } = req.body

    // Trim telephone to handle whitespace
    const trimmedTelephone = telephone ? String(telephone).trim() : ''

    if (!trimmedTelephone || !password) {
      console.log('Missing fields - telephone:', !!trimmedTelephone, 'password:', !!password)
      res.status(400).json({
        error: 'Validation error',
        message: 'Telephone and password are required',
        details: {
          telephone: trimmedTelephone ? 'provided' : 'missing',
          password: password ? 'provided' : 'missing'
        }
      })
      return
    }

    const authResult = await authenticateBuyer({ telephone: trimmedTelephone, password })

    res.json({
      success: true,
      message: 'Buyer authenticated successfully',
      data: authResult
    })
  } catch (error) {
    console.error('Buyer login error:', error)
    
    if (error instanceof Error && error.message === 'Invalid telephone or password') {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid telephone or password'
      })
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred during authentication'
      })
    }
  }
}

/**
 * Get current user info endpoint
 */
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      })
      return
    }

    const userInfo = await getUserInfo(req.user.userId, req.user.userType)

    res.json({
      success: true,
      message: 'User info retrieved successfully',
      data: userInfo
    })
  } catch (error) {
    console.error('Get user info error:', error)
    
    if (error instanceof Error && (error.message === 'Seller not found' || error.message === 'Buyer not found')) {
      res.status(404).json({
        error: 'User not found',
        message: error.message
      })
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred while retrieving user info'
      })
    }
  }
}

/**
 * Logout endpoint (client-side token removal)
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove the token from client storage.'
  })
}