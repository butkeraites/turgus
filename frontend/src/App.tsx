
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { HomePage } from './components/home/HomePage';
import { AuthPage } from './components/auth/AuthPage';
import { SellerDashboard } from './components/dashboard/SellerDashboard';
import { BuyerDashboard } from './components/dashboard/BuyerDashboard';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          
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
            
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;