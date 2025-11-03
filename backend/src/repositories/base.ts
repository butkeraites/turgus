import { Pool, PoolClient } from 'pg'
import { pool } from '../config/database'
import { PaginationParams, PaginatedResult } from '../types/database'

// Base repository class with common database operations
export abstract class BaseRepository {
  protected pool: Pool

  constructor() {
    this.pool = pool
  }

  // Execute a query with optional parameters
  protected async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now()
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Query executed:', { 
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
          duration: `${duration}ms`, 
          rows: result.rowCount 
        })
      }
      
      return result.rows
    } catch (error) {
      console.error('❌ Query error:', { text, error })
      throw error
    }
  }

  // Execute a query and return a single row
  protected async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params)
    return rows.length > 0 ? rows[0] : null
  }

  // Execute a query within a transaction
  protected async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  // Helper method for pagination
  protected buildPaginationQuery(baseQuery: string, _pagination: PaginationParams, paramCount: number = 0): string {
    return `${baseQuery} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
  }

  // Helper method to create paginated result
  protected async createPaginatedResult<T>(
    baseQuery: string,
    countQuery: string,
    queryParams: any[],
    pagination: PaginationParams
  ): Promise<PaginatedResult<T>> {
    // Get total count
    const countResult = await this.query<{ count: string }>(countQuery, queryParams)
    const total = parseInt(countResult[0]?.count || '0')

    // Get paginated data
    const dataQuery = this.buildPaginationQuery(baseQuery, pagination, queryParams.length)
    const data = await this.query<T>(dataQuery, [...queryParams, pagination.limit, pagination.offset])

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / pagination.limit)
    const hasNext = pagination.page < totalPages
    const hasPrev = pagination.page > 1

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        total_pages: totalPages,
        has_next: hasNext,
        has_prev: hasPrev
      }
    }
  }

  // Helper method to build WHERE clauses dynamically
  protected buildWhereClause(conditions: Record<string, any>): { whereClause: string; params: any[] } {
    const validConditions = Object.entries(conditions).filter(([_, value]) => value !== undefined && value !== null)
    
    if (validConditions.length === 0) {
      return { whereClause: '', params: [] }
    }

    const clauses: string[] = []
    const params: any[] = []
    let paramIndex = 1

    for (const [key, value] of validConditions) {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ')
          clauses.push(`${key} IN (${placeholders})`)
          params.push(...value)
        }
      } else {
        clauses.push(`${key} = $${paramIndex++}`)
        params.push(value)
      }
    }

    return {
      whereClause: `WHERE ${clauses.join(' AND ')}`,
      params
    }
  }

  // Helper method to build ORDER BY clause
  protected buildOrderClause(sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): string {
    const allowedSortFields = ['created_at', 'updated_at', 'price', 'title', 'name']
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc'
    
    return `ORDER BY ${safeSortBy} ${safeSortOrder.toUpperCase()}`
  }

  // Helper method to check if record exists
  protected async exists(table: string, conditions: Record<string, any>): Promise<boolean> {
    const { whereClause, params } = this.buildWhereClause(conditions)
    const query = `SELECT 1 FROM ${table} ${whereClause} LIMIT 1`
    const result = await this.query(query, params)
    return result.length > 0
  }

  // Helper method to get record by ID
  protected async findById<T>(table: string, id: string): Promise<T | null> {
    const query = `SELECT * FROM ${table} WHERE id = $1`
    return this.queryOne<T>(query, [id])
  }

  // Helper method to delete record by ID
  protected async deleteById(table: string, id: string): Promise<boolean> {
    const query = `DELETE FROM ${table} WHERE id = $1`
    const result = await this.query(query, [id])
    return result.length > 0
  }
}