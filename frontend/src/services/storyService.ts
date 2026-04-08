import apiClient from './apiClient';
import { Story, ApiResponse } from '../types';
import { normalizeStory, normalizeStoryList } from '../utils/storyLibrary/storyMapper';

type StoryFilters = {
  ageGroup?: string;
  readingLevel?: string;
  genre?: string;
  search?: string;
};

type StoryListResult = {
  stories: Story[];
  total: number;
  page: number;
  pages: number;
};

interface StoryListPayload {
  data?: Story[];
  stories?: Story[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}

class StoryService {
  async searchGoogle(query: string): Promise<any[]> {
    const response = await apiClient.getInstance().get(
      `/stories/google/search?q=${encodeURIComponent(query)}`
    );
    return response.data.data || [];
  }

  async importFromGoogle(
    googleBookId: string,
    body: {
      ageGroup: string;
      genres: string[];
      readingLevel: string;
    }
  ): Promise<Story> {
    const response = await apiClient.getInstance().post<ApiResponse<any>>(
      `/stories/google/import/${googleBookId}`,
      body
    );
    return normalizeStory(response.data.data);
  }

  async syncStoryMetadata(storyId: string): Promise<Story> {
    const response = await apiClient.getInstance().put<ApiResponse<any>>(
      `/stories/google/sync/${storyId}`
    );
    return normalizeStory(response.data.data);
  }

  async getStories(
    page: number = 1,
    limit: number = 12,
    filters?: StoryFilters
  ): Promise<StoryListResult> {
    let url = `/stories?page=${page}&limit=${limit}`;

    const response = await apiClient.getInstance().get<ApiResponse<StoryListPayload>>(url);
    const payload = response.data.data || {};

    const stories = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.stories)
        ? payload.stories
        : [];

    const meta = payload.pagination || payload.meta;

    return {
      success: true,
      data: stories,
      pagination: {
        page: Number(meta?.page) || page,
        limit: Number(meta?.limit) || limit,
        total: Number(meta?.total) || stories.length,
        pages: Number(meta?.pages) || 1,
      },
    };
  }

  async getStoryById(id: string): Promise<Story> {
    const response = await apiClient.getInstance().get<ApiResponse<any>>(
      `/stories/${id}`
    );
    return normalizeStory(response.data.data);
  }

  async createStory(data: Partial<Story>): Promise<Story> {
    const response = await apiClient.getInstance().post<ApiResponse<any>>(
      '/stories',
      data
    );
    return normalizeStory(response.data.data);
  }

  async updateStory(id: string, data: Partial<Story>): Promise<Story> {
    const response = await apiClient.getInstance().put<ApiResponse<any>>(
      `/stories/${id}`,
      data
    );
    return normalizeStory(response.data.data);
  }

  async deleteStory(id: string): Promise<void> {
    await apiClient.getInstance().delete(`/stories/${id}`);
  }
}

export default new StoryService();