import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import LanguageToggle from '../shared/LanguageToggle';
import { Container } from './Container';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleLogin = () => {
    navigate('/auth');
    setMobileMenuOpen(false);
  };

  const handleHome = () => {
    if (isAuthenticated && user) {
      const dashboardPath = user.type === 'seller' ? '/seller' : '/buyer';
      navigate(dashboardPath);
    } else {
      navigate('/');
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm safe-area-inset-top">
      <Container>
        <div className="flex justify-between items-center py-3 md:py-4">
          {/* Logo */}
          <button
            onClick={handleHome}
            className="text-xl md:text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors touch-manipulation"
          >
            Turgus
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageToggle />
            
            {isAuthenticated && user ? (
              <>
                <div className="text-sm text-gray-600 hidden lg:block">
                  Welcome, {user.name || user.username}
                  <span className="ml-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {user.type}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors touch-manipulation"
                >
                  {t('buttons.logout')}
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md transition-colors touch-manipulation"
              >
                {t('buttons.login')}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 touch-manipulation"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              {isAuthenticated && user ? (
                <>
                  <div className="text-sm text-gray-600 px-2">
                    Welcome, {user.name || user.username}
                    <span className="ml-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {user.type}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-2 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors touch-manipulation"
                  >
                    {t('buttons.logout')}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="block w-full text-left px-2 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors touch-manipulation"
                >
                  {t('buttons.login')}
                </button>
              )}
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}