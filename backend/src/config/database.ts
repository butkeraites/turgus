import { Pool, PoolConfig } from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Database configuration
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'turgus_db',
  user: process.env.DB_USER || 'turgus',
  password: process.env.DB_PASSWORD || 'turgus_dev_password',
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
}

// Alternative: Use DATABASE_URL if provided (for production/Docker)
if (process.env.DATABASE_URL) {
  const connectionString = process.env.DATABASE_URL
  dbConfig.connectionString = connectionString
  // Parse SSL settings for production
  if (process.env.NODE_ENV === 'production') {
    dbConfig.ssl = {
      rejectUnauthorized: false
    }
  }
}

// Create connection pool
export const pool = new Pool(dbConfig)

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

// Database connection utility functions
export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect()
    console.log('✅ Database connected successfully')
    
    // Test the connection
    const result = await client.query('SELECT NOW()')
    console.log('📅 Database time:', result.rows[0].now)
    
    client.release()
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// Graceful shutdown
export const disconnectDB = async (): Promise<void> => {
  try {
    await pool.end()
    console.log('✅ Database connection pool closed')
  } catch (error) {
    console.error('❌ Error closing database connection pool:', error)
    throw error
  }
}

// Query helper function
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Query executed:', { text, duration: `${duration}ms`, rows: result.rowCount })
    }
    
    return result
  } catch (error) {
    console.error('❌ Query error:', { text, error })
    throw error
  }
}

// Transaction helper function
export const transaction = async (callback: (client: any) => Promise<any>): Promise<any> => {
  const client = await pool.connect()
  
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

export default pool