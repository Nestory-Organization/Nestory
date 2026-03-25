import apiClient from './apiClient';
import { Assignment, ApiResponse } from '../types';

class AssignmentService {
  async createAssignment(data: {
    childId: string;
    storyId: string;
    dueDate?: string;
    notes?: string;
  }): Promise<Assignment> {
    const response = await apiClient.getInstance().post<ApiResponse<Assignment>>(
      '/assignments',
      data
    );
    return response.data.data!;
  }

  async getFamilyAssignments(): Promise<Assignment[]> {
    const response = await apiClient.getInstance().get<ApiResponse<Assignment[]>>(
      '/assignments/family'
    );
    return response.data.data!;
  }

  async getChildAssignments(childId: string): Promise<Assignment[]> {
    const response = await apiClient.getInstance().get<ApiResponse<Assignment[]>>(
      `/assignments/child/${childId}`
    );
    return response.data.data!;
  }

  async getAssignmentById(id: string): Promise<Assignment> {
    const response = await apiClient.getInstance().get<ApiResponse<Assignment>>(
      `/assignments/${id}`
    );
    return response.data.data!;
  }

  async updateAssignmentStatus(
    id: string,
    status: 'assigned' | 'in_progress' | 'completed'
  ): Promise<Assignment> {
    const response = await apiClient.getInstance().put<ApiResponse<Assignment>>(
      `/assignments/${id}/status`,
      { status }
    );
    return response.data.data!;
  }

  async deleteAssignment(id: string): Promise<void> {
    await apiClient.getInstance().delete(`/assignments/${id}`);
  }
}

export default new AssignmentService();
