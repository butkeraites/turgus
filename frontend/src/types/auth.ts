export interface User {
  id: string;
  type: 'seller' | 'buyer';
  name?: string;
  username?: string;
  telephone?: string;
  address?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username?: string;
  password: string;
  name?: string;
  telephone?: string;
  address?: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials, userType: 'seller' | 'buyer') => Promise<void>;
  register: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}