import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import StoryCard from '../../components/common/StoryCard';
import { BookOpen, Flame, Clock, Award, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import StoryService from '../../services/storyService';
import AssignmentService from '../../services/assignmentService';
import { Story, Assignment } from '../../types';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80';

const DETAIL_ROUTE_BASE = '/story';

const normalizeCoverImage = (url?: string) => {
  if (!url || !url.trim()) return FALLBACK_COVER;
  return url.replace(/^http:\/\//i, 'https://');
};

const normalizeText = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const ChildDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      try {
        setIsLoading(true);
        const [response, childAssignments] = await Promise.all([
          StoryService.getStories(1, 24),
          AssignmentService.getMyAssignments(),
        ]);

        const normalizedStories = (response.stories || []).map((story) => ({
          ...story,
          coverImage: normalizeCoverImage(story.coverImage),
        }));

        setStories(normalizedStories);
        setAssignments(childAssignments || []);
      } catch (error: unknown) {
        const message =
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Failed to load child dashboard';

        toast.error(message || 'Failed to load child dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, []);

  const beginnerCount = useMemo(
    () => stories.filter((story) => story.readingLevel === 'beginner').length,
    [stories]
  );

  const middleGradeCount = useMemo(
    () => stories.filter((story) => story.ageGroup === 'middle-grade').length,
    [stories]
  );

  const quickPicks = useMemo(() => stories.slice(0, 6), [stories]);

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

  const findGooglePreviewForManualStory = async (
    story: Partial<Story>
  ): Promise<string | null> => {
    const title = normalizeText(story.title);
    const author = normalizeText(story.author);

    const searchTerms = [
      `${story.title || ''} ${story.author || ''}`.trim(),
      `${story.title || ''}`.trim(),
    ].filter(Boolean);

    for (const term of searchTerms) {
      const results = await StoryService.searchGoogle(term);

      if (!Array.isArray(results) || results.length === 0) {
        continue;
      }

      const exactMatch = results.find((item: any) => {
        const itemTitle = normalizeText(item?.title);
        const itemAuthor = normalizeText(item?.author);
        return itemTitle === title && (!author || itemAuthor.includes(author));
      });

      if (exactMatch?.previewLink) {
        return exactMatch.previewLink;
      }

      const strongMatch = results.find((item: any) => {
        const itemTitle = normalizeText(item?.title);
        const itemAuthor = normalizeText(item?.author);

        const titleLooksClose =
          itemTitle.includes(title) ||
          title.includes(itemTitle) ||
          itemTitle.split(' ').some((word: string) => title.includes(word));

        const authorLooksClose =
          !author || itemAuthor.includes(author) || author.includes(itemAuthor);

        return titleLooksClose && authorLooksClose && item?.previewLink;
      });

      if (strongMatch?.previewLink) {
        return strongMatch.previewLink;
      }
    }

    return null;
  };

  const handleStoryOpen = async (selectedStory: Partial<Story>) => {
    if (!selectedStory?.id) {
      toast.error('Story id is missing');
      return;
    }

    if (selectedStory.previewLink) {
      window.open(selectedStory.previewLink, '_blank', 'noopener,noreferrer');
      return;
    }

    if (selectedStory.source === 'internal') {
      try {
        const matchedPreview = await findGooglePreviewForManualStory(selectedStory);

        if (matchedPreview) {
          window.open(matchedPreview, '_blank', 'noopener,noreferrer');
          return;
        }
      } catch (error) {
        console.error('Preview lookup failed:', error);
      }
    }

    navigate(`${DETAIL_ROUTE_BASE}/${selectedStory.id}`);
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
            Track your progress and continue your reading journey.
          </p>
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
            title="Quick Picks"
            value={isLoading ? '...' : quickPicks.length}
            icon={Clock}
            color="purple"
            subtext="Ready to read"
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
                  {pendingAssignments.map((assignment) => (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => navigate(`/child/assignments/${assignment.id}`)}
                      className="w-full text-left rounded-lg border border-gray-200 p-4 hover:border-nestory-300 hover:bg-nestory-50/40 transition-colors"
                    >
                      <p className="font-semibold text-gray-900">
                        {assignment.story?.title || 'Untitled story'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {assignment.story?.author || 'Unknown author'}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
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
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="text-nestory-600" size={22} />
                <h2 className="text-xl font-bold text-gray-900">Story Picks</h2>
              </div>

              {isLoading ? (
                <p className="text-gray-600">Loading story recommendations...</p>
              ) : quickPicks.length === 0 ? (
                <p className="text-gray-600">No stories available yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {quickPicks.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onSelect={handleStoryOpen}
                      clickable
                    />
                  ))}
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
                  <span className="font-medium text-gray-700">
                    {achievement.text}
                  </span>
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