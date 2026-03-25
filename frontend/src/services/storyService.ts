import apiClient from './apiClient';
import { Story, ApiResponse, PaginatedResponse } from '../types';

class StoryService {
  async searchGoogle(query: string): Promise<any[]> {
    const response = await apiClient.getInstance().get(
      `/stories/google/search?q=${encodeURIComponent(query)}`
    );
    return response.data.data || [];
  }

  async importFromGoogle(googleBookId: string): Promise<Story> {
    const response = await apiClient.getInstance().post<ApiResponse<Story>>(
      `/stories/google/import/${googleBookId}`
    );
    return response.data.data!;
  }

  async syncStoryMetadata(storyId: string): Promise<Story> {
    const response = await apiClient.getInstance().put<ApiResponse<Story>>(
      `/stories/google/sync/${storyId}`
    );
    return response.data.data!;
  }

  async getStories(
    page: number = 1,
    limit: number = 12,
    filters?: {
      ageGroup?: string;
      readingLevel?: string;
      genre?: string;
    }
  ): Promise<PaginatedResponse<Story>> {
    let url = `/stories?page=${page}&limit=${limit}`;
    if (filters?.ageGroup) url += `&ageGroup=${filters.ageGroup}`;
    if (filters?.readingLevel) url += `&readingLevel=${filters.readingLevel}`;
    if (filters?.genre) url += `&genre=${filters.genre}`;

    const response = await apiClient.getInstance().get<ApiResponse<PaginatedResponse<Story>>>(url);
    return response.data.data!;
  }

  async getStoryById(id: string): Promise<Story> {
    const response = await apiClient.getInstance().get<ApiResponse<Story>>(
      `/stories/${id}`
    );
    return response.data.data!;
  }

  async checkStoryAccess(storyId: string, childId: string): Promise<{ canAccess: boolean }> {
    const response = await apiClient.getInstance().get<ApiResponse<{ canAccess: boolean }>>(
      `/stories/${storyId}/access/${childId}`
    );
    return response.data.data!;
  }

  async createStory(data: Partial<Story>): Promise<Story> {
    const response = await apiClient.getInstance().post<ApiResponse<Story>>(
      '/stories',
      data
    );
    return response.data.data!;
  }

  async updateStory(id: string, data: Partial<Story>): Promise<Story> {
    const response = await apiClient.getInstance().put<ApiResponse<Story>>(
      `/stories/${id}`,
      data
    );
    return response.data.data!;
  }

  async deleteStory(id: string): Promise<void> {
    await apiClient.getInstance().delete(`/stories/${id}`);
  }
}

export default new StoryService();
