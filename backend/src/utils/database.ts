// Database utility functions

import { PaginationParams } from '../types/database'

/**
 * Calculate pagination parameters from query parameters
 */
export const calculatePagination = (page: number = 1, limit: number = 20): PaginationParams => {
  const safePage = Math.max(1, Math.floor(page))
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)))
  const offset = (safePage - 1) * safeLimit

  return {
    page: safePage,
    limit: safeLimit,
    offset
  }
}

/**
 * Convert database row to camelCase object
 */
export const toCamelCase = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  
  return result
}

/**
 * Convert camelCase object to snake_case for database
 */
export const toSnakeCase = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    result[snakeKey] = value
  }
  
  return result
}

/**
 * Build dynamic INSERT query
 */
export const buildInsertQuery = (
  table: string, 
  data: Record<string, any>, 
  returning: string = '*'
): { query: string; params: any[] } => {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ')
  const columns = keys.join(', ')
  
  const query = `
    INSERT INTO ${table} (${columns})
    VALUES (${placeholders})
    RETURNING ${returning}
  `
  
  return { query, params: values }
}

/**
 * Build dynamic UPDATE query
 */
export const buildUpdateQuery = (
  table: string,
  data: Record<string, any>,
  whereCondition: string,
  whereParams: any[],
  returning: string = '*'
): { query: string; params: any[] } => {
  const keys = Object.keys(data)
  const values = Object.values(data)
  
  const setClause = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ')
  
  const query = `
    UPDATE ${table}
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE ${whereCondition}
    RETURNING ${returning}
  `
  
  return { query, params: [...values, ...whereParams] }
}

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Generate SQL IN clause with parameters
 */
export const buildInClause = (
  column: string, 
  values: any[], 
  startIndex: number = 1
): { clause: string; params: any[] } => {
  if (values.length === 0) {
    return { clause: '1=0', params: [] } // Always false condition
  }
  
  const placeholders = values
    .map((_, index) => `$${startIndex + index}`)
    .join(', ')
  
  return {
    clause: `${column} IN (${placeholders})`,
    params: values
  }
}

/**
 * Escape SQL LIKE pattern
 */
export const escapeLikePattern = (pattern: string): string => {
  return pattern
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

/**
 * Build search query with ILIKE
 */
export const buildSearchClause = (
  columns: string[],
  searchTerm: string,
  startIndex: number = 1
): { clause: string; params: any[] } => {
  if (!searchTerm.trim()) {
    return { clause: '1=1', params: [] } // Always true condition
  }
  
  const escapedTerm = `%${escapeLikePattern(searchTerm.trim())}%`
  const conditions = columns
    .map((column, index) => `${column} ILIKE $${startIndex + index}`)
    .join(' OR ')
  
  return {
    clause: `(${conditions})`,
    params: Array(columns.length).fill(escapedTerm)
  }
}

/**
 * Database transaction helper with retry logic
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        if (message.includes('unique') || message.includes('foreign key')) {
          throw error
        }
      }
      
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError!
}

/**
 * Format database error for API response
 */
export const formatDatabaseError = (error: any): { code: string; message: string } => {
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        return {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this information already exists'
        }
      case '23503': // foreign_key_violation
        return {
          code: 'INVALID_REFERENCE',
          message: 'Referenced record does not exist'
        }
      case '23502': // not_null_violation
        return {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Required field is missing'
        }
      case '23514': // check_violation
        return {
          code: 'INVALID_VALUE',
          message: 'Invalid value provided'
        }
      default:
        return {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed'
        }
    }
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred'
  }
}