import { createLogger, format, transports } from 'winston';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Log colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Custom format for structured logging
const structuredFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.errors({ stack: true }),
  format.json()
);

// Console format for development
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.colorize({ all: true }),
  format.printf(
    (info: any) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Create transports array
const logTransports = [];

// Console transport for all environments
logTransports.push(
  new transports.Console({
    format: process.env.NODE_ENV === 'production' ? structuredFormat : consoleFormat
  })
);

// File transports for production
if (process.env.NODE_ENV === 'production') {
  logTransports.push(
    new transports.File({
      filename: '/var/log/turgus/error.log',
      level: 'error',
      format: structuredFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({
      filename: '/var/log/turgus/combined.log',
      format: structuredFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
const logger = createLogger({
  level: level(),
  levels,
  format: structuredFormat,
  transports: logTransports,
  exitOnError: false
});

// Add colors to winston
import winston from 'winston';
winston.addColors(colors);

// Helper functions for different log types
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

// Business event logging
export const logBusinessEvent = (event: string, data: any, userId?: string) => {
  logger.info('Business Event', {
    type: 'business_event',
    event,
    data,
    userId,
    timestamp: new Date().toISOString()
  });
};

// Security event logging
export const logSecurityEvent = (event: string, details: any, userId?: string, ip?: string) => {
  logger.warn('Security Event', {
    type: 'security_event',
    event,
    details,
    userId,
    ip,
    timestamp: new Date().toISOString()
  });
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  logger.info('Performance Metric', {
    type: 'performance',
    operation,
    duration,
    ...meta,
    timestamp: new Date().toISOString()
  });
};

// Database operation logging
export const logDatabaseOperation = (operation: string, table: string, duration: number, success: boolean) => {
  logger.info('Database Operation', {
    type: 'database_operation',
    operation,
    table,
    duration,
    success,
    timestamp: new Date().toISOString()
  });
};

// API request logging
export const logApiRequest = (method: string, path: string, statusCode: number, duration: number, userId?: string) => {
  logger.http('API Request', {
    type: 'api_request',
    method,
    path,
    statusCode,
    duration,
    userId,
    timestamp: new Date().toISOString()
  });
};

export default logger;