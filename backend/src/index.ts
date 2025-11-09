import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { connectDB, disconnectDB } from './config/database'
import { runMigrations } from './migrations'
import apiRoutes from './routes'
import { requestTracker, errorTracker, healthCheck, metricsEndpoint } from './middleware/monitoring'
import logger, { logInfo, logError } from './utils/logger'

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production'
  : process.env.NODE_ENV === 'staging'
  ? '.env.staging'
  : '.env.development'

// Determine backend directory (works in both dev and production)
// __dirname points to src/ in dev, dist/ in production
const backendDir = path.resolve(__dirname, '..')

// Load environment file from backend directory
dotenv.config({ path: path.resolve(backendDir, envFile) })
// Also load .env as fallback
dotenv.config({ path: path.resolve(backendDir, '.env') })

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Custom request tracking middleware
app.use(requestTracker)

// Morgan logging with custom format
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.http(message.trim())
    }
  }
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check endpoint with metrics
app.get('/health', healthCheck)

// Metrics endpoint for monitoring
app.get('/metrics', metricsEndpoint)

// API routes
app.use('/api', apiRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Error tracking and handling
app.use(errorTracker)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logError('Unhandled application error', err)
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB()
    
    // Run database migrations
    await runMigrations()
    
    // Start server
    app.listen(PORT, () => {
      logInfo(`Turgus backend server started`, { 
        port: PORT, 
        environment: process.env.NODE_ENV,
        healthCheck: `http://localhost:${PORT}/health`,
        metrics: `http://localhost:${PORT}/metrics`
      })
    }).on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logError(`Port ${PORT} is already in use`, error)
        console.error(`❌ Port ${PORT} is already in use. Please stop the process using this port or change the PORT environment variable.`)
        console.error(`💡 To find the process: lsof -ti:${PORT} or ss -tulpn | grep :${PORT}`)
        process.exit(1)
      } else {
        logError('Failed to start server', error)
        throw error
      }
    })
  } catch (error) {
    logError('Failed to start server', error as Error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGINT', async () => {
  logInfo('Received SIGINT, shutting down gracefully...')
  await disconnectDB()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logInfo('Received SIGTERM, shutting down gracefully...')
  await disconnectDB()
  process.exit(0)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  console.error('Stack:', error.stack)
  logError('Uncaught exception', error)
  // Give time for logs to be written
  setTimeout(() => {
    process.exit(1)
  }, 1000)
})

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error 
    ? reason 
    : new Error(`Unhandled rejection: ${String(reason)}`)
  console.error('❌ Unhandled Rejection:', error)
  console.error('Promise:', promise)
  console.error('Reason:', reason)
  logError('Unhandled rejection', error)
  // Give time for logs to be written
  setTimeout(() => {
    process.exit(1)
  }, 1000)
})

export default app