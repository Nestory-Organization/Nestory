import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';
import authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      authService.setToken(storedToken, JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await authService.login(data);
      authService.setToken(response.token, response.user);
      setToken(response.token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await authService.register(data);
      authService.setToken(response.token, response.user);
      setToken(response.token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    try {
      const updated = await authService.updateProfile(data);
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
