import apiClient from './apiClient';
import { ReadingSession, ApiResponse } from '../types';

export interface SessionListItem {
  _id: string;
  bookId?: {
    _id: string;
    title: string;
    author: string;
    coverImage?: string;
    pageCount?: number;
  };
  pagesRead: number;
  totalPages: number;
  progress: number;
  timeSpent: number;
  completed: boolean;
  startedAt: string;
  lastUpdatedAt: string;
}

class ReadingService {
  async getMySessions(status?: 'active' | 'completed'): Promise<SessionListItem[]> {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.getInstance().get<ApiResponse<SessionListItem[]>>(
      `/sessions/my-sessions${params}`
    );
    return response.data.data || [];
  }

  async startSession(data: {
    childId: string;
    storyId: string;
  }): Promise<ReadingSession> {
    const response = await apiClient.getInstance().post<ApiResponse<ReadingSession>>(
      '/sessions/start',
      data
    );
    return response.data.data!;
  }

  /** Child account: start or resume a session for a story (no parent flow). */
  async startMySession(body: { storyId: string }): Promise<{ _id: string }> {
    const response = await apiClient.getInstance().post<ApiResponse<{ _id?: string; id?: string }>>(
      '/sessions/start-me',
      body
    );
    const data = response.data.data!;
    const _id = data._id ?? data.id;
    if (!_id) {
      throw new Error('Session id missing from server response');
    }
    return { _id: String(_id) };
  }

  async updateSession(data: {
    sessionId: string;
    pagesRead: number;
    timeSpent: number;
    completed?: boolean;
  }): Promise<ReadingSession> {
    const response = await apiClient.getInstance().post<ApiResponse<ReadingSession>>(
      '/sessions/update',
      data
    );
    return response.data.data!;
  }

  async getWeeklyReadingTime(childId: string): Promise<{ totalTime: number; unit: string }> {
    const response = await apiClient.getInstance().get<ApiResponse<{ totalTime: number; unit: string }>>(
      `/sessions/weekly/${childId}`
    );
    return response.data.data!;
  }

  async getReadingStreak(childId: string): Promise<{ streak: number; longestStreak: number }> {
    const response = await apiClient.getInstance().get<ApiResponse<{ streak: number; longestStreak: number }>>(
      `/sessions/streak/${childId}`
    );
    return response.data.data!;
  }
}

export default new ReadingService();
