import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import authRoutes from '../routes/auth.routes'

// Mock the auth service
vi.mock('../services/auth.service', () => ({
  authenticateSeller: vi.fn(),
  registerBuyer: vi.fn(),
  authenticateBuyer: vi.fn(),
  getUserInfo: vi.fn()
}))

// Mock the auth utils
vi.mock('../utils/auth', () => ({
  authenticateToken: vi.fn((req, _res, next) => {
    req.user = { userId: 'test-id', userType: 'buyer', name: 'Test User' }
    next()
  })
}))

const app = express()
app.use(express.json())
app.use('/auth', authRoutes)

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /auth/seller/login', () => {
    it('should return 400 when username or password is missing', async () => {
      const response = await request(app)
        .post('/auth/seller/login')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation error')
      expect(response.body.message).toBe('Username and password are required')
    })

    it('should return 400 when only username is provided', async () => {
      const response = await request(app)
        .post('/auth/seller/login')
        .send({ username: 'test' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation error')
    })

    it('should return 400 when only password is provided', async () => {
      const response = await request(app)
        .post('/auth/seller/login')
        .send({ password: 'test' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation error')
    })
  })

  describe('POST /auth/buyer/register', () => {
    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/auth/buyer/register')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation error')
      expect(response.body.message).toBe('Name, telephone, address, and password are required')
    })

    it('should return 400 when some required fields are missing', async () => {
      const response = await request(app)
        .post('/auth/buyer/register')
        .send({ name: 'Test User' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation error')
    })
  })

  describe('POST /auth/buyer/login', () => {
    it('should return 400 when email or password is missing', async () => {
      const response = await request(app)
        .post('/auth/buyer/login')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation error')
      expect(response.body.message).toBe('Email and password are required')
    })
  })

  describe('GET /auth/me', () => {
    it('should return user info when authenticated', async () => {
      const { getUserInfo } = await import('../services/auth.service')
      vi.mocked(getUserInfo).mockResolvedValue({
        id: 'test-id',
        userType: 'buyer',
        name: 'Test User'
      })

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer test-token')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User info retrieved successfully')
    })
  })

  describe('POST /auth/logout', () => {
    it('should return success message', async () => {
      const response = await request(app)
        .post('/auth/logout')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Logged out successfully')
    })
  })
})