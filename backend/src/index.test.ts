import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from './index'

describe('API Server', () => {
  it('should respond to health check', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body.service).toBe('turgus-backend')
  })

  it('should respond to API endpoint', async () => {
    const response = await request(app).get('/api')
    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Turgus API Server')
    expect(response.body.version).toBe('1.0.0')
  })

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route')
    expect(response.status).toBe(404)
    expect(response.body.error).toBe('Not Found')
  })
})