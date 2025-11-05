import { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  EyeIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { analyticsService, DashboardMetrics } from '../../services/analytics.service';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { formatPrice } from '../../utils/currency';
import { SalesReportModal } from './SalesReportModal';

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [liveInterval, setLiveInterval] = useState<NodeJS.Timeout | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getDashboardMetrics();
      setMetrics(data);
      setOnlineCount(data.onlineUsers);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const startLiveTracking = () => {
    if (liveInterval) return;

    setIsLiveTracking(true);
    const interval = setInterval(async () => {
      try {
        const count = await analyticsService.getOnlineUsersCount();
        setOnlineCount(count);
      } catch (err) {
        console.error('Error updating online count:', err);
      }
    }, 5000); // Update every 5 seconds

    setLiveInterval(interval);
  };

  const stopLiveTracking = () => {
    if (liveInterval) {
      clearInterval(liveInterval);
      setLiveInterval(null);
    }
    setIsLiveTracking(false);
  };

  const toggleLiveTracking = () => {
    if (isLiveTracking) {
      stopLiveTracking();
    } else {
      startLiveTracking();
    }
  };

  useEffect(() => {
    return () => {
      if (liveInterval) {
        clearInterval(liveInterval);
      }
    };
  }, [liveInterval]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadMetrics}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Analytics data will appear here once you have products and visitors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600">Monitor your store performance and customer engagement</p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <DocumentTextIcon className="w-4 h-4" />
          <span>Sales Report</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Visitors</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
            </div>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalViews}</p>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBagIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sales (30 days)</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.recentSales}</p>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue (30 days)</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(metrics.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Online Users Tracker */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Online Visitors (Last 15 minutes)</h3>
            <p className="text-sm text-gray-600">Real-time visitor tracking</p>
          </div>
          <button
            onClick={toggleLiveTracking}
            className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
              isLiveTracking
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isLiveTracking ? (
              <>
                <PauseIcon className="w-4 h-4" />
                <span>Stop Live</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                <span>Start Live</span>
              </>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isLiveTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isLiveTracking ? 'Live tracking active' : 'Live tracking stopped'}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{onlineCount}</div>
          <span className="text-sm text-gray-600">visitors online</span>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Products</h3>
        {metrics.topProducts.length > 0 ? (
          <div className="space-y-4">
            {metrics.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{product.title}</h4>
                    <p className="text-xs text-gray-600">Product ID: {product.id.slice(-8)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{product.views}</p>
                    <p className="text-gray-600">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{product.wantListAdds}</p>
                    <p className="text-gray-600">Want List Adds</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">No product data available yet</p>
          </div>
        )}
      </div>

      {/* Sales Report Modal */}
      {showReportModal && (
        <SalesReportModal
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}