
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Header } from './components/layout/Header';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { HomePage } from './components/home/HomePage';
import { AuthPage } from './components/auth/AuthPage';
import { SellerDashboard } from './components/dashboard/SellerDashboard';
import { BuyerDashboard } from './components/dashboard/BuyerDashboard';
import { ProductDetail } from './components/buyer/ProductDetail';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { analyticsService } from './services/analytics.service';

function AppContent() {
  // Handle viewport height changes on mobile and start analytics tracking
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Start online session tracking
    const stopOnlineTracking = analyticsService.startOnlineTracking();

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
      stopOnlineTracking();
    };
  }, []);

  return (
    <div className="min-h-screen-mobile bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          
          {/* Auth routes - redirect if already authenticated */}
          <Route 
            path="/auth" 
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } 
          />
          
          {/* Protected seller routes */}
          <Route 
            path="/seller" 
            element={
              <ProtectedRoute requiredUserType="seller">
                <SellerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected buyer routes */}
          <Route 
            path="/buyer" 
            element={
              <ProtectedRoute requiredUserType="buyer">
                <BuyerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/buyer/product/:productId" 
            element={
              <ProtectedRoute requiredUserType="buyer">
                <ProductDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;