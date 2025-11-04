import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Request, Response, NextFunction } from 'express'

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

// Types for JWT payload
export interface JWTPayload {
  userId: string
  userType: 'seller' | 'buyer'
  username?: string // For seller
  name?: string // For buyer
}

// Extended Request interface to include user info
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

/**
 * Generate JWT token for authenticated user
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

/**
 * Verify JWT token and extract payload
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

/**
 * Authentication middleware for protected routes
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      error: 'Access denied',
      message: 'No token provided' 
    })
    return
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    res.status(403).json({ 
      error: 'Invalid token',
      message: 'Token is invalid or expired' 
    })
  }
}

/**
 * Optional authentication middleware - sets user if token is valid, but doesn't fail if no token
 */
export const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    // No token provided, continue without user
    req.user = undefined
    next()
    return
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    // Invalid token, continue without user (don't fail the request)
    req.user = undefined
    next()
  }
}

/**
 * Middleware to check if user is a seller
 */
export const requireSeller = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'User not authenticated' 
    })
    return
  }

  if (req.user.userType !== 'seller') {
    res.status(403).json({ 
      error: 'Access denied',
      message: 'Seller access required' 
    })
    return
  }

  next()
}

/**
 * Middleware to check if user is a buyer
 */
export const requireBuyer = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'User not authenticated' 
    })
    return
  }

  if (req.user.userType !== 'buyer') {
    res.status(403).json({ 
      error: 'Access denied',
      message: 'Buyer access required' 
    })
    return
  }

  next()
}

/**
 * Extract token from request headers
 */
export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization
  return authHeader && authHeader.split(' ')[1] || null
}