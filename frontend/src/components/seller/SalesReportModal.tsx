import { useState } from 'react';
import { XMarkIcon, CalendarIcon, UserIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { analyticsService, SalesReport } from '../../services/analytics.service';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { formatPrice } from '../../utils/currency';

interface SalesReportModalProps {
  onClose: () => void;
}

export function SalesReportModal({ onClose }: SalesReportModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // Default to last month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
  const [report, setReport] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getSalesReport(
        startDate,
        endDate,
        selectedBuyers.length > 0 ? selectedBuyers : undefined
      );
      setReport(data);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate sales report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (report.length === 0) return;

    const headers = ['Buyer Name', 'Email', 'Total Orders', 'Total Amount', 'Last Order Date'];
    const csvContent = [
      headers.join(','),
      ...report.map(buyer => [
        `"${buyer.buyerName}"`,
        `"${buyer.buyerEmail}"`,
        buyer.totalOrders,
        buyer.totalAmount.toFixed(2),
        new Date(buyer.lastOrderDate).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalRevenue = report.reduce((sum, buyer) => sum + buyer.totalAmount, 0);
  const totalOrders = report.reduce((sum, buyer) => sum + buyer.totalOrders, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Sales Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <UserIcon className="w-4 h-4" />
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {report.length > 0 && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-indigo-700">Total Customers</p>
                  <p className="text-2xl font-bold text-indigo-900">{report.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">Total Orders</p>
                  <p className="text-2xl font-bold text-green-900">{totalOrders}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-yellow-900">{formatPrice(totalRevenue)}</p>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Report Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.map((buyer) => (
                      <tr key={buyer.buyerId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{buyer.buyerName}</div>
                            <div className="text-sm text-gray-500">{buyer.buyerEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {buyer.totalOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(buyer.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(buyer.lastOrderDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => {
                              // Toggle buyer selection for detailed view
                              const isSelected = selectedBuyers.includes(buyer.buyerId);
                              if (isSelected) {
                                setSelectedBuyers(prev => prev.filter(id => id !== buyer.buyerId));
                              } else {
                                setSelectedBuyers(prev => [...prev, buyer.buyerId]);
                              }
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detailed Orders for Selected Buyers */}
              {selectedBuyers.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
                  {report
                    .filter(buyer => selectedBuyers.includes(buyer.buyerId))
                    .map(buyer => (
                      <div key={buyer.buyerId} className="mb-6 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">{buyer.buyerName}</h4>
                        <div className="space-y-3">
                          {buyer.orders.map(order => (
                            <div key={order.id} className="bg-gray-50 p-3 rounded">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-sm font-medium">Order #{order.id.slice(-8)}</p>
                                  <p className="text-xs text-gray-600">{formatDate(order.completedAt)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{formatPrice(order.amount)}</p>
                                  <p className="text-xs text-gray-600">{order.itemCount} items</p>
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                Products: {order.products.map(p => p.title).join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {!loading && report.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sales data</h3>
              <p className="mt-1 text-sm text-gray-500">
                No sales found for the selected date range.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}