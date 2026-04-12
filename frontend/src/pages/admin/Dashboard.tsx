import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Users,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  ArrowRight,
  MoreVertical,
  Activity
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import AdminSearchRequestPopup from '../../components/storyLibrary/AdminSearchRequestPopup';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient';
import StoryService from '../../services/storyService';
import { Container, Section, Grid, Card } from '../../components/common/StitchComponents';

interface AdminUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: 'parent' | 'admin' | 'child' | 'user';
  isActive?: boolean;
  createdAt?: string;
}

const Sidebar = ({ activeTab, onNavigate }: any) => {
  const tabs = [
    { id: "/admin", icon: <LayoutDashboard size={20} />, label: "Overview" },
    { id: "/admin/stories", icon: <BookOpen size={20} />, label: "Story Library" },
    { id: "/admin/gamification", icon: <Trophy size={20} />, label: "Gamification" },
    { id: "/admin/users", icon: <Users size={20} />, label: "User Management" },
    { id: "/admin/settings", icon: <Settings size={20} />, label: "System Settings" },
  ];
  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant/30 hidden md:flex flex-col py-6 px-4">
      <div className="px-4 py-4 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-outline">System Admin</span>
      </div>
      <div className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === tab.id ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className={activeTab === tab.id ? "text-on-primary" : "text-primary group-hover:scale-110 transition-transform"}>{tab.icon}</span>
            <span className="font-semibold text-sm">{tab.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [storyCount, setStoryCount] = useState(0);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setIsLoading(true);
        const [usersResponse, storiesResponse] = await Promise.all([
          apiClient.getInstance().get('/auth/users'),
          StoryService.getStories(1, 10),
        ]);
        const rawUsers = Array.isArray(usersResponse.data?.data) ? usersResponse.data.data : [];
        setUsers(rawUsers.map((item: AdminUser) => ({ ...item, role: item.role === 'user' ? 'parent' : item.role })));
        setStoryCount(storiesResponse.total || 0);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load admin dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    loadAdminData();
  }, []);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.isActive !== false).length,
    parents: users.filter(u => u.role === 'parent').length,
    admins: users.filter(u => u.role === 'admin').length,
  }), [users]);

  const recentUsers = useMemo(() => {
    return [...users].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5);
  }, [users]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar title="Admin · The Sanctuary" />
      <AdminSearchRequestPopup />
      <div className="flex flex-1">
        <Sidebar activeTab="/admin" onNavigate={navigate} />
        <main className="flex-1 min-w-0 overflow-y-auto bg-surface">
          <Container className="py-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h1 className="text-4xl serif-text font-bold text-primary tracking-tight italic">Registry Oversight</h1>
                <p className="mt-2 text-on-surface-variant font-medium">Monitoring the family growth across the sanctuary.</p>
              </div>
              <div className="flex gap-2">
                 <button className="btn-secondary flex items-center gap-2 text-xs py-2.5 px-5"><UserPlus size={16} /> New Admin</button>
              </div>
            </div>

            <Grid columns={4} gap="md" className="mb-8">
              {[
                { label: 'Total Users', value: stats.total, icon: <Users className="text-primary" />, trend: '+12% this month' },
                { label: 'Active Now', value: stats.active, icon: <Activity className="text-secondary" />, trend: 'Stable' },
                { label: 'Families', value: stats.parents, icon: <ShieldCheck className="text-tertiary" />, trend: '4 pending' },
                { label: 'Stories', value: storyCount, icon: <BookOpen className="text-primary" />, trend: '+3 added today' },
              ].map((s, i) => (
                <Card key={i} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-surface-container-high">{s.icon}</div>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{s.trend}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">{s.label}</p>
                  <p className="text-3xl font-bold serif-text text-primary mt-1">{isLoading ? '…' : s.value}</p>
                </Card>
              ))}
            </Grid>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="overflow-hidden border-none shadow-xl shadow-primary/5">
                  <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
                    <h2 className="serif-text font-bold text-lg text-primary">Recent Registrations</h2>
                    <button onClick={() => navigate('/admin/users')} className="text-[11px] font-bold text-primary uppercase tracking-widest hover:underline">View All Registry</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-container-high/50 text-[10px] font-bold uppercase tracking-widest text-outline">
                          <th className="px-6 py-4">Identity</th>
                          <th className="px-6 py-4">Domain</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Joined</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {recentUsers.map((u) => (
                          <tr key={u._id} className="hover:bg-primary/[0.02] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                                  {u.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-on-surface text-sm">{u.name}</p>
                                  <p className="text-xs text-on-surface-variant italic">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 uppercase text-[10px] font-bold tracking-widest text-primary">{u.role}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${u.isActive !== false ? 'bg-secondary/10 text-secondary' : 'bg-outline-variant/20 text-outline'}`}>
                                {u.isActive !== false ? 'Vigilant' : 'Dormant'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-on-surface-variant">{new Date(u.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors opacity-0 group-hover:opacity-100"><MoreVertical size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6 bg-primary/5 border-primary/20 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="serif-text font-bold text-primary mb-2">Systems Integrity</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4">All core services are operating within normal parameters.</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Authentication', ok: true },
                        { label: 'Story Fetcher', ok: true },
                        { label: 'Database', ok: true },
                      ].map((svc, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                          <span className="text-outline">{svc.label}</span>
                          <span className="text-secondary italic">Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-surface-container-high border-none outline outline-1 outline-outline-variant/30">
                  <Section title="Quick Actions">
                    <div className="grid grid-cols-1 gap-2 mt-4">
                      <button className="btn-outline w-full text-left flex items-center justify-between py-3 px-4 group">
                        <span className="text-xs font-bold uppercase tracking-widest">Verify New Stories</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary" />
                      </button>
                      <button className="btn-outline w-full text-left flex items-center justify-between py-3 px-4 group">
                        <span className="text-xs font-bold uppercase tracking-widest">Audit Activity Logs</span>
                         <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary" />
                      </button>
                    </div>
                  </Section>
                </Card>
              </div>
            </div>
          </Container>
          <footer className="py-8 text-center border-t border-outline-variant/30 bg-surface-container-low mt-12">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Administrator Portal · Curated Sanctuary Protocol</span>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
