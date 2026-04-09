import apiClient from './apiClient';
import { ReadingSession, ApiResponse, BookReadingProgress, ReadingActivitySummary } from '../types';

class ReadingService {
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
}

export default new ReadingService();
