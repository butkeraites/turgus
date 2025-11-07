import axios from 'axios';
import { WantList, WantListWithBuyer, AddToWantListData } from '../types/wantList';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class WantListService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Buyer methods
  async getBuyerWantList(): Promise<WantList> {
    const response = await axios.get(`${API_BASE_URL}/want-lists`, {
      headers: this.getAuthHeaders(),
    });
    
    // Transform backend response to match frontend types
    const data = response.data.data;
    return {
      id: data.id,
      buyerId: data.buyer_id,
      status: data.status,
      items: data.items || [],
      totalPrice: data.total_price || 0,
      itemCount: data.item_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async addToWantList(productId: string): Promise<void> {
    const data: AddToWantListData = { product_id: productId };
    await axios.post(`${API_BASE_URL}/want-lists/items`, data, {
      headers: this.getAuthHeaders(),
    });
    
    // Track want list add for analytics (silently fail if it doesn't work)
    try {
      await axios.post(`${API_BASE_URL}/analytics/track/want-list-add/${productId}`, {}, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.warn('Failed to track want list add:', error);
    }
  }

  async removeFromWantList(itemId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/want-lists/items/${itemId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Seller methods
  async getSellerWantLists(): Promise<WantListWithBuyer[]> {
    const response = await axios.get(`${API_BASE_URL}/want-lists/seller`, {
      headers: this.getAuthHeaders(),
    });
    
    // Return data as-is since types use snake_case
    return response.data.data.map((wantList: any) => ({
      id: wantList.id,
      buyer_id: wantList.buyer_id,
      status: wantList.status,
      items: wantList.items || [],
      total_price: wantList.total_price || 0,
      item_count: wantList.item_count || 0,
      created_at: wantList.created_at,
      updated_at: wantList.updated_at,
      buyer: wantList.buyer,
    }));
  }

  async cancelWantList(wantListId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/want-lists/seller/${wantListId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async completeWantList(wantListId: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/want-lists/seller/${wantListId}/complete`, {}, {
      headers: this.getAuthHeaders(),
    });
  }
}

export const wantListService = new WantListService();