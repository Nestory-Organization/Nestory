import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import { BookOpen, Flame, Award, CalendarDays, BarChart3, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import StoryService from '../../services/storyService';
import AssignmentService from '../../services/assignmentService';
import ReadingService from '../../services/readingService';
import { Story, Assignment, MyReadingSessionRow } from '../../types';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80';

const normalizeCoverImage = (url?: string) => {
  if (!url || !url.trim()) return FALLBACK_COVER;
  return url.replace(/^http:\/\//i, 'https://');
};

const ChildDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeSessions, setActiveSessions] = useState<MyReadingSessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingReadKey, setStartingReadKey] = useState<string | null>(null);

  const beginReadByStoryId = async (storyId: string | undefined, loadingKey: string) => {
    if (!storyId?.trim()) {
      toast.error('This book is not available to open yet.');
      return;
    }
    try {
      setStartingReadKey(loadingKey);
      const { _id } = await ReadingService.startMySession({ storyId });
      navigate(`/child/read/${_id}`);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Could not open this book';
      toast.error(message || 'Could not open this book');
    } finally {
      setStartingReadKey(null);
    }
  };

  useEffect(() => {
    const loadStories = async () => {
      try {
        setIsLoading(true);
        const [response, childAssignments, sessions] = await Promise.all([
          StoryService.getStories(1, 24),
          AssignmentService.getMyAssignments(),
          ReadingService.getMySessions('active').catch(() => [] as MyReadingSessionRow[]),
        ]);

        const normalizedStories = (response.stories || []).map((story) => ({
          ...story,
          coverImage: normalizeCoverImage(story.coverImage),
        }));

        setStories(normalizedStories);
        setAssignments(childAssignments || []);
        setActiveSessions(sessions);
      } catch (error: unknown) {
        const message =
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
            'string'
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Failed to load child dashboard';

        toast.error(message || 'Failed to load child dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [location.key]);

  const beginnerCount = useMemo(
    () => stories.filter((story) => story.readingLevel === 'beginner').length,
    [stories]
  );

  const middleGradeCount = useMemo(
    () => stories.filter((story) => story.ageGroup === 'middle-grade').length,
    [stories]
  );

  const assignmentStats = useMemo(() => {
    const assigned = assignments.filter((item) => item.status === 'assigned').length;
    const inProgress = assignments.filter((item) => item.status === 'in_progress').length;
    const completed = assignments.filter((item) => item.status === 'completed').length;

    return {
      total: assignments.length,
      assigned,
      inProgress,
      completed,
    };
  }, [assignments]);

  const pendingAssignments = useMemo(
    () => assignments.filter((item) => item.status !== 'completed').slice(0, 6),
    [assignments]
  );

  const sessionStoryId = (row: MyReadingSessionRow): string => {
    const ref = row.bookId;
    if (ref && typeof ref === 'object' && '_id' in ref) return String(ref._id);
    return typeof ref === 'string' ? ref : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="My Reading" />

      <div className="container-responsive py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Welcome, {user?.name || 'Reader'}
          </h1>
          <p className="text-gray-600">
            You can open and read only books your parent assigns. Start from My Assigned Stories below.
          </p>
          <button
            type="button"
            onClick={() => navigate('/child/progress')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-nestory-600 text-white text-sm font-semibold hover:bg-nestory-700 transition-colors"
          >
            <BarChart3 size={18} />
            View my reading progress
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Stories Available"
            value={isLoading ? '...' : stories.length}
            icon={BookOpen}
            color="blue"
            subtext="In your library"
          />
          <StatCard
            title="Beginner Friendly"
            value={isLoading ? '...' : beginnerCount}
            icon={Flame}
            color="orange"
            subtext="Easy stories"
          />
          <StatCard
            title="Middle Grade"
            value={isLoading ? '...' : middleGradeCount}
            icon={Award}
            color="green"
            subtext="Age-fit picks"
          />
          <StatCard
            title="Assigned to you"
            value={isLoading ? '...' : assignmentStats.total}
            icon={ListChecks}
            color="purple"
            subtext="From your parent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">My Assignments</p>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? '...' : assignmentStats.total}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Assigned</p>
            <p className="text-2xl font-bold text-blue-700">
              {isLoading ? '...' : assignmentStats.assigned}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-amber-700">
              {isLoading ? '...' : assignmentStats.inProgress}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-700">
              {isLoading ? '...' : assignmentStats.completed}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="text-nestory-600" size={22} />
                <h2 className="text-xl font-bold text-gray-900">Your reading progress</h2>
              </div>

              {isLoading ? (
                <p className="text-gray-600">Loading progress...</p>
              ) : activeSessions.length === 0 ? (
                <p className="text-gray-600">
                  When you open an assigned book, it appears here so you can continue reading.
                </p>
              ) : (
                <ul className="space-y-4">
                  {activeSessions.map((row) => {
                    const sid = sessionStoryId(row);
                    const book = row.bookId;
                    const title =
                      book && typeof book === 'object' && 'title' in book && book.title
                        ? book.title
                        : 'Book';
                    const author =
                      book && typeof book === 'object' && 'author' in book ? book.author : undefined;
                    return (
                      <li key={row._id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">{title}</p>
                          {author ? <p className="text-sm text-gray-600">{author}</p> : null}
                          <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden max-w-md">
                            <div
                              className="h-full rounded-full bg-nestory-600 transition-all"
                              style={{ width: `${Math.min(100, row.progress)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {row.pagesRead} / {row.totalPages} pages ({Math.round(row.progress)}%)
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={!sid || startingReadKey !== null}
                          onClick={() => sid && navigate(`/child/read/${row._id}`)}
                          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-nestory-600 text-white text-sm font-semibold hover:bg-nestory-700 disabled:opacity-50 transition-colors"
                        >
                          Continue reading
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="text-nestory-600" size={22} />
                <h2 className="text-xl font-bold text-gray-900">My Assigned Stories</h2>
              </div>

              {isLoading ? (
                <p className="text-gray-600">Loading assignments...</p>
              ) : pendingAssignments.length === 0 ? (
                <p className="text-gray-600">
                  No active assignments yet. Great job keeping up!
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingAssignments.map((assignment) => {
                    const assignmentStoryId =
                      assignment.storyId || assignment.story?._id || assignment.story?.id;
                    const readKey = `a-${assignment.id}`;
                    return (
                      <div
                        key={assignment.id}
                        className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 hover:border-nestory-300 hover:bg-nestory-50/40 transition-colors sm:flex-row sm:items-center sm:justify-between"
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/child/assignments/${assignment.id}`)}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="font-semibold text-gray-900">
                            {assignment.story?.title || 'Untitled story'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {assignment.story?.author || 'Unknown author'}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="badge bg-blue-100 text-blue-800 capitalize">
                              {assignment.status.replace('_', ' ')}
                            </span>
                            {assignment.dueDate && (
                              <span className="badge bg-gray-100 text-gray-700">
                                Due {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => beginReadByStoryId(assignmentStoryId, readKey)}
                          disabled={startingReadKey !== null}
                          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-nestory-600 text-white text-sm font-semibold hover:bg-nestory-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {startingReadKey === readKey ? 'Opening…' : 'Read book'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reading Tips</h2>
            <div className="space-y-3">
              {[
                { emoji: '📘', text: 'Read 15 minutes daily' },
                { emoji: '📝', text: 'Tell a parent what you learned' },
                { emoji: '🎯', text: 'Finish one story this week' },
              ].map((achievement) => (
                <div
                  key={achievement.text}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center gap-3"
                >
                  <span className="text-xl">{achievement.emoji}</span>
                  <span className="font-medium text-gray-700">{achievement.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildDashboard;
