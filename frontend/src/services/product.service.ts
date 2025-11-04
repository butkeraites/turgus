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
  async createProduct(productData: CreateProductData): Promise<ProductWithDetails> {
    const response = await axios.post(`${API_BASE_URL}/products`, productData);
    return response.data.data;
  }

  async updateProduct(productId: string, productData: UpdateProductData): Promise<ProductWithDetails> {
    const response = await axios.put(`${API_BASE_URL}/products/${productId}`, productData);
    return response.data.data;
  }

  async deleteProduct(productId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/products/${productId}`);
  }

  async publishProduct(productId: string): Promise<ProductWithDetails> {
    const response = await axios.post(`${API_BASE_URL}/products/${productId}/publish`, {});
    return response.data.data;
  }

  async unpublishProduct(productId: string): Promise<ProductWithDetails> {
    const response = await axios.post(`${API_BASE_URL}/products/${productId}/unpublish`, {});
    return response.data.data;
  }

  async getProduct(productId: string): Promise<ProductWithDetails> {
    const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
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

    const response = await axios.get(`${API_BASE_URL}/products?${params.toString()}`);
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  }

  async getSellerProducts(page = 1, limit = 20): Promise<PaginatedProducts> {
    const response = await axios.get(`${API_BASE_URL}/products/seller?page=${page}&limit=${limit}`);
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  }

  async getCategories(): Promise<Category[]> {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    return response.data.data || response.data;
  }

  async createCategory(data: { name: string; nameEn?: string; namePt?: string }): Promise<Category> {
    const response = await axios.post(`${API_BASE_URL}/categories`, data);
    return response.data.data;
  }

  async recordView(productId: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/products/${productId}/view`, {});
  }
}

export const productService = new ProductService();