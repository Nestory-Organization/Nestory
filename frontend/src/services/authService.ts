import apiClient from './apiClient';
import { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types';

class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.getInstance().post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data
    );
    return response.data.data!;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.getInstance().post<ApiResponse<AuthResponse>>(
      '/auth/login',
      data
    );
    return response.data.data!;
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.getInstance().get<ApiResponse<User>>(
      '/auth/me'
    );
    return response.data.data!;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.getInstance().put<ApiResponse<User>>(
      '/auth/profile',
      data
    );
    return response.data.data!;
  }

  logout(): void {
    apiClient.clearToken();
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string, user: User): void {
    apiClient.setToken(token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export default new AuthService();
