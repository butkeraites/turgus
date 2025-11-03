import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { connectDB, disconnectDB } from './config/database'
import { runMigrations } from './migrations'
import apiRoutes from './routes'
import { requestTracker, errorTracker, healthCheck, metricsEndpoint } from './middleware/monitoring'
import logger, { logInfo, logError } from './utils/logger'

// Load environment variables
dotenv.config()

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
  logError('Uncaught exception', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled rejection', new Error(`Promise: ${promise}, Reason: ${reason}`))
  process.exit(1)
})

export default app