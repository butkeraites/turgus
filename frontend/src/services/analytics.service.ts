import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface DashboardMetrics {
  totalUsers: number;
  totalProducts: number;
  totalViews: number;
  onlineUsers: number;
  recentSales: number;
  totalRevenue: number;
  topProducts: Array<{
    id: string;
    title: string;
    views: number;
    wantListAdds: number;
  }>;
}

export interface SalesReport {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  totalOrders: number;
  totalAmount: number;
  lastOrderDate: string;
  orders: Array<{
    id: string;
    completedAt: string;
    amount: number;
    itemCount: number;
    products: Array<{
      id: string;
      title: string;
      price: number;
    }>;
  }>;
}

class AnalyticsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private getSessionId(): string {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await axios.get(`${API_BASE_URL}/analytics/dashboard`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async getOnlineUsersCount(): Promise<number> {
    const response = await axios.get(`${API_BASE_URL}/analytics/online-users`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data.count;
  }

  async getSalesReport(
    startDate: string,
    endDate: string,
    buyerIds?: string[]
  ): Promise<SalesReport[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    if (buyerIds && buyerIds.length > 0) {
      buyerIds.forEach(id => params.append('buyerIds', id));
    }

    const response = await axios.get(`${API_BASE_URL}/analytics/sales-report?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async trackProductView(productId: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/analytics/track/product/${productId}`, {}, {
        headers: {
          ...this.getAuthHeaders(),
          'X-Session-Id': this.getSessionId(),
        },
      });
    } catch (error) {
      // Silently fail for tracking
      console.warn('Failed to track product view:', error);
    }
  }

  async updateOnlineSession(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/analytics/track/session`, {}, {
        headers: {
          ...this.getAuthHeaders(),
          'X-Session-Id': this.getSessionId(),
        },
      });
    } catch (error) {
      // Silently fail for tracking
      console.warn('Failed to update online session:', error);
    }
  }

  // Start heartbeat for online tracking
  startOnlineTracking(): () => void {
    const interval = setInterval(() => {
      this.updateOnlineSession();
    }, 30000); // Update every 30 seconds

    // Initial update
    this.updateOnlineSession();

    // Return cleanup function
    return () => clearInterval(interval);
  }
}

export const analyticsService = new AnalyticsService();