// Performance monitoring utilities for mobile optimization

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observer?: PerformanceObserver;

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe paint metrics
    if ('PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            switch (entry.entryType) {
              case 'paint':
                if (entry.name === 'first-contentful-paint') {
                  this.metrics.fcp = entry.startTime;
                }
                break;
              case 'largest-contentful-paint':
                this.metrics.lcp = entry.startTime;
                break;
              case 'first-input':
                this.metrics.fid = (entry as any).processingStart - entry.startTime;
                break;
              case 'layout-shift':
                if (!(entry as any).hadRecentInput) {
                  this.metrics.cls = (this.metrics.cls || 0) + (entry as any).value;
                }
                break;
              case 'navigation':
                this.metrics.ttfb = (entry as PerformanceNavigationTiming).responseStart;
                break;
            }
          }
        });

        // Observe different entry types
        this.observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Observe layout shifts
        try {
          this.observer.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // Layout shift not supported
        }

        // Observe first input delay
        try {
          this.observer.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          // First input not supported
        }

        // Observe navigation timing
        try {
          this.observer.observe({ entryTypes: ['navigation'] });
        } catch (e) {
          // Navigation timing not supported
        }
      } catch (e) {
        console.warn('Performance Observer not fully supported');
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Log performance metrics (for development)
  logMetrics() {
    if (import.meta.env.DEV) {
      console.group('Performance Metrics');
      console.log('First Contentful Paint:', this.metrics.fcp?.toFixed(2), 'ms');
      console.log('Largest Contentful Paint:', this.metrics.lcp?.toFixed(2), 'ms');
      console.log('First Input Delay:', this.metrics.fid?.toFixed(2), 'ms');
      console.log('Cumulative Layout Shift:', this.metrics.cls?.toFixed(4));
      console.log('Time to First Byte:', this.metrics.ttfb?.toFixed(2), 'ms');
      console.groupEnd();
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if (import.meta.env.DEV) {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    console.group('Bundle Analysis');
    console.log('Script files:', scripts.length);
    console.log('Stylesheet files:', styles.length);
    
    // Estimate total size (rough approximation)
    let totalEstimatedSize = 0;
    scripts.forEach((script: any) => {
      if (script.src && !script.src.includes('node_modules')) {
        totalEstimatedSize += 50; // Rough estimate in KB
      }
    });
    
    console.log('Estimated bundle size:', totalEstimatedSize, 'KB');
    console.groupEnd();
  }
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
}

// Network information
export function getNetworkInfo() {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  return null;
}

// Image optimization helper
export function getOptimizedImageUrl(baseUrl: string, width: number, quality = 80) {
  const url = new URL(baseUrl);
  url.searchParams.set('w', width.toString());
  url.searchParams.set('q', quality.toString());
  
  // Add WebP support detection
  const supportsWebP = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })();
  
  if (supportsWebP) {
    url.searchParams.set('f', 'webp');
  }
  
  return url.toString();
}

// Preload critical resources
export function preloadCriticalResources() {
  const criticalImages = document.querySelectorAll('img[data-critical]');
  
  criticalImages.forEach((img: any) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = img.src || img.dataset.src;
    document.head.appendChild(link);
  });
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-log metrics after page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logMetrics();
      analyzeBundleSize();
    }, 2000);
  });
}