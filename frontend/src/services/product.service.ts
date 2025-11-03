import axios from 'axios';
import { 
  ProductWithDetails, 
  CreateProductData, 
  UpdateProductData, 
  ProductFilters, 
  PaginatedProducts,
  Category 
} from '../types/product';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ProductService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async createProduct(productData: CreateProductData): Promise<ProductWithDetails> {
    const response = await axios.post(`${API_BASE_URL}/api/products`, productData, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async updateProduct(productId: string, productData: UpdateProductData): Promise<ProductWithDetails> {
    const response = await axios.put(`${API_BASE_URL}/api/products/${productId}`, productData, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async deleteProduct(productId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/products/${productId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async publishProduct(productId: string): Promise<ProductWithDetails> {
    const response = await axios.post(`${API_BASE_URL}/api/products/${productId}/publish`, {}, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async unpublishProduct(productId: string): Promise<ProductWithDetails> {
    const response = await axios.post(`${API_BASE_URL}/api/products/${productId}/unpublish`, {}, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async getProduct(productId: string): Promise<ProductWithDetails> {
    const response = await axios.get(`${API_BASE_URL}/api/products/${productId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }

  async getProducts(filters?: ProductFilters): Promise<PaginatedProducts> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await axios.get(`${API_BASE_URL}/api/products?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  }

  async getSellerProducts(page = 1, limit = 20): Promise<PaginatedProducts> {
    const response = await axios.get(`${API_BASE_URL}/api/products/seller?page=${page}&limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  }

  async getCategories(): Promise<Category[]> {
    const response = await axios.get(`${API_BASE_URL}/api/categories`);
    return response.data.data || response.data;
  }

  async recordView(productId: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/api/products/${productId}/view`, {}, {
      headers: this.getAuthHeaders(),
    });
  }
}

export const productService = new ProductService();