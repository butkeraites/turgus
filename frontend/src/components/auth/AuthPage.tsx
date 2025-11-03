import { useState } from 'react';
import { SellerLogin } from './SellerLogin';
import { BuyerLogin } from './BuyerLogin';
import { BuyerRegistration } from './BuyerRegistration';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'select' | 'seller-login' | 'buyer-login' | 'buyer-register';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('select');
  const navigate = useNavigate();

  const handleSellerAuthSuccess = () => {
    navigate('/seller');
  };

  const handleBuyerAuthSuccess = () => {
    navigate('/buyer');
  };

  const handleCancel = () => {
    setMode('select');
  };

  if (mode === 'seller-login') {
    return (
      <SellerLogin 
        onSuccess={handleSellerAuthSuccess}
        onCancel={handleCancel}
      />
    );
  }

  if (mode === 'buyer-login') {
    return (
      <BuyerLogin 
        onSuccess={handleBuyerAuthSuccess}
        onCancel={handleCancel}
        onSwitchToRegister={() => setMode('buyer-register')}
      />
    );
  }

  if (mode === 'buyer-register') {
    return (
      <BuyerRegistration 
        onSuccess={handleBuyerAuthSuccess}
        onCancel={handleCancel}
        onSwitchToLogin={() => setMode('buyer-login')}
      />
    );
  }

  // Default selection screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Turgus
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose how you'd like to access the marketplace
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => setMode('seller-login')}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="text-center">
              <div className="font-semibold">Seller Access</div>
              <div className="text-xs text-indigo-200">Manage your products and sales</div>
            </div>
          </button>
          
          <button
            onClick={() => setMode('buyer-login')}
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="text-center">
              <div className="font-semibold">Buyer Sign In</div>
              <div className="text-xs text-gray-500">Access your existing account</div>
            </div>
          </button>
          
          <button
            onClick={() => setMode('buyer-register')}
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="text-center">
              <div className="font-semibold">New Buyer</div>
              <div className="text-xs text-gray-500">Create a new buyer account</div>
            </div>
          </button>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}