import apiClient from './apiClient';
import {
  ApiResponse,
  MyReadingSessionRow,
  BookReadingProgress,
  ReadingActivitySummary,
} from '../types';

export type SessionListItem = MyReadingSessionRow;

class ReadingService {
  /** Parent: pass childId + storyId. Child: storyId only. */
  async startSession(data: {
    childId?: string;
    storyId?: string;
    bookId?: string;
    totalPages?: number;
  }): Promise<Record<string, unknown>> {
    const response = await apiClient.getInstance().post<
      ApiResponse<Record<string, unknown>>
    >('/sessions/start', data);
    return response.data.data!;
  }

  /** Start session for logged-in child; returns new session id. */
  async startMySession(body: { storyId: string }): Promise<{ _id: string }> {
    const data = await this.startSession({ storyId: body.storyId });
    const id = (data as { _id?: string })._id;
    if (!id) throw new Error('No session id returned');
    return { _id: String(id) };
  }

  async updateSession(data: {
    sessionId: string;
    pagesRead?: number;
    timeSpent?: number;
    completed?: boolean;
  }): Promise<{ session: Record<string, unknown>; progress: number }> {
    const response = await apiClient.getInstance().post<
      ApiResponse<{ session: Record<string, unknown>; progress: number }>
    >('/sessions/update', data);
    return response.data.data!;
  }

  async getMySessions(status?: 'active' | 'completed'): Promise<MyReadingSessionRow[]> {
    const response = await apiClient.getInstance().get<ApiResponse<MyReadingSessionRow[]>>(
      '/sessions/my-sessions',
      { params: status ? { status } : undefined }
    );
    return response.data.data ?? [];
  }

  async getProgressByBook(bookId: string): Promise<BookReadingProgress> {
    const response = await apiClient.getInstance().get<ApiResponse<BookReadingProgress>>(
      `/sessions/progress/${bookId}`
    );
    return response.data.data!;
  }

  async getMyActivitySummary(days = 7): Promise<ReadingActivitySummary> {
    const response = await apiClient.getInstance().get<ApiResponse<ReadingActivitySummary>>(
      '/sessions/me/activity-summary',
      { params: { days } }
    );
    return response.data.data!;
  }

  async getFamilyActivitySummary(days = 7): Promise<ReadingActivitySummary> {
    const response = await apiClient.getInstance().get<ApiResponse<ReadingActivitySummary>>(
      '/sessions/activity-summary/family',
      { params: { days } }
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
