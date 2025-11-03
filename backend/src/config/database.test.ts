import { describe, it, expect } from 'vitest'
import { query } from './database'

describe('Database Connection', () => {
  it('should connect to database and execute a simple query', async () => {
    const result = await query('SELECT 1 as test_value')
    expect(result).toBeDefined()
    expect(result.rows).toBeDefined()
    expect(result.rows.length).toBe(1)
    expect(result.rows[0].test_value).toBe(1)
  })

  it('should handle database queries with parameters', async () => {
    const testValue = 'test'
    const result = await query('SELECT $1 as test_param', [testValue])
    expect(result).toBeDefined()
    expect(result.rows).toBeDefined()
    expect(result.rows.length).toBe(1)
    expect(result.rows[0].test_param).toBe(testValue)
  })
})