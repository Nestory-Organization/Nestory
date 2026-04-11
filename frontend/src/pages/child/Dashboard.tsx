import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import StoryCard from '../../components/common/StoryCard';
import {
  BookOpen,
  Flame,
  Clock,
  Award,
  CalendarDays,
  BarChart3,
  Sparkles,
  Search,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import StoryService from '../../services/storyService';
import AssignmentService from '../../services/assignmentService';
import ReadingService from '../../services/readingService';
import SearchRequestService from '../../services/searchRequestService';
import chatService from '../../services/chatService';
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
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalResults, setExternalResults] = useState<Story[]>([]);

  const loadDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);

      const [response, childAssignments, sessions] = await Promise.all([
        StoryService.getStories(1, 24),
        AssignmentService.getMyAssignments(),
        ReadingService.getMySessions('active').catch(
          () => [] as MyReadingSessionRow[]
        ),
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
        typeof (
          error as { response?: { data?: { message?: string } } }
        ).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Failed to load child dashboard';

      toast.error(message || 'Failed to load child dashboard');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const beginReadByStoryId = async (
    storyId: string | undefined,
    loadingKey: string
  ) => {
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
        typeof (
          error as { response?: { data?: { message?: string } } }
        ).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Could not open this book';

      toast.error(message || 'Could not open this book');
    } finally {
      setStartingReadKey(null);
    }
  };

  useEffect(() => {
    loadDashboardData(true);

    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [location.key]);

  // Load and poll for unread messages
  useEffect(() => {
    const loadUnread = async () => {
      try {
        const unreadCount = await chatService.getUnread();
        setUnreadMessages(unreadCount);
      } catch (error) {
        console.error('Failed to load unread messages:', error);
      }
    };

    loadUnread();

    // Poll every 3 seconds
    const interval = setInterval(loadUnread, 3000);
    return () => clearInterval(interval);
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

  const localMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return stories.filter(
      (story) =>
        story.title?.toLowerCase().includes(q) ||
        story.author?.toLowerCase().includes(q)
    );
  }, [searchQuery, stories]);

  const assignmentStats = useMemo(() => {
    const assigned = assignments.filter((item) => item.status === 'assigned').length;
    const inProgress = assignments.filter(
      (item) => item.status === 'in_progress'
    ).length;
    const completed = assignments.filter(
      (item) => item.status === 'completed'
    ).length;

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

  const handleExternalSearch = async () => {
    const query = searchQuery.trim();

    if (!query) {
      toast.error('Enter a book name');
      return;
    }

    if (localMatches.length > 0) {
      setExternalResults([]);
      toast.success('Found matching books in your library');
      return;
    }

    try {
      setIsSearchingExternal(true);

      const results = await StoryService.searchGoogle(query);

      const mappedResults: Story[] = (results || []).map((book: any) => ({
        id: book.googleBookId,
        title: book.title || 'Untitled',
        author: book.author || 'Unknown',
        description: book.description || '',
        ageGroup: 'middle-grade',
        genres: ['External Search'],
        readingLevel: 'intermediate',
        coverImage: normalizeCoverImage(book.coverImage),
        pageCount: Number(book.pageCount || 0),
        source: 'google',
        googleBookId: book.googleBookId,
        previewLink: book.previewLink || '',
        createdBy: '',
        createdAt: '',
        updatedAt: '',
      }));

      setExternalResults(mappedResults);

      if (mappedResults.length > 0) {
        const top = mappedResults[0];

        await SearchRequestService.createRequest({
          query,
          suggestedBookName: top.title,
          googleBookId: top.googleBookId,
          author: top.author,
          coverImage: top.coverImage,
          previewLink: top.previewLink,
          pageCount: top.pageCount,
        });

        toast.success('Google results loaded and admin notified');
      } else {
        toast('No external results found');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to search external books');
    } finally {
      setIsSearchingExternal(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar title="My Reading" unreadMessages={unreadMessages} />

      <div className="container-responsive py-8">
        {/* Page Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl serif-text font-bold text-primary leading-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Reader'} 👋
          </h1>
          <p className="mt-2 text-on-surface-variant text-lg">
            Your curated reading journey awaits. Keep the streak going!
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/child/progress')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <BarChart3 size={18} />
              My Progress
            </button>
            <button
              type="button"
              onClick={() => navigate('/child/gamification')}
              className="btn-outline inline-flex items-center gap-2"
            >
              <Sparkles size={18} />
              Gamification
            </button>
            <button
              type="button"
              onClick={() => navigate('/child/chat')}
              className="relative inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <MessageCircle size={18} />
              Family Chat
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card mb-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleExternalSearch(); }}
                placeholder="Search books in library or Google..."
                className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-b-2 border-outline-variant focus:border-primary outline-none text-on-surface rounded-t-lg transition-colors"
              />
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleExternalSearch}
              disabled={isSearchingExternal}
            >
              {isSearchingExternal ? 'Searching…' : 'Search'}
            </button>
          </div>
          {!!searchQuery.trim() && localMatches.length > 0 && (
            <p className="text-sm text-tertiary mt-3 font-medium">
              ✓ Found {localMatches.length} matching book(s) in your library.
            </p>
          )}
          {!!searchQuery.trim() && localMatches.length === 0 && externalResults.length > 0 && (
            <p className="text-sm text-secondary mt-3 font-medium">
              Not found in library. Showing Google Books results and notifying admin.
            </p>
          )}
        </div>

        {/* Search Results */}
        {!!searchQuery.trim() && localMatches.length > 0 && (
          <div className="card mb-8">
            <h2 className="serif-text font-bold text-xl text-on-surface mb-4">Library Matches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {localMatches.map((story) => {
                const sid = story.id || story._id;
                const readKey = `l-${sid}`;
                return (
                  <StoryCard
                    key={sid || story.title}
                    story={story}
                    onSelect={() => beginReadByStoryId(sid ? String(sid) : undefined, readKey)}
                    clickable={startingReadKey === null}
                  />
                );
              })}
            </div>
          </div>
        )}

        {!!searchQuery.trim() && localMatches.length === 0 && externalResults.length > 0 && (
          <div className="card mb-8">
            <h2 className="serif-text font-bold text-xl text-on-surface mb-4">Google Books Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {externalResults.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onSelect={() => {
                    if (story.previewLink) { window.location.href = story.previewLink; return; }
                    toast('Preview is not available for this result');
                  }}
                  clickable
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {[
            { label: 'Stories Available', value: isLoading ? '…' : stories.length, icon: 'library_books' },
            { label: 'Beginner Friendly', value: isLoading ? '…' : beginnerCount, icon: 'auto_stories' },
            { label: 'Middle Grade', value: isLoading ? '…' : middleGradeCount, icon: 'school' },
            { label: 'My Assignments', value: isLoading ? '…' : assignmentStats.total, icon: 'assignment' },
          ].map((stat) => (
            <div key={stat.label} className="card flex items-start gap-3 p-5">
              <div className="p-2 rounded-lg bg-surface-container-high flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
                <p className="text-2xl font-bold serif-text text-primary">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Assignment Status Mini Strip */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Assigned', value: assignmentStats.assigned, color: 'text-secondary' },
            { label: 'In Progress', value: assignmentStats.inProgress, color: 'text-primary' },
            { label: 'Completed', value: assignmentStats.completed, color: 'text-tertiary' },
          ].map((s) => (
            <div key={s.label} className="card text-center py-5">
              <p className={`text-3xl font-bold serif-text ${s.color}`}>{isLoading ? '…' : s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Reading Progress */}
            <div className="card">
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>import_contacts</span>
                <h2 className="serif-text font-bold text-xl text-on-surface">Your Reading Progress</h2>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
                </div>
              ) : activeSessions.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">menu_book</span>
                  <p className="text-on-surface-variant">Open a book below to start a reading session.</p>
                  <p className="text-xs text-on-surface-variant mt-1">Books need a page count in the library to open in the reader.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {activeSessions.map((row) => {
                    const sid = sessionStoryId(row);
                    const book = row.bookId;
                    const title = book && typeof book === 'object' && 'title' in book && book.title ? book.title : 'Book';
                    const author = book && typeof book === 'object' && 'author' in book ? book.author : undefined;

                    return (
                      <li key={row._id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-on-surface">{title}</p>
                          {author && <p className="text-sm text-on-surface-variant">{author}</p>}
                          <div className="mt-3 h-2 rounded-full bg-surface-container overflow-hidden max-w-md">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(100, row.progress)}%` }}
                            />
                          </div>
                          <p className="text-xs text-outline mt-1.5">
                            {row.pagesRead} / {row.totalPages} pages ({Math.round(row.progress)}%)
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={!sid || startingReadKey !== null}
                          onClick={() => sid && navigate(`/child/read/${row._id}`)}
                          className="shrink-0 btn-primary text-sm py-2.5 px-5 disabled:opacity-50"
                        >
                          Continue Reading
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Assigned Stories */}
            <div className="card">
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
                <h2 className="serif-text font-bold text-xl text-on-surface">My Assigned Stories</h2>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
                </div>
              ) : pendingAssignments.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="material-symbols-outlined text-5xl text-tertiary mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                  <p className="font-semibold text-on-surface">All caught up!</p>
                  <p className="text-sm text-on-surface-variant mt-1">No active assignments yet. Great job keeping up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAssignments.map((assignment) => {
                    const assignmentStoryId = assignment.storyId || assignment.story?._id || assignment.story?.id;
                    const readKey = `a-${assignment.id}`;

                    return (
                      <div
                        key={assignment.id}
                        className="flex flex-col gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 hover:border-primary/40 transition-colors sm:flex-row sm:items-center sm:justify-between"
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/child/assignments/${assignment.id}`)}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="font-semibold text-on-surface">{assignment.story?.title || 'Untitled story'}</p>
                          <p className="text-sm text-on-surface-variant">{assignment.story?.author || 'Unknown author'}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="badge badge-primary capitalize">{assignment.status.replace('_', ' ')}</span>
                            {assignment.dueDate && (
                              <span className="badge badge-outline">Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => beginReadByStoryId(assignmentStoryId, readKey)}
                          disabled={startingReadKey !== null}
                          className="shrink-0 btn-primary text-sm py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {startingReadKey === readKey ? 'Opening…' : 'Read Book'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Story Picks */}
            <div className="card">
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h2 className="serif-text font-bold text-xl text-on-surface">Story Picks For You</h2>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton h-56 w-full rounded-xl" />)}
                </div>
              ) : quickPicks.length === 0 ? (
                <p className="text-on-surface-variant text-center py-8">No stories available yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {quickPicks.map((story) => {
                    const sid = story.id || story._id;
                    const readKey = `s-${sid}`;
                    return (
                      <StoryCard
                        key={sid || story.title}
                        story={story}
                        onSelect={() => beginReadByStoryId(sid ? String(sid) : undefined, readKey)}
                        clickable={startingReadKey === null}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Reading Tips */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                <h3 className="serif-text font-bold text-on-surface">Reading Tips</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '📘', text: 'Read 15 minutes daily to build your streak' },
                  { icon: '📝', text: 'Tell a parent what you learned today' },
                  { icon: '🎯', text: 'Finish one story this week to earn badges' },
                ].map((tip) => (
                  <div key={tip.text} className="rounded-xl bg-surface-container-low p-3 flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{tip.icon}</span>
                    <span className="text-sm font-medium text-on-surface-variant leading-snug">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="card">
              <h3 className="serif-text font-bold text-on-surface mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { icon: 'library_books', label: 'Browse Full Library', route: '/stories' },
                  { icon: 'military_tech', label: 'View My Badges', route: '/child/gamification' },
                  { icon: 'chat', label: 'Family Chat', route: '/child/chat' },
                  { icon: 'bar_chart', label: 'My Reading Stats', route: '/child/progress' },
                ].map((link) => (
                  <button
                    key={link.route}
                    type="button"
                    onClick={() => navigate(link.route)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-medium text-sm"
                  >
                    <span className="material-symbols-outlined text-lg">{link.icon}</span>
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-outline tracking-widest uppercase border-t border-outline-variant/30 mt-10">
        © 2024 The Curated Sanctuary · Happy Reading!
      </footer>
    </div>
  );
};

export default ChildDashboard;