import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

// Metrics collection interface
interface Metrics {
  requestCount: Map<string, number>;
  responseTime: Map<string, number[]>;
  errorCount: Map<string, number>;
  activeConnections: number;
}

// Global metrics store
const metrics: Metrics = {
  requestCount: new Map(),
  responseTime: new Map(),
  errorCount: new Map(),
  activeConnections: 0
};

// Request tracking middleware
export const requestTracker = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const route = `${req.method} ${req.route?.path || req.path}`;
  
  // Increment active connections
  metrics.activeConnections++;
  
  // Increment request count
  const currentCount = metrics.requestCount.get(route) || 0;
  metrics.requestCount.set(route, currentCount + 1);
  
  // Track response time when request completes
  res.on('finish', () => {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Store response time
    const times = metrics.responseTime.get(route) || [];
    times.push(responseTime);
    
    // Keep only last 100 response times per route
    if (times.length > 100) {
      times.shift();
    }
    metrics.responseTime.set(route, times);
    
    // Track errors (4xx and 5xx status codes)
    if (res.statusCode >= 400) {
      const errorCount = metrics.errorCount.get(route) || 0;
      metrics.errorCount.set(route, errorCount + 1);
    }
    
    // Decrement active connections
    metrics.activeConnections--;
    
    // Log request details
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: Math.round(responseTime),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id
    }));
  });
  
  next();
};

// Error tracking middleware
export const errorTracker = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const route = `${req.method} ${req.route?.path || req.path}`;
  
  // Increment error count
  const errorCount = metrics.errorCount.get(route) || 0;
  metrics.errorCount.set(route, errorCount + 1);
  
  // Log error details
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }));
  
  next(error);
};

// Health check endpoint with metrics
export const healthCheck = (req: Request, res: Response) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  // Calculate average response times
  const avgResponseTimes: Record<string, number> = {};
  for (const [route, times] of metrics.responseTime.entries()) {
    if (times.length > 0) {
      avgResponseTimes[route] = Math.round(
        times.reduce((sum, time) => sum + time, 0) / times.length
      );
    }
  }
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(uptime),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    },
    metrics: {
      activeConnections: metrics.activeConnections,
      totalRequests: Array.from(metrics.requestCount.values()).reduce((sum, count) => sum + count, 0),
      totalErrors: Array.from(metrics.errorCount.values()).reduce((sum, count) => sum + count, 0),
      averageResponseTimes: avgResponseTimes
    }
  };
  
  res.status(200).json(healthData);
};

// Metrics endpoint for monitoring systems
export const metricsEndpoint = (req: Request, res: Response) => {
  const prometheusMetrics = [];
  
  // Request count metrics
  for (const [route, count] of metrics.requestCount.entries()) {
    prometheusMetrics.push(`turgus_requests_total{route="${route}"} ${count}`);
  }
  
  // Error count metrics
  for (const [route, count] of metrics.errorCount.entries()) {
    prometheusMetrics.push(`turgus_errors_total{route="${route}"} ${count}`);
  }
  
  // Response time metrics
  for (const [route, times] of metrics.responseTime.entries()) {
    if (times.length > 0) {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
      prometheusMetrics.push(`turgus_response_time_avg{route="${route}"} ${avg}`);
      prometheusMetrics.push(`turgus_response_time_p95{route="${route}"} ${p95}`);
    }
  }
  
  // System metrics
  const memoryUsage = process.memoryUsage();
  prometheusMetrics.push(`turgus_memory_used_bytes ${memoryUsage.heapUsed}`);
  prometheusMetrics.push(`turgus_memory_total_bytes ${memoryUsage.heapTotal}`);
  prometheusMetrics.push(`turgus_uptime_seconds ${process.uptime()}`);
  prometheusMetrics.push(`turgus_active_connections ${metrics.activeConnections}`);
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics.join('\n'));
};

// Business metrics tracking
export const trackBusinessMetric = (metric: string, value: number, labels?: Record<string, string>) => {
  const timestamp = new Date().toISOString();
  const labelStr = labels ? Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',') : '';
  
  console.log(JSON.stringify({
    timestamp,
    level: 'info',
    type: 'business_metric',
    metric,
    value,
    labels: labels || {}
  }));
};

// Database query performance tracking
export const trackDatabaseQuery = (query: string, duration: number, success: boolean) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    type: 'database_query',
    query: query.substring(0, 100), // Truncate long queries
    duration: Math.round(duration),
    success
  }));
};

// File upload tracking
export const trackFileUpload = (filename: string, size: number, success: boolean, userId?: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    type: 'file_upload',
    filename,
    size,
    success,
    userId
  }));
};