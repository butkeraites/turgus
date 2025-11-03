import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Container } from '../layout/Container';

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated && user) {
      const dashboardPath = user.type === 'seller' ? '/seller' : '/buyer';
      navigate(dashboardPath);
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen-mobile bg-gray-50">
      <Container className="py-8 md:py-16">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
            Welcome to Turgus Marketplace
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
            A mobile-first bilingual marketplace platform where sellers can showcase products 
            through a photo-centric workflow and buyers can discover items with an Instagram-like experience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-6 md:px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors touch-manipulation"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            </button>
            
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto px-6 md:px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">For Sellers</h3>
            <ul className="text-gray-600 space-y-2 text-sm md:text-base">
              <li>• Upload multiple photos at once</li>
              <li>• Create detailed product listings</li>
              <li>• Manage orders and want lists</li>
              <li>• Track sales performance</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">For Buyers</h3>
            <ul className="text-gray-600 space-y-2 text-sm md:text-base">
              <li>• Browse Instagram-like product feed</li>
              <li>• Filter and sort products</li>
              <li>• Create and manage want lists</li>
              <li>• Bilingual support (Portuguese/English)</li>
            </ul>
          </div>
        </div>
      </Container>
    </div>
  );
}