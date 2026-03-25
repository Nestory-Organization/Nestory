import apiClient from './apiClient';
import { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types';

interface BackendAuthPayload {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'parent' | 'admin' | 'child';
  profilePicture?: string;
  phoneNumber?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  token?: string;
}

class AuthService {
  private normalizeRole(role?: string): User['role'] {
    if (role === 'user' || role === 'parent') return 'parent';
    if (role === 'admin' || role === 'child') return role;
    return 'parent';
  }

  private mapRegisterRoleForBackend(role: RegisterRequest['role']): 'user' | 'admin' {
    return role === 'parent' ? 'user' : 'admin';
  }

  private normalizeUser(payload: BackendAuthPayload): User {
    return {
      id: payload.id || payload._id || '',
      name: payload.name || '',
      email: payload.email || '',
      role: this.normalizeRole(payload.role),
      profilePicture: payload.profilePicture,
      phoneNumber: payload.phoneNumber,
      isActive: payload.isActive ?? true,
      createdAt: payload.createdAt || new Date().toISOString(),
      updatedAt: payload.updatedAt || new Date().toISOString(),
    };
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.getInstance().post<ApiResponse<BackendAuthPayload>>(
      '/auth/register',
      {
        ...data,
        role: this.mapRegisterRoleForBackend(data.role),
      }
    );

    const payload = response.data.data!;
    return {
      user: this.normalizeUser(payload),
      token: payload.token || '',
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.getInstance().post<ApiResponse<BackendAuthPayload>>(
      '/auth/login',
      data
    );

    const payload = response.data.data!;
    return {
      user: this.normalizeUser(payload),
      token: payload.token || '',
    };
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.getInstance().get<ApiResponse<BackendAuthPayload>>(
      '/auth/me'
    );
    return this.normalizeUser(response.data.data!);
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.getInstance().put<ApiResponse<BackendAuthPayload>>(
      '/auth/profile',
      data
    );
    return this.normalizeUser(response.data.data!);
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
