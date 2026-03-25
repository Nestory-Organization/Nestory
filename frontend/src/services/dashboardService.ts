import apiClient from './apiClient';
import { FamilyDashboard, ChildDashboard, ApiResponse } from '../types';

class DashboardService {
  async getFamilyDashboard(): Promise<FamilyDashboard> {
    const response = await apiClient.getInstance().get<ApiResponse<FamilyDashboard>>(
      '/dashboard/family'
    );
    return response.data.data!;
  }

  async getChildDashboard(childId: string): Promise<ChildDashboard> {
    const response = await apiClient.getInstance().get<ApiResponse<ChildDashboard>>(
      `/dashboard/child/${childId}`
    );
    return response.data.data!;
  }

  async getFamilySummary(): Promise<any> {
    const response = await apiClient.getInstance().get(
      '/dashboard/summary'
    );
    return response.data.data;
  }
}

export default new DashboardService();
