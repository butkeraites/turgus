import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleHome = () => {
    if (isAuthenticated && user) {
      const dashboardPath = user.type === 'seller' ? '/seller' : '/buyer';
      navigate(dashboardPath);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <button
            onClick={handleHome}
            className="text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
          >
            Turgus
          </button>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="text-sm text-gray-600">
                  Welcome, {user.name || user.username}
                  <span className="ml-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {user.type}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}