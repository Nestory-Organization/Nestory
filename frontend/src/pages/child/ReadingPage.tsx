import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Maximize2,
  Minus,
  Minimize2,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import ReadingService, { SessionListItem } from '../../services/readingService';
import StoryService from '../../services/storyService';
import { Story } from '../../types';

declare global {
  interface Window {
    google: any;
  }
}

const ReadingPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<SessionListItem | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pagesToAdd, setPagesToAdd] = useState(1);

  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [currentViewerPage, setCurrentViewerPage] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!sessionId) {
        toast.error('Invalid session');
        navigate('/child');
        return;
      }
      try {
        setIsLoading(true);
        const sessions = await ReadingService.getMySessions();
        const found = sessions.find((s) => s._id === sessionId);
        if (!found) {
          toast.error('Session not found');
          navigate('/child');
          return;
        }
        setSession(found);

        const bookRef = found.bookId;
        const bookStoryId =
          typeof bookRef === 'object' && bookRef !== null
            ? String((bookRef as { _id?: string })._id || '')
            : bookRef
              ? String(bookRef)
              : '';
        if (bookStoryId) {
          const storyData = await StoryService.getStoryById(bookStoryId).catch(() => null);
          setStory(storyData);
        } else {
          setStory(null);
        }
      } catch (error: any) {
        toast.error('Failed to load reading session');
        navigate('/child');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [sessionId, navigate]);

  const initViewer = useCallback(() => {
    if (!story?.googleBookId || !viewerContainerRef.current) return;

    const tryInit = () => {
      if (!window.google?.books) {
        setViewerError(true);
        return;
      }

      const viewer = new window.google.books.DefaultViewer(viewerContainerRef.current);
      viewer.load(
        `ISBN:${story.googleBookId}`,
        () => {
          viewer.load(story.googleBookId, () => {
            setViewerError(true);
          });
        },
        () => {
          viewerRef.current = viewer;
          setViewerReady(true);
        }
      );
    };

    if (window.google?.books) {
      tryInit();
    } else {
      window.google?.load?.('books', '0', { callback: tryInit });
      if (!window.google?.load) {
        const interval = setInterval(() => {
          if (window.google?.books) {
            clearInterval(interval);
            tryInit();
          }
        }, 500);
        setTimeout(() => {
          clearInterval(interval);
          if (!viewerReady) setViewerError(true);
        }, 10000);
      }
    }
  }, [story?.googleBookId, viewerReady]);

  useEffect(() => {
    if (story?.googleBookId && !viewerReady && !viewerError) {
      const timer = setTimeout(initViewer, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [story, initViewer, viewerReady, viewerError]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleNextPage = () => {
    if (viewerRef.current) {
      viewerRef.current.nextPage();
      setCurrentViewerPage((p) => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (viewerRef.current) {
      viewerRef.current.previousPage();
      setCurrentViewerPage((p) => Math.max(0, p - 1));
    }
  };

  const handleUpdateProgress = async () => {
    if (!session || !sessionId) return;
    try {
      setIsUpdating(true);
      const minutesSpent = Math.max(1, Math.round(elapsed / 60));
      await ReadingService.updateSession({
        sessionId,
        pagesRead: pagesToAdd,
        timeSpent: minutesSpent,
      });

      const sessions = await ReadingService.getMySessions();
      const updated = sessions.find((s) => s._id === sessionId);
      if (updated) setSession(updated);

      setElapsed(0);
      setIsTimerRunning(false);
      setPagesToAdd(1);
      toast.success(
        updated?.completed
          ? 'Book completed! Great job!'
          : `Progress saved — ${pagesToAdd} pages logged`
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update progress');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Reading" />
        <div className="container-responsive py-10 text-center">
          <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Opening your book...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const pagesRemaining = session.totalPages - session.pagesRead;
  const maxPages = Math.max(pagesRemaining, 0);
  const googleId = story?.googleBookId?.trim();
  const previewUrl = story?.previewLink?.trim();
  const hasGoogleBook = !!googleId;

  return (
    <div className="min-h-screen bg-gray-50">
      {!isFullscreen && <Navbar title="Reading" />}

      <div className={isFullscreen ? 'h-screen flex flex-col' : 'container-responsive py-8 max-w-4xl mx-auto'}>
        {/* Top bar */}
        {!isFullscreen && (
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/child')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="font-semibold">{session.pagesRead}/{session.totalPages} pages</span>
              <span className="text-nestory-600 font-bold">{session.progress}%</span>
            </div>
          </div>
        )}

        {/* Book header — compact */}
        {!isFullscreen && (
          <div className="card mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-16 rounded bg-gradient-to-br from-nestory-100 to-blue-100 flex items-center justify-center shrink-0">
                <BookOpen size={22} className="text-nestory-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {session.bookId?.title || 'Untitled'}
                </h1>
                <p className="text-sm text-gray-600">{session.bookId?.author || 'Unknown author'}</p>
              </div>
              {session.completed && (
                <span className="flex items-center gap-1 text-green-700 font-semibold text-sm shrink-0">
                  <CheckCircle2 size={16} />
                  Completed
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${session.completed ? 'bg-green-500' : 'bg-nestory-500'}`}
                  style={{ width: `${Math.min(session.progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Book viewer */}
        {hasGoogleBook && !viewerError ? (
          <div className={`${isFullscreen ? 'flex-1 flex flex-col' : 'card mb-4'}`}>
            {/* Viewer toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white rounded-t-lg">
              {isFullscreen && (
                <button
                  onClick={() => navigate('/child')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm text-gray-600 font-medium min-w-[80px] text-center">
                  Page {currentViewerPage + 1}
                </span>
                <button
                  onClick={handleNextPage}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Next page"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            {/* Viewer container */}
            <div
              ref={viewerContainerRef}
              className={`bg-gray-100 ${isFullscreen ? 'flex-1' : ''}`}
              style={isFullscreen ? {} : { height: '600px' }}
            />

            {!viewerReady && (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">Loading book viewer...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Fallback: description + preview link */}
            {story?.description && !isFullscreen && (
              <div className="card mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-2">About This Book</h2>
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                  {story.description}
                </p>
              </div>
            )}

            {previewUrl && !isFullscreen && (
              <div className="card mb-4 bg-nestory-50 border border-nestory-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-nestory-100 flex items-center justify-center shrink-0">
                    <ExternalLink size={20} className="text-nestory-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Read This Book</h2>
                    <p className="text-sm text-gray-600 mb-3">
                      Open the book on Google Books to read, then come back to log your pages.
                    </p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-nestory-600 text-white font-semibold hover:bg-nestory-700 transition-colors"
                    >
                      <BookOpen size={18} />
                      Open Book Preview
                    </a>
                  </div>
                </div>
              </div>
            )}

            {!story && !isFullscreen && (
              <div className="card mb-4 text-center py-8">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 mb-2">
                  Book details could not be loaded. You can still use the timer and log pages below.
                </p>
                <p className="text-sm text-gray-500">
                  If this keeps happening, ask a parent to check the story in the library.
                </p>
              </div>
            )}

            {story && !previewUrl && !googleId && !isFullscreen && (
              <div className="card mb-4 text-center py-8">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 mb-2">
                  This book has no linked Google Books preview in Nestory yet.
                </p>
                <p className="text-sm text-gray-500">
                  Ask a parent to add the book from Google Books in the admin story tools, or use a physical copy while you log reading here.
                </p>
              </div>
            )}
          </>
        )}

        {/* Progress tracker */}
        {!session.completed && !isFullscreen && (
          <div className="card mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Log Your Reading</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Timer */}
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Reading Timer</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-mono font-bold text-gray-900">{formatTime(elapsed)}</p>
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isTimerRunning
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <Clock size={14} className="inline mr-1.5" />
                    {isTimerRunning ? 'Pause' : 'Start'}
                  </button>
                </div>
              </div>

              {/* Pages input */}
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Pages read</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagesToAdd(Math.max(1, pagesToAdd - 1))}
                    className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={maxPages}
                    value={pagesToAdd}
                    onChange={(e) =>
                      setPagesToAdd(Math.min(maxPages, Math.max(1, Number(e.target.value) || 1)))
                    }
                    className="w-16 text-center text-lg font-bold border border-gray-300 rounded-lg py-1.5"
                  />
                  <button
                    onClick={() => setPagesToAdd(Math.min(maxPages, pagesToAdd + 1))}
                    className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-xs text-gray-500">/ {pagesRemaining} left</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpdateProgress}
              disabled={isUpdating || pagesToAdd < 1}
              className="w-full py-3 rounded-lg bg-nestory-600 text-white font-semibold hover:bg-nestory-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Saving...' : 'Save Progress'}
            </button>
          </div>
        )}

        {/* Session info */}
        {!isFullscreen && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Session Info</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">{session.timeSpent}</p>
                <p className="text-sm text-gray-600">Minutes read</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">{session.pagesRead}</p>
                <p className="text-sm text-gray-600">Pages read</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingPage;
