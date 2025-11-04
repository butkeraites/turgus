import { pool } from '../config/database'
import { hashPassword, comparePassword, generateToken, JWTPayload } from '../utils/auth'

// Types for authentication
export interface SellerLoginRequest {
  username: string
  password: string
}

export interface BuyerRegisterRequest {
  name: string
  telephone: string
  address: string
  email?: string
  password: string
  language?: 'pt' | 'en'
}

export interface BuyerLoginRequest {
  telephone: string
  password: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    userType: 'seller' | 'buyer'
    username?: string
    name?: string
    email?: string
    language?: string
  }
}

export interface UserInfo {
  id: string
  userType: 'seller' | 'buyer'
  username?: string
  name?: string
  email?: string
  telephone?: string
  address?: string
  language?: string
}

/**
 * Authenticate seller with hardcoded credentials
 */
export const authenticateSeller = async (credentials: SellerLoginRequest): Promise<AuthResponse> => {
  const { username, password } = credentials

  // Query seller account
  const query = 'SELECT id, username, password_hash FROM seller_accounts WHERE username = $1'
  const result = await pool.query(query, [username])

  if (result.rows.length === 0) {
    throw new Error('Invalid username or password')
  }

  const seller = result.rows[0]

  // Verify password
  const isValidPassword = await comparePassword(password, seller.password_hash)
  if (!isValidPassword) {
    throw new Error('Invalid username or password')
  }

  // Generate JWT token
  const payload: JWTPayload = {
    userId: seller.id,
    userType: 'seller',
    username: seller.username
  }

  const token = generateToken(payload)

  return {
    token,
    user: {
      id: seller.id,
      userType: 'seller',
      username: seller.username
    }
  }
}

/**
 * Register new buyer account
 */
export const registerBuyer = async (userData: BuyerRegisterRequest): Promise<AuthResponse> => {
  const { name, telephone, address, email, password, language = 'pt' } = userData

  // Validate required fields
  if (!name.trim() || !telephone.trim() || !address.trim()) {
    throw new Error('Name, telephone, and address are required')
  }

  // Check if email already exists (if provided)
  if (email) {
    const emailCheck = 'SELECT id FROM buyer_accounts WHERE email = $1'
    const emailResult = await pool.query(emailCheck, [email])
    
    if (emailResult.rows.length > 0) {
      throw new Error('Email already registered')
    }
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  // Insert new buyer
  const insertQuery = `
    INSERT INTO buyer_accounts (name, telephone, address, email, password_hash, language)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, email, language
  `
  
  const values = [name.trim(), telephone.trim(), address.trim(), email || null, passwordHash, language]
  const result = await pool.query(insertQuery, values)
  
  const buyer = result.rows[0]

  // Generate JWT token
  const payload: JWTPayload = {
    userId: buyer.id,
    userType: 'buyer',
    name: buyer.name
  }

  const token = generateToken(payload)

  return {
    token,
    user: {
      id: buyer.id,
      userType: 'buyer',
      name: buyer.name,
      email: buyer.email,
      language: buyer.language
    }
  }
}

/**
 * Authenticate buyer login
 */
export const authenticateBuyer = async (credentials: BuyerLoginRequest): Promise<AuthResponse> => {
  const { telephone, password } = credentials

  if (!telephone || !password) {
    throw new Error('Telephone and password are required')
  }

  // Query buyer account
  const query = 'SELECT id, name, telephone, email, password_hash, language FROM buyer_accounts WHERE telephone = $1'
  const result = await pool.query(query, [telephone])

  if (result.rows.length === 0) {
    throw new Error('Invalid telephone or password')
  }

  const buyer = result.rows[0]

  // Verify password
  const isValidPassword = await comparePassword(password, buyer.password_hash)
  if (!isValidPassword) {
    throw new Error('Invalid telephone or password')
  }

  // Generate JWT token
  const payload: JWTPayload = {
    userId: buyer.id,
    userType: 'buyer',
    name: buyer.name
  }

  const token = generateToken(payload)

  return {
    token,
    user: {
      id: buyer.id,
      userType: 'buyer',
      name: buyer.name,
      email: buyer.email,
      language: buyer.language
    }
  }
}

/**
 * Get user information by ID and type
 */
export const getUserInfo = async (userId: string, userType: 'seller' | 'buyer'): Promise<UserInfo> => {
  if (userType === 'seller') {
    const query = 'SELECT id, username FROM seller_accounts WHERE id = $1'
    const result = await pool.query(query, [userId])
    
    if (result.rows.length === 0) {
      throw new Error('Seller not found')
    }

    const seller = result.rows[0]
    return {
      id: seller.id,
      userType: 'seller',
      username: seller.username
    }
  } else {
    const query = 'SELECT id, name, email, telephone, address, language FROM buyer_accounts WHERE id = $1'
    const result = await pool.query(query, [userId])
    
    if (result.rows.length === 0) {
      throw new Error('Buyer not found')
    }

    const buyer = result.rows[0]
    return {
      id: buyer.id,
      userType: 'buyer',
      name: buyer.name,
      email: buyer.email,
      telephone: buyer.telephone,
      address: buyer.address,
      language: buyer.language
    }
  }
}