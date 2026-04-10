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
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import ReadingService, { SessionListItem } from '../../services/readingService';
import StoryService from '../../services/storyService';
import AssignmentService from '../../services/assignmentService';
import { Story } from '../../types';
import {
  computePagesToAddFromViewer,
  createEmptySegment,
  resetSegmentFromViewer,
  type ViewerSegmentState,
} from '../../utils/googleBooksViewerProgress';
import {
  ensureGoogleBooksViewerApi,
  googleBooksEmbedIframeSrc,
  googleBooksLoadIdentifiers,
  googleBooksPreviewUrlIdentifier,
} from '../../utils/loadGoogleBooksViewer';
import {
  extractGoogleBooksEmbedPageHint,
  isLikelyGoogleBooksOrigin,
} from '../../utils/googleBooksIframeMessages';

declare global {
  interface Window {
    google: any;
  }
}

const VIEWER_POLL_MS = 120;

/** Skip JS DefaultViewer entirely (set in frontend `.env`: VITE_GOOGLE_BOOKS_IFRAME_ONLY=true). */
const GOOGLE_BOOKS_IFRAME_ONLY = import.meta.env.VITE_GOOGLE_BOOKS_IFRAME_ONLY === 'true';

/** No Google iframe or JS viewer — only Nestory + link to open Google Books in a new tab. */
const GOOGLE_BOOKS_DISABLE_EMBED = import.meta.env.VITE_GOOGLE_BOOKS_DISABLE_EMBED === 'true';

const rawAutoIframeMs = import.meta.env.VITE_GOOGLE_BOOKS_AUTO_IFRAME_FALLBACK_MS;
let AUTO_IFRAME_FALLBACK_MS = 8000;
if (rawAutoIframeMs !== undefined && rawAutoIframeMs !== null && String(rawAutoIframeMs).trim() !== '') {
  const p = Number.parseInt(String(rawAutoIframeMs), 10);
  if (Number.isFinite(p)) AUTO_IFRAME_FALLBACK_MS = p <= 0 ? 0 : p;
}

/** Show “Use embed preview” while JS viewer is still loading. */
const IFRAME_FALLBACK_OFFER_MS = 5000;

type GoogleBookEmbedMode = 'js' | 'iframe' | 'none';

function initialGoogleBookEmbedMode(): GoogleBookEmbedMode {
  if (GOOGLE_BOOKS_DISABLE_EMBED) return 'none';
  if (GOOGLE_BOOKS_IFRAME_ONLY) return 'iframe';
  return 'js';
}

const ReadingPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<SessionListItem | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pagesToAdd, setPagesToAdd] = useState(0);
  const [manualPageOverride, setManualPageOverride] = useState(false);

  const [viewerReady, setViewerReady] = useState(false);
  const [embedMode, setEmbedMode] = useState<GoogleBookEmbedMode>(() => initialGoogleBookEmbedMode());
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** User can switch to iframe after waiting on JS viewer (keeps auto page count as default). */
  const [iframeFallbackOfferVisible, setIframeFallbackOfferVisible] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [viewerPageLabel, setViewerPageLabel] = useState('');

  const viewerSegmentRef = useRef<ViewerSegmentState>(createEmptySegment());
  const maxPagesRef = useRef(0);
  const timerAutoStartedRef = useRef(false);
  const viewerReadyRef = useRef(false);
  const embedModeRef = useRef<GoogleBookEmbedMode>(embedMode);
  /** Set synchronously when falling back to iframe so late JS callbacks do not flip state. */
  const abandonJsViewerRef = useRef(false);
  /** Bumped on story change / retry so stale viewer.load callbacks cannot flip embed mode. */
  const viewerInitGenRef = useRef(0);
  /** Last page index seen from embed postMessage (iframe mode); used to add forward deltas only. */
  const iframePageHintRef = useRef<number | null>(null);
  /** Nestory toolbar next/prev — Google often nests iframes so our container never sees clicks; chevrons still count. */
  const chevronNetRef = useRef(0);

  const switchToIframeEmbed = useCallback(() => {
    abandonJsViewerRef.current = true;
    chevronNetRef.current = 0;
    setIframeFallbackOfferVisible(false);
    setEmbedMode('iframe');
  }, []);

  /** Leave simple iframe embed and attempt Google JS viewer again (auto page count). */
  const retryInteractiveViewer = useCallback(() => {
    viewerInitGenRef.current += 1;
    abandonJsViewerRef.current = false;
    chevronNetRef.current = 0;
    viewerRef.current = null;
    viewerSegmentRef.current = createEmptySegment();
    setViewerReady(false);
    setViewerPageLabel('');
    setPagesToAdd(0);
    setManualPageOverride(false);
    setIframeFallbackOfferVisible(false);
    setEmbedMode('js');
  }, []);

  const bumpPagesToAdd = useCallback((delta: number) => {
    setPagesToAdd((n) => {
      const cap = maxPagesRef.current;
      return Math.min(cap, Math.max(0, n + delta));
    });
  }, []);

  useEffect(() => {
    viewerReadyRef.current = viewerReady;
  }, [viewerReady]);

  useEffect(() => {
    embedModeRef.current = embedMode;
  }, [embedMode]);

  const [assignmentCompleteHint, setAssignmentCompleteHint] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [markingAssignment, setMarkingAssignment] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const manualPageOverrideRef = useRef(false);
  useEffect(() => {
    manualPageOverrideRef.current = manualPageOverride;
  }, [manualPageOverride]);

  const applyViewerScan = useCallback(() => {
    if (manualPageOverrideRef.current) return;
    const v = viewerRef.current;
    if (!v) return;
    const cap = maxPagesRef.current;
    const { pagesToAdd: computed, pageLabel } = computePagesToAddFromViewer(
      v,
      viewerSegmentRef.current,
      cap
    );
    const merged = Math.min(cap, Math.max(computed, chevronNetRef.current));
    setPagesToAdd(merged);
    if (pageLabel) setViewerPageLabel(pageLabel);
  }, []);

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

  useEffect(() => {
    viewerInitGenRef.current += 1;
    timerAutoStartedRef.current = false;
    abandonJsViewerRef.current = false;
    iframePageHintRef.current = null;
    chevronNetRef.current = 0;
    viewerSegmentRef.current = createEmptySegment();
    setManualPageOverride(false);
    setPagesToAdd(0);
    setIframeFallbackOfferVisible(false);
    setEmbedMode(initialGoogleBookEmbedMode());
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;
    maxPagesRef.current = Math.max(0, session.totalPages - session.pagesRead);
  }, [session]);

  useEffect(() => {
    setAssignmentCompleteHint(null);
    setHintDismissed(false);
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    const syncAssignmentHint = async () => {
      if (!session?.completed) {
        setAssignmentCompleteHint(null);
        return;
      }
      if (hintDismissed) return;

      const ref = session.bookId;
      const storyBookId =
        typeof ref === 'object' && ref !== null ? String((ref as { _id?: string })._id || '') : '';
      if (!storyBookId) return;

      try {
        const list = await AssignmentService.getMyAssignments();
        if (cancelled) return;
        const match = list.find((a) => String(a.storyId) === storyBookId && a.status !== 'completed');
        setAssignmentCompleteHint(
          match ? { id: match.id, title: match.story?.title || 'this assignment' } : null
        );
      } catch {
        if (!cancelled) setAssignmentCompleteHint(null);
      }
    };

    syncAssignmentHint();
    return () => {
      cancelled = true;
    };
  }, [session, hintDismissed]);

  const initViewer = useCallback((): Promise<void> => {
    const volumeId = story?.googleBookId?.trim();
    if (!volumeId) return Promise.resolve();

    const doLoad = () => {
      if (abandonJsViewerRef.current || embedModeRef.current !== 'js') return;
      const gen = ++viewerInitGenRef.current;

      const onReady = (viewer: any) => {
        if (abandonJsViewerRef.current || embedModeRef.current !== 'js' || gen !== viewerInitGenRef.current) return;
        viewerRef.current = viewer;
        viewerSegmentRef.current = createEmptySegment();
        setViewerPageLabel('');
        setPagesToAdd(0);
        setManualPageOverride(false);
        setViewerReady(true);
        chevronNetRef.current = 0;
        setTimeout(() => viewer.resize?.(), 100);
        setTimeout(() => viewer.resize?.(), 400);
        setTimeout(() => viewer.resize?.(), 900);
        setTimeout(() => {
          if (gen !== viewerInitGenRef.current) return;
          viewer.resize?.();
          const cap = maxPagesRef.current;
          const { pagesToAdd: next, pageLabel } = computePagesToAddFromViewer(
            viewer,
            viewerSegmentRef.current,
            cap
          );
          setPagesToAdd(next);
          if (pageLabel) setViewerPageLabel(pageLabel);
        }, 350);
      };

      const runStage = (stage: 'primary' | 'urlOnly') => {
        if (abandonJsViewerRef.current || embedModeRef.current !== 'js' || gen !== viewerInitGenRef.current) return;
        const container = viewerContainerRef.current;
        if (!container) {
          switchToIframeEmbed();
          return;
        }
        if (!window.google?.books?.DefaultViewer) {
          switchToIframeEmbed();
          return;
        }

        const viewer = new window.google.books.DefaultViewer(container);
        const ids =
          stage === 'primary' ? googleBooksLoadIdentifiers(volumeId) : googleBooksPreviewUrlIdentifier(volumeId);

        viewer.load(
          ids,
          () => {
            if (abandonJsViewerRef.current || embedModeRef.current !== 'js' || gen !== viewerInitGenRef.current) return;
            if (stage === 'primary') {
              container.replaceChildren();
              runStage('urlOnly');
              return;
            }
            switchToIframeEmbed();
          },
          () => onReady(viewer)
        );
      };

      runStage('primary');
    };

    const waitForContainer = (attempt: number): Promise<void> => {
      if (abandonJsViewerRef.current || embedModeRef.current !== 'js') {
        return Promise.resolve();
      }
      if (viewerContainerRef.current) {
        return ensureGoogleBooksViewerApi()
          .then(doLoad)
          .catch(() => switchToIframeEmbed());
      }
      if (attempt >= 20) return Promise.resolve();
      const delay = attempt === 0 ? 0 : 40;
      return new Promise((resolve) => {
        window.setTimeout(() => {
          void waitForContainer(attempt + 1).then(resolve);
        }, delay);
      });
    };

    return waitForContainer(0);
  }, [story?.googleBookId, switchToIframeEmbed]);

  useEffect(() => {
    viewerInitGenRef.current += 1;
    setViewerReady(false);
    abandonJsViewerRef.current = false;
    iframePageHintRef.current = null;
    chevronNetRef.current = 0;
    setIframeFallbackOfferVisible(false);
    setEmbedMode(initialGoogleBookEmbedMode());
    viewerRef.current = null;
    viewerSegmentRef.current = createEmptySegment();
    setViewerPageLabel('');
    setPagesToAdd(0);
    setManualPageOverride(false);
  }, [story?.id]);

  useEffect(() => {
    if (GOOGLE_BOOKS_IFRAME_ONLY || embedMode !== 'js' || !story?.googleBookId?.trim()) return undefined;
    if (viewerReady) return undefined;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      void initViewer();
    };
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [story?.googleBookId, story?.id, initViewer, embedMode, viewerReady]);

  useEffect(() => {
    if (viewerReady) setIframeFallbackOfferVisible(false);
  }, [viewerReady]);

  useEffect(() => {
    if (GOOGLE_BOOKS_DISABLE_EMBED || GOOGLE_BOOKS_IFRAME_ONLY || !story?.googleBookId?.trim()) {
      setIframeFallbackOfferVisible(false);
      return undefined;
    }

    if (AUTO_IFRAME_FALLBACK_MS > 0) {
      const t = window.setTimeout(() => {
        if (embedModeRef.current === 'js' && !viewerReadyRef.current) {
          switchToIframeEmbed();
        }
      }, AUTO_IFRAME_FALLBACK_MS);
      return () => window.clearTimeout(t);
    }

    if (embedMode !== 'js') {
      setIframeFallbackOfferVisible(false);
      return undefined;
    }

    const t = window.setTimeout(() => {
      if (embedModeRef.current === 'js' && !viewerReadyRef.current) {
        setIframeFallbackOfferVisible(true);
      }
    }, IFRAME_FALLBACK_OFFER_MS);

    return () => {
      window.clearTimeout(t);
      setIframeFallbackOfferVisible(false);
    };
  }, [story?.googleBookId, story?.id, embedMode, switchToIframeEmbed]);

  useEffect(() => {
    if (embedMode !== 'iframe' || !story?.googleBookId?.trim()) return;

    const onMessage = (ev: MessageEvent) => {
      if (!isLikelyGoogleBooksOrigin(ev.origin)) return;
      const page = extractGoogleBooksEmbedPageHint(ev.data);
      if (page == null) return;

      const prev = iframePageHintRef.current;
      if (prev === null) {
        iframePageHintRef.current = page;
        return;
      }
      if (page > prev) {
        const delta = page - prev;
        iframePageHintRef.current = page;
        setPagesToAdd((n) => Math.min(maxPagesRef.current, n + delta));
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [embedMode, story?.googleBookId]);

  useEffect(() => {
    if (embedMode !== 'js' || !viewerReady || manualPageOverride) return;
    const hasGoogle = !!story?.googleBookId?.trim();
    if (!hasGoogle) return;

    const id = window.setInterval(applyViewerScan, VIEWER_POLL_MS);
    applyViewerScan();
    return () => window.clearInterval(id);
  }, [
    embedMode,
    viewerReady,
    manualPageOverride,
    story?.googleBookId,
    session?.totalPages,
    session?.pagesRead,
    applyViewerScan,
  ]);

  useEffect(() => {
    if (embedMode !== 'js' || !viewerReady || manualPageOverride) return;
    const el = viewerContainerRef.current;
    if (!el) return;

    const timeouts: number[] = [];
    const bump = () => {
      applyViewerScan();
      timeouts.push(window.setTimeout(applyViewerScan, 90));
      timeouts.push(window.setTimeout(applyViewerScan, 280));
    };

    el.addEventListener('pointerup', bump, true);
    el.addEventListener('touchend', bump, true);
    return () => {
      el.removeEventListener('pointerup', bump, true);
      el.removeEventListener('touchend', bump, true);
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [embedMode, viewerReady, manualPageOverride, applyViewerScan]);

  useEffect(() => {
    if (embedMode !== 'js' || !viewerReady || manualPageOverride) return;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      applyViewerScan();
      window.setTimeout(applyViewerScan, 50);
      window.setTimeout(applyViewerScan, 220);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [embedMode, viewerReady, manualPageOverride, applyViewerScan]);

  useEffect(() => {
    if (embedMode !== 'js' || !viewerReady || !viewerRef.current?.resize) return;
    const t = window.setTimeout(() => viewerRef.current?.resize?.(), 200);
    return () => window.clearTimeout(t);
  }, [isFullscreen, viewerReady, embedMode]);

  useEffect(() => {
    if (!story?.googleBookId?.trim()) return;
    if (timerAutoStartedRef.current) return;
    if (GOOGLE_BOOKS_IFRAME_ONLY || embedMode === 'iframe' || embedMode === 'none') {
      timerAutoStartedRef.current = true;
      setIsTimerRunning(true);
      return;
    }
    if (!viewerReady) return;
    timerAutoStartedRef.current = true;
    setIsTimerRunning(true);
  }, [story?.googleBookId, embedMode, viewerReady, GOOGLE_BOOKS_IFRAME_ONLY]);

  useEffect(() => {
    if (session?.completed) return;
    const g = story?.googleBookId?.trim();
    if (g && (embedMode === 'iframe' || embedMode === 'none')) return;
    const waitingForEmbed = Boolean(g && embedMode === 'js' && !viewerReady);
    if (waitingForEmbed) return;
    const auto = Boolean(g && embedMode === 'js' && viewerReady && !manualPageOverride);
    if (auto) return;
    setPagesToAdd((n) => (n < 1 ? 1 : n));
  }, [
    story?.googleBookId,
    embedMode,
    viewerReady,
    manualPageOverride,
    session?.completed,
  ]);

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

  const bumpAfterViewerNav = () => {
    applyViewerScan();
    window.setTimeout(applyViewerScan, 60);
    window.setTimeout(applyViewerScan, 180);
    window.setTimeout(applyViewerScan, 450);
  };

  const handleNextPage = () => {
    if (embedMode !== 'js') return;
    if (viewerRef.current) {
      chevronNetRef.current = Math.min(
        maxPagesRef.current,
        chevronNetRef.current + 1
      );
      viewerRef.current.nextPage();
      window.setTimeout(() => viewerRef.current?.resize?.(), 50);
      bumpAfterViewerNav();
    }
  };

  const handlePrevPage = () => {
    if (embedMode !== 'js') return;
    if (viewerRef.current) {
      chevronNetRef.current = Math.max(0, chevronNetRef.current - 1);
      viewerRef.current.previousPage();
      window.setTimeout(() => viewerRef.current?.resize?.(), 50);
      bumpAfterViewerNav();
    }
  };

  const handleUpdateProgress = async () => {
    if (!session || !sessionId) return;
    const savedPages = pagesToAdd;
    try {
      setIsUpdating(true);
      const minutesSpent = Math.max(1, Math.round(elapsed / 60));
      await ReadingService.updateSession({
        sessionId,
        pagesRead: savedPages,
        timeSpent: minutesSpent,
      });

      const sessions = await ReadingService.getMySessions();
      const updated = sessions.find((s) => s._id === sessionId);
      if (updated) setSession(updated);

      setElapsed(0);
      setIsTimerRunning(false);
      const v = viewerRef.current;
      viewerSegmentRef.current = v ? resetSegmentFromViewer(v) : createEmptySegment();
      setPagesToAdd(0);
      setManualPageOverride(false);
      iframePageHintRef.current = null;
      chevronNetRef.current = 0;
      toast.success(
        updated?.completed
          ? 'Book completed! Great job! Your dashboard and assignments will show this when you open them.'
          : `Saved — ${savedPages} page${savedPages === 1 ? '' : 's'} logged. Open My Reading or your assignment again to see the update.`
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update progress');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  const handleDismissAssignmentHint = () => {
    setHintDismissed(true);
    setAssignmentCompleteHint(null);
  };

  const handleMarkAssignmentFromReader = async () => {
    if (!assignmentCompleteHint) return;
    try {
      setMarkingAssignment(true);
      await AssignmentService.updateMyAssignmentStatus(assignmentCompleteHint.id, 'completed');
      setAssignmentCompleteHint(null);
      setHintDismissed(true);
      toast.success('Assignment marked as completed');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not update assignment');
    } finally {
      setMarkingAssignment(false);
    }
  };

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
  const fallbackGoogleBooksUrl =
    googleId && !previewUrl
      ? `https://books.google.com/books?id=${encodeURIComponent(googleId)}&printsec=frontcover`
      : '';
  const effectivePreviewUrl = previewUrl || fallbackGoogleBooksUrl;
  const hasGoogleBook = !!googleId;
  const useAutoPageTracking =
    hasGoogleBook && embedMode === 'js' && viewerReady && !manualPageOverride;

  const canSaveProgress = pagesToAdd >= 1;

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

        {session.completed && assignmentCompleteHint && !hintDismissed && !isFullscreen && (
          <div className="card mb-4 border-emerald-200 bg-emerald-50/90">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={22} />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">You finished every page</h2>
                  <p className="text-sm text-gray-700 mt-1">
                    Mark <span className="font-semibold">{assignmentCompleteHint.title}</span> as completed so
                    your parent sees it on the assignment list.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleMarkAssignmentFromReader}
                      disabled={markingAssignment}
                      className="btn-primary text-sm inline-flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      {markingAssignment ? 'Saving…' : 'Mark assignment completed'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissAssignmentHint}
                      className="btn-secondary text-sm"
                    >
                      Not now
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissAssignmentHint}
                className="p-1 rounded-lg text-gray-500 hover:bg-emerald-100/80 hover:text-gray-800"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Book viewer: JS / iframe / or Nestory-only (no Google embed) */}
        {hasGoogleBook ? (
          embedMode === 'none' ? (
            <div className="card mb-4 border border-nestory-200 bg-nestory-50/50">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4">
                <div className="w-12 h-12 rounded-lg bg-nestory-100 flex items-center justify-center shrink-0">
                  <BookOpen size={22} className="text-nestory-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Read without embedding Google here</h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    This app is not loading Google&apos;s reader inside Nestory (no third-party embed). Use a paper copy
                    or open the book in your browser, then come back and log pages below with <strong>+1 page</strong>.
                  </p>
                  {effectivePreviewUrl ? (
                    <a
                      href={effectivePreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-nestory-600 text-white text-sm font-semibold hover:bg-nestory-700 transition-colors"
                    >
                      <ExternalLink size={18} />
                      Open book on Google Books (new tab)
                    </a>
                  ) : (
                    <p className="text-sm text-gray-600">No preview link is stored for this title — you can still log pages read below.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
          <div className={`${isFullscreen ? 'flex-1 flex flex-col min-h-0' : 'card mb-4'}`}>
            {/* Viewer toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white rounded-t-lg gap-2 flex-wrap">
              {isFullscreen && (
                <button
                  onClick={() => navigate('/child')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}
              {embedMode === 'iframe' ? (
                <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600">
                    <strong className="text-gray-800">Simple embed</strong> — Nestory cannot see page turns inside this
                    preview. Use <strong>+1 page</strong> below for each page, or try the interactive reader for
                    automatic counting.
                  </span>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!GOOGLE_BOOKS_IFRAME_ONLY ? (
                      <button
                        type="button"
                        onClick={retryInteractiveViewer}
                        className="px-2.5 py-1.5 rounded-lg bg-nestory-600 text-white text-xs font-semibold hover:bg-nestory-700 whitespace-nowrap"
                      >
                        Try interactive reader
                      </button>
                    ) : null}
                    {effectivePreviewUrl ? (
                      <a
                        href={effectivePreviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-nestory-700 hover:text-nestory-900"
                      >
                        <ExternalLink size={14} />
                        Open in tab
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm text-gray-600 font-medium min-w-[100px] text-center truncate px-1">
                    {viewerPageLabel ? viewerPageLabel : 'Page …'}
                  </span>
                  <button
                    onClick={handleNextPage}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Next page"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            {embedMode === 'iframe' ? (
              <div
                className={`bg-gray-100 overflow-hidden ${isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''}`}
                style={isFullscreen ? undefined : { height: '600px' }}
              >
                <iframe
                  title={session.bookId?.title ? `${session.bookId.title} preview` : 'Book preview'}
                  src={googleBooksEmbedIframeSrc(googleId)}
                  className="w-full h-full min-h-[480px] border-0 bg-white"
                  style={isFullscreen ? { minHeight: 0 } : undefined}
                  loading="eager"
                  referrerPolicy="origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <>
                <div
                  ref={viewerContainerRef}
                  className={`bg-gray-100 ${isFullscreen ? 'flex-1 min-h-0' : ''}`}
                  style={isFullscreen ? { minHeight: 0 } : { height: '600px' }}
                />

                {!viewerReady && (
                  <div className="flex flex-col items-center justify-center p-8 gap-4">
                    <div className="text-center">
                      <div className="w-10 h-10 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-600 text-sm font-medium">Loading interactive reader…</p>
                      <p className="text-gray-500 text-xs mt-2 max-w-md mx-auto leading-relaxed">
                        This mode lets Nestory track pages automatically as you turn them. Stay on this screen while
                        Google&apos;s script loads.
                      </p>
                    </div>
                    {iframeFallbackOfferVisible && (
                      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-left text-sm text-gray-800">
                        <p className="font-semibold text-gray-900 mb-1">Still stuck?</p>
                        <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                          You can switch to Google&apos;s simpler embedded preview. It usually loads, but Nestory
                          cannot detect page turns inside it — you will use <strong>+1 page</strong> below instead of
                          automatic counting.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => switchToIframeEmbed()}
                            className="px-3 py-2 rounded-lg bg-nestory-600 text-white text-xs font-semibold hover:bg-nestory-700"
                          >
                            Use embed preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setIframeFallbackOfferVisible(false)}
                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Keep waiting
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {isFullscreen && !session.completed && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t border-gray-200 bg-white shrink-0">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{pagesToAdd}</span> pages to log ·{' '}
                  <span className="font-mono">{formatTime(elapsed)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleUpdateProgress}
                  disabled={isUpdating || !canSaveProgress}
                  className="px-4 py-2 rounded-lg bg-nestory-600 text-white text-sm font-semibold hover:bg-nestory-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Saving…' : 'Save progress'}
                </button>
              </div>
            )}
          </div>
          )
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

            {effectivePreviewUrl && !isFullscreen && (
              <div className="card mb-4 bg-nestory-50 border border-nestory-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-nestory-100 flex items-center justify-center shrink-0">
                    <ExternalLink size={20} className="text-nestory-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Read This Book</h2>
                    <p className="text-sm text-gray-600 mb-3">
                      Open the book on Google Books to read, then come back here to log your session.
                    </p>
                    <p className="text-sm font-medium text-gray-800 mb-3">
                      To update your page count for today: set <strong>Pages to save</strong>, use the{' '}
                      <strong>Reading Timer</strong>, then tap <strong>Save Progress</strong>. That updates your
                      reading record everywhere in Nestory.
                    </p>
                    <a
                      href={effectivePreviewUrl}
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

            {story && !googleId && !isFullscreen && (
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
                {useAutoPageTracking && (
                  <p className="text-xs text-gray-500 mt-2">
                    Timer starts automatically with the book viewer. Pause anytime.
                  </p>
                )}
              </div>

              {/* Pages: auto from Google viewer or manual */}
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Pages to save</p>
                {useAutoPageTracking ? (
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {pagesToAdd}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        / {pagesRemaining} left this book
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Turn pages in the viewer above — Nestory counts how far you move from where you last saved.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setManualPageOverride(true);
                      }}
                      className="mt-3 text-xs font-semibold text-nestory-700 hover:text-nestory-800 underline"
                    >
                      Adjust page count manually
                    </button>
                  </div>
                ) : (embedMode === 'iframe' || embedMode === 'none') && hasGoogleBook ? (
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {pagesToAdd}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        / {pagesRemaining} left this session
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      {embedMode === 'none'
                        ? 'Nestory is not embedding Google here. Each time you read another page (in a paper book or in another tab), tap +1 page (or +5).'
                        : "This preview runs on Google's site inside a secure frame, so Nestory cannot see when you turn pages. Each time you move forward a page in the book, tap +1 page (or add several with +5). We also listen for hints from Google if their viewer sends them."}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => bumpPagesToAdd(-1)}
                        disabled={pagesToAdd < 1}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        −1
                      </button>
                      <button
                        type="button"
                        onClick={() => bumpPagesToAdd(1)}
                        className="px-4 py-2 rounded-lg bg-nestory-600 text-white text-sm font-semibold hover:bg-nestory-700"
                      >
                        +1 page
                      </button>
                      <button
                        type="button"
                        onClick={() => bumpPagesToAdd(5)}
                        disabled={pagesToAdd >= maxPages}
                        className="px-4 py-2 rounded-lg border border-nestory-300 bg-white text-nestory-800 text-sm font-semibold hover:bg-nestory-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +5 pages
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Or type a total:</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setPagesToAdd((n) => Math.max(0, n - 1))}
                        className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={maxPages}
                        value={pagesToAdd}
                        onChange={(e) =>
                          setPagesToAdd(Math.min(maxPages, Math.max(0, Number(e.target.value) || 0)))
                        }
                        className="w-16 text-center text-lg font-bold border border-gray-300 rounded-lg py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => setPagesToAdd((n) => Math.min(maxPages, n + 1))}
                        className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus size={14} />
                      </button>
                      <span className="text-xs text-gray-500">/ {pagesRemaining} left</span>
                    </div>
                  </div>
                ) : (
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
                )}
                {hasGoogleBook && embedMode === 'js' && viewerReady && manualPageOverride && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualPageOverride(false);
                      viewerSegmentRef.current = viewerRef.current?.isLoaded?.()
                        ? resetSegmentFromViewer(viewerRef.current)
                        : createEmptySegment();
                    }}
                    className="mt-2 text-xs font-semibold text-nestory-700 hover:text-nestory-800 underline"
                  >
                    Use automatic counting again
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handleUpdateProgress}
              disabled={isUpdating || !canSaveProgress}
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
