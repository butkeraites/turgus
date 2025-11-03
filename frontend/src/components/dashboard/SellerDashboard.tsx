import { useAuth } from '../../contexts/AuthContext';

export function SellerDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Seller Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome back, {user?.username}! Manage your products and sales from here.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-900">Products</h3>
              <p className="text-sm text-indigo-700">Manage your product listings</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Orders</h3>
              <p className="text-sm text-green-700">View buyer want lists</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Analytics</h3>
              <p className="text-sm text-purple-700">Track your sales performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}