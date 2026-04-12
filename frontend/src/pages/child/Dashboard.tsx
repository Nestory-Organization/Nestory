import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen,
  Award,
  MessageCircle,
  TrendingUp,
  LayoutDashboard,
  Book,
  CheckCircle2,
  Sparkles,
  Search,
  Flame,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Grid, Card } from '../../components/common/StitchComponents';
import Navbar from '../../components/common/Navbar';
import StoryCard from '../../components/common/StoryCard';
import StoryService from '../../services/storyService';
import AssignmentService from '../../services/assignmentService';
import ReadingService from '../../services/readingService';
import SearchRequestService from '../../services/searchRequestService';
import chatService from '../../services/chatService';
import { Story, Assignment, MyReadingSessionRow } from '../../types';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80';

const normalizeCoverImage = (url?: string) => {
  if (!url || !url.trim()) return FALLBACK_COVER;
  return url.replace(/^http:\/\//i, 'https://');
};

const Sidebar = ({ activeTab, onNavigate, unreadMessages }: any) => {
  const tabs = [
    { id: "/", icon: <LayoutDashboard size={20} />, label: "My Library" },
    { id: "/assignments", icon: <CheckCircle2 size={20} />, label: "My Tasks" },
    { id: "/progress", icon: <TrendingUp size={20} />, label: "Adventure Log" },
    { id: "/chat", icon: <MessageCircle size={20} />, label: "Family Chat", badge: unreadMessages },
    { id: "/gamification", icon: <Award size={20} />, label: "Trophies" },
  ];
  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant/30 hidden md:flex flex-col py-6 px-4">
      <div className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === tab.id ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={activeTab === tab.id ? "text-on-primary" : "text-primary group-hover:scale-110 transition-transform"}>{tab.icon}</span>
              <span className="font-semibold text-sm">{tab.label}</span>
            </div>
            {tab.badge > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? "bg-on-primary text-primary" : "bg-error text-white"}`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
};

const ChildDashboard: React.FC = () => {
  const navigate = useNavigate();
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
        ReadingService.getMySessions('active').catch(() => [] as MyReadingSessionRow[]),
      ]);
      setStories((response.stories || []).map(s => ({ ...s, coverImage: normalizeCoverImage(s.coverImage)})));
      setAssignments(childAssignments || []);
      setActiveSessions(sessions);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const beginReadByStoryId = async (storyId: string | undefined, loadingKey: string) => {
    if (!storyId) { toast.error('Story not available'); return; }
    try {
      setStartingReadKey(loadingKey);
      const { _id } = await ReadingService.startMySession({ storyId });
      navigate(`/child/read/${_id}`);
    } catch { toast.error('Could not start reading'); } finally { setStartingReadKey(null); }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(async () => {
      try { const count = await chatService.getUnread(); setUnreadMessages(count); } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const beginnerCount = useMemo(() => stories.filter(s => s.readingLevel === 'beginner').length, [stories]);
  const middleCount = useMemo(() => stories.filter(s => s.ageGroup === 'middle-grade').length, [stories]);
  const quickPicks = useMemo(() => stories.slice(0, 6), [stories]);
  const localMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? stories.filter(s => s.title?.toLowerCase().includes(q)) : [];
  }, [searchQuery, stories]);

  const stats = useMemo(() => ({
    assigned: assignments.filter(a => a.status === 'assigned').length,
    inProgress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  }), [assignments]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar title="My Library" unreadMessages={unreadMessages} />
      <div className="flex flex-1">
        <Sidebar activeTab="/" onNavigate={navigate} unreadMessages={unreadMessages} />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Container className="py-8">
            <div className="mb-8 animate-slide-up">
              <h1 className="text-4xl serif-text font-bold text-primary">Welcome, {user?.name?.split(' ')[0] || 'Reader'}</h1>
              <p className="mt-2 text-on-surface-variant">Your reading sanctuary awaits.</p>
            </div>

            <Card className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your library..."
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-b-2 border-outline-variant focus:border-primary outline-none text-on-surface rounded-lg transition-colors"
                />
              </div>
            </Card>

            <Grid columns={4} gap="md" className="mb-8">
              {[
                { label: 'Books', value: stories.length, icon: <BookOpen className="text-primary" /> },
                { label: 'Beginner', value: beginnerCount, icon: <Sparkles className="text-secondary" /> },
                { label: 'Middle Grade', value: middleCount, icon: <Award className="text-tertiary" /> },
                { label: 'Tasks', value: assignments.length, icon: <CheckCircle2 className="text-primary" /> },
              ].map((s, i) => (
                <Card key={i} className="p-5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-surface-container-high">{s.icon}</div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{s.label}</p>
                    <p className="text-2xl font-bold serif-text text-primary">{isLoading ? '�' : s.value}</p>
                  </div>
                </Card>
              ))}
            </Grid>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <Section title="Continue Reading">
                    {activeSessions.length === 0 ? (
                      <p className="text-on-surface-variant text-sm py-4">No active sessions. Start a book below!</p>
                    ) : (
                      <div className="space-y-4">
                        {activeSessions.map(row => (
                          <div key={row._id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                            <div className="flex-1">
                              <p className="font-bold text-on-surface">{typeof row.bookId === 'object' ? (row.bookId as any).title : 'Book'}</p>
                              <div className="mt-2 h-1.5 bg-surface-container rounded-full w-48 overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${row.progress}%` }} />
                              </div>
                            </div>
                            <button onClick={() => navigate(`/child/read/${row._id}`)} className="btn-primary text-xs py-2 px-4 shadow-sm">Continue</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>
                </Card>

                <Card className="p-6">
                  <Section title="My Assigned Tasks">
                    {assignments.filter(a => a.status !== 'completed').length === 0 ? (
                      <p className="text-on-surface-variant text-sm py-4">All tasks finished! Great job!</p>
                    ) : (
                      <div className="space-y-3">
                        {assignments.filter(a => a.status !== 'completed').map(a => (
                          <div key={a.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                            <div>
                              <p className="font-bold text-on-surface">{a.story?.title}</p>
                              <span className="text-[10px] uppercase font-bold text-primary tracking-widest">{a.status}</span>
                            </div>
                            <button onClick={() => navigate(`/child/assignments/${a.id}`)} className="btn-outline text-xs py-2 px-4">Details</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>
                </Card>
                
                <Section title="Story Recommendations">
                  <Grid columns={3} gap="md">
                    {quickPicks.map(story => (
                      <StoryCard key={story.id} story={story} onSelect={() => beginReadByStoryId(story.id, `s-${story.id}`)} clickable={!startingReadKey} />
                    ))}
                  </Grid>
                </Section>
              </div>

              <div className="space-y-6">
                <Card className="bg-primary/5 border-primary/20 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="text-primary" size={20} />
                    <h3 className="serif-text font-bold text-on-surface uppercase tracking-wider text-xs">Adventure Log</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Weekly Streak', value: '4 Days', icon: <Flame size={16} className="text-error" /> },
                      { label: 'Badges Earned', value: '12', icon: <Award size={16} className="text-tertiary" /> },
                      { label: 'Reading Time', value: '85m', icon: <Clock size={16} className="text-primary" /> },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span className="text-xs text-on-surface-variant font-medium">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold text-on-surface">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/child/progress')} className="w-full mt-6 py-2.5 rounded-xl border border-outline-variant text-[11px] font-bold uppercase tracking-widest hover:bg-surface transition-colors">Full Report</button>
                </Card>
              </div>
            </div>
          </Container>
          <footer className="py-6 text-center text-xs text-outline tracking-widest uppercase border-t border-outline-variant/30 mt-10">
            � 2024 The Curated Sanctuary � Family Reading Library
          </footer>
        </main>
      </div>
    </div>
  );
};

export default ChildDashboard;
