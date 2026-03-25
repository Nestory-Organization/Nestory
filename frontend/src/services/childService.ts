import apiClient from './apiClient';
import { Child, ApiResponse } from '../types';

class ChildService {
  async addChild(data: {
    name: string;
    age: number;
    avatar?: string;
    family: string;
  }): Promise<Child> {
    const response = await apiClient.getInstance().post<ApiResponse<Child>>(
      '/children',
      data
    );
    return response.data.data!;
  }

  async getChildren(): Promise<Child[]> {
    const response = await apiClient.getInstance().get<ApiResponse<Child[]>>(
      '/children'
    );
    return response.data.data!;
  }

  async getChildById(id: string): Promise<Child> {
    const response = await apiClient.getInstance().get<ApiResponse<Child>>(
      `/children/${id}`
    );
    return response.data.data!;
  }

  async updateChild(id: string, data: Partial<Child>): Promise<Child> {
    const response = await apiClient.getInstance().put<ApiResponse<Child>>(
      `/children/${id}`,
      data
    );
    return response.data.data!;
  }

  async deleteChild(id: string): Promise<void> {
    await apiClient.getInstance().delete(`/children/${id}`);
  }
}

export default new ChildService();
