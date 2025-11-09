import axios from 'axios';
import { LoginCredentials, User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.setAuthHeader(this.token);
    }
    
    // Add response interceptor to handle auth errors silently
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Silently handle 401/403 for /auth/me endpoint when checking initial auth state
        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          error.config?.url?.includes('/auth/me')
        ) {
          // Don't log these errors to console - they're expected when user is not authenticated
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    );
  }

  private setAuthHeader(token: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private removeAuthHeader() {
    delete axios.defaults.headers.common['Authorization'];
  }

  async loginSeller(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/seller/login`, {
      username: credentials.username,
      password: credentials.password,
    });
    
    const { user, token } = response.data.data;
    // Map userType to type for frontend compatibility
    const mappedUser = {
      ...user,
      type: user.userType
    };
    
    this.token = token;
    localStorage.setItem('auth_token', token);
    this.setAuthHeader(token);
    
    return { user: mappedUser, token };
  }

  async loginBuyer(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/buyer/login`, {
      telephone: credentials.telephone,
      password: credentials.password,
    });
    
    const { user, token } = response.data.data;
    // Map userType to type for frontend compatibility
    const mappedUser = {
      ...user,
      type: user.userType
    };
    
    this.token = token;
    localStorage.setItem('auth_token', token);
    this.setAuthHeader(token);
    
    return { user: mappedUser, token };
  }

  async registerBuyer(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/buyer/register`, {
      name: credentials.name,
      telephone: credentials.telephone,
      address: credentials.address,
      password: credentials.password,
    });
    
    const { user, token } = response.data.data;
    // Map userType to type for frontend compatibility
    const mappedUser = {
      ...user,
      type: user.userType
    };
    
    this.token = token;
    localStorage.setItem('auth_token', token);
    this.setAuthHeader(token);
    
    return { user: mappedUser, token };
  }

  async getCurrentUser(): Promise<User> {
    if (!this.token) {
      throw new Error('No token available');
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      const user = response.data.data || response.data.user;
      // Map userType to type for frontend compatibility
      return {
        ...user,
        type: user.userType
      };
    } catch (error: any) {
      // If token is invalid, clear it
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.logout();
      }
      throw error;
    }
  }

  async refreshToken(): Promise<string> {
    // For now, we'll just validate the current token
    // In a real implementation, you might have a refresh endpoint
    if (!this.token) {
      throw new Error('No token available');
    }
    
    await this.getCurrentUser(); // This will throw if token is invalid
    return this.token;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    this.removeAuthHeader();
  }

  getToken(): string | null {
    return this.token;
  }
}

export const authService = new AuthService();