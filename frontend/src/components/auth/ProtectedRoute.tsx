import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredUserType?: 'seller' | 'buyer';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredUserType, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check user type if specified
  if (requiredUserType && user.type !== requiredUserType) {
    // Redirect to appropriate dashboard based on user type
    const dashboardPath = user.type === 'seller' ? '/seller' : '/buyer';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to their dashboard
  if (isAuthenticated && user) {
    const from = location.state?.from?.pathname;
    if (from) {
      return <Navigate to={from} replace />;
    }
    
    const dashboardPath = user.type === 'seller' ? '/seller' : '/buyer';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}