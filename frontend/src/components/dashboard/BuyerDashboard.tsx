import { useAuth } from '../../contexts/AuthContext';

export function BuyerDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Buyer Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome back, {user?.name}! Browse products and manage your want list.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Browse Products</h3>
              <p className="text-sm text-blue-700">Discover new items in the marketplace</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900">Want List</h3>
              <p className="text-sm text-orange-700">Manage your selected products</p>
            </div>
            
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-semibold text-teal-900">Profile</h3>
              <p className="text-sm text-teal-700">Update your account information</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}