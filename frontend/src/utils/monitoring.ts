// Frontend monitoring and analytics utilities

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface ErrorEvent {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
}

interface UserEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

class FrontendMonitoring {
  private sessionId: string;
  private userId?: string;
  private performanceObserver?: PerformanceObserver;
  private errorBuffer: ErrorEvent[] = [];
  private eventBuffer: UserEvent[] = [];
  private metricsBuffer: PerformanceMetric[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorTracking();
    this.initializePerformanceTracking();
    this.initializeUserTracking();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private initializeErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.userId
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.userId
      });
    });
  }

  private initializePerformanceTracking() {
    // Web Vitals tracking
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.trackMetric({
              name: 'lcp',
              value: entry.startTime,
              timestamp: Date.now(),
              labels: { url: window.location.pathname }
            });
          }
          
          if (entry.entryType === 'first-input') {
            this.trackMetric({
              name: 'fid',
              value: (entry as any).processingStart - entry.startTime,
              timestamp: Date.now(),
              labels: { url: window.location.pathname }
            });
          }
        }
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
      } catch (e) {
        console.warn('Performance observer not supported for some entry types');
      }
    }

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.trackMetric({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          timestamp: Date.now(),
          labels: { url: window.location.pathname }
        });

        this.trackMetric({
          name: 'dom_content_loaded',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          timestamp: Date.now(),
          labels: { url: window.location.pathname }
        });
      }, 0);
    });
  }

  private initializeUserTracking() {
    // Page view tracking
    this.trackEvent('page_view', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer
    });

    // Visibility change tracking
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('visibility_change', {
        visible: !document.hidden,
        url: window.location.href
      });
    });

    // Click tracking for important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        this.trackEvent('button_click', {
          text: button?.textContent?.trim(),
          id: button?.id,
          className: button?.className,
          url: window.location.href
        });
      }

      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target as HTMLAnchorElement : target.closest('a');
        this.trackEvent('link_click', {
          href: link?.href,
          text: link?.textContent?.trim(),
          url: window.location.href
        });
      }
    });
  }

  trackError(error: ErrorEvent) {
    this.errorBuffer.push(error);
    
    // Send immediately for critical errors
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      this.flushErrors();
    }
    
    // Auto-flush buffer when it gets too large
    if (this.errorBuffer.length >= 10) {
      this.flushErrors();
    }
  }

  trackEvent(event: string, properties: Record<string, any>) {
    this.eventBuffer.push({
      event,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    });

    // Auto-flush buffer when it gets too large
    if (this.eventBuffer.length >= 20) {
      this.flushEvents();
    }
  }

  trackMetric(metric: PerformanceMetric) {
    this.metricsBuffer.push(metric);

    // Auto-flush buffer when it gets too large
    if (this.metricsBuffer.length >= 10) {
      this.flushMetrics();
    }
  }

  // Business event tracking
  trackBusinessEvent(event: string, data: Record<string, any>) {
    this.trackEvent(`business_${event}`, {
      ...data,
      type: 'business_event'
    });
  }

  // User interaction tracking
  trackUserInteraction(action: string, element: string, details?: Record<string, any>) {
    this.trackEvent('user_interaction', {
      action,
      element,
      ...details,
      url: window.location.href
    });
  }

  // API call tracking
  trackApiCall(method: string, endpoint: string, duration: number, status: number, success: boolean) {
    this.trackMetric({
      name: 'api_call_duration',
      value: duration,
      timestamp: Date.now(),
      labels: {
        method,
        endpoint,
        status: status.toString(),
        success: success.toString()
      }
    });

    if (!success) {
      this.trackEvent('api_error', {
        method,
        endpoint,
        status,
        duration
      });
    }
  }

  private async flushErrors() {
    if (this.errorBuffer.length === 0) return;

    const errors = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      await this.sendToBackend('/api/monitoring/errors', { errors });
    } catch (e) {
      console.warn('Failed to send error data to backend');
      // Put errors back in buffer for retry
      this.errorBuffer.unshift(...errors);
    }
  }

  private async flushEvents() {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await this.sendToBackend('/api/monitoring/events', { events });
    } catch (e) {
      console.warn('Failed to send event data to backend');
    }
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await this.sendToBackend('/api/monitoring/metrics', { metrics });
    } catch (e) {
      console.warn('Failed to send metrics data to backend');
    }
  }

  private async sendToBackend(endpoint: string, data: any) {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    
    await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  // Manual flush methods
  flush() {
    this.flushErrors();
    this.flushEvents();
    this.flushMetrics();
  }

  // Cleanup method
  destroy() {
    this.flush();
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Create singleton instance
const monitoring = new FrontendMonitoring();

// Auto-flush on page unload
window.addEventListener('beforeunload', () => {
  monitoring.flush();
});

// Auto-flush periodically
setInterval(() => {
  monitoring.flush();
}, 30000); // Every 30 seconds

export default monitoring;