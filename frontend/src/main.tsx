import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { register as registerSW } from './utils/serviceWorker'
import { performanceMonitor, preloadCriticalResources } from './utils/performance'

// Register service worker for PWA capabilities
registerSW({
  onSuccess: () => {
    console.log('Service worker registered successfully');
  },
  onUpdate: () => {
    console.log('New content available, please refresh');
    // You could show a toast notification here
  }
});

// Initialize performance monitoring
performanceMonitor;

// Preload critical resources
preloadCriticalResources();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)