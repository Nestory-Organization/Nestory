import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import AdminSearchRequestPopup from '../../components/storyLibrary/AdminSearchRequestPopup';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient';
import StoryService from '../../services/storyService';

interface AdminUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: 'parent' | 'admin' | 'child' | 'user';
  isActive?: boolean;
  createdAt?: string;
}

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
          StoryService.getStories(1, 200),
        ]);

        const rawUsers = Array.isArray(usersResponse.data?.data)
          ? usersResponse.data.data
          : [];

        const normalizedUsers = rawUsers.map((item: AdminUser) => ({
          ...item,
          role: item.role === 'user' ? 'parent' : item.role,
        }));

        setUsers(normalizedUsers);
        setStoryCount(storiesResponse.total || 0);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || 'Failed to load admin dashboard'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((item) => item.isActive !== false).length;
    const parents = users.filter((item) => item.role === 'parent').length;
    const admins = users.filter((item) => item.role === 'admin').length;
    return { total, active, parents, admins };
  }, [users]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 5);
  }, [users]);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar title="Admin · The Sanctuary" />
      <AdminSearchRequestPopup />

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-surface-container-low p-4 gap-1 flex-shrink-0">
          <div className="px-4 py-6 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Administration</span>
          </div>
          {[
            { icon: 'dashboard', label: 'Overview', route: '/admin' },
            { icon: 'library_books', label: 'Story Library', route: '/admin/stories' },
            { icon: 'military_tech', label: 'Gamification', route: '/admin/gamification' },
            { icon: 'group', label: 'Users', route: '/admin' },
          ].map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-semibold text-sm"
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 min-w-0">
          <div className="container-responsive py-8">
            {/* Welcome */}
            <div className="mb-10 animate-slide-up">
              <h1 className="text-4xl serif-text font-bold text-primary leading-tight">
                Administration Panel
              </h1>
              <p className="mt-2 text-on-surface-variant text-lg">
                Welcome, {user?.name || 'Admin'}. Monitor users, families, and the story library.
              </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {[
                { label: 'Total Users', value: isLoading ? '…' : userStats.total, icon: 'group', color: 'text-primary' },
                { label: 'Active Accounts', value: isLoading ? '…' : userStats.active, icon: 'verified_user', color: 'text-tertiary' },
                { label: 'Story Library', value: isLoading ? '…' : storyCount, icon: 'library_books', color: 'text-secondary' },
                { label: 'Parent Accounts', value: isLoading ? '…' : userStats.parents, icon: 'family_restroom', color: 'text-primary-container' },
              ].map((stat) => (
                <div key={stat.label} className="card flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-surface-container-high flex-shrink-0">
                    <span className={`material-symbols-outlined text-2xl ${stat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {stat.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
                    <p className="text-3xl font-bold serif-text text-primary mt-1">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {[
                {
                  icon: 'group',
                  title: 'User Management',
                  actions: [
                    { label: 'Refresh Metrics', onClick: () => window.location.reload(), variant: 'primary' },
                    { label: `Total Accounts: ${userStats.total}`, onClick: () => {}, variant: 'outline' },
                    { label: `Parent Accounts: ${userStats.parents}`, onClick: () => {}, variant: 'outline' },
                  ],
                },
                {
                  icon: 'library_books',
                  title: 'Story Management',
                  actions: [
                    { label: 'Browse Stories', onClick: () => navigate('/admin/stories'), variant: 'primary' },
                    { label: `Total Stories: ${storyCount}`, onClick: () => {}, variant: 'outline' },
                    { label: 'Catalog Health: Good ✓', onClick: () => {}, variant: 'outline' },
                  ],
                },
                {
                  icon: 'military_tech',
                  title: 'Gamification',
                  actions: [
                    { label: 'Manage Badges', onClick: () => navigate('/admin/gamification'), variant: 'primary' },
                    { label: 'Create Achievements', onClick: () => navigate('/admin/gamification'), variant: 'outline' },
                    { label: 'View Leaderboard', onClick: () => navigate('/admin/gamification'), variant: 'outline' },
                  ],
                },
              ].map((section) => (
                <div key={section.title} className="card">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {section.icon}
                    </span>
                    <h2 className="serif-text font-bold text-lg text-on-surface">{section.title}</h2>
                  </div>
                  <div className="space-y-3">
                    {section.actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        className={action.variant === 'primary' ? 'btn-primary w-full' : 'btn-outline w-full'}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Users Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="serif-text font-bold text-xl text-on-surface">Recent Users</h2>
                <span className="badge badge-primary">{recentUsers.length} shown</span>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full" />)}
                </div>
              ) : recentUsers.length === 0 ? (
                <p className="text-on-surface-variant text-center py-8">No user activity available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant/30">
                        {['User', 'Role', 'Joined', 'Status'].map((h) => (
                          <th key={h} className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((item) => (
                        <tr
                          key={item._id || item.id || item.email}
                          className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-sm font-bold text-on-primary-container flex-shrink-0">
                                {item.name?.charAt(0).toUpperCase() ?? 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-on-surface text-sm">{item.name || 'Unnamed user'}</p>
                                <p className="text-xs text-on-surface-variant">{item.email || '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`badge ${item.role === 'admin' ? 'badge-warning' : 'badge-primary'} capitalize`}>
                              {item.role || 'unknown'}
                            </span>
                          </td>
                          <td className="p-4 text-on-surface-variant text-sm">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4">
                            <span className={`badge ${item.isActive === false ? 'badge-danger' : 'badge-success'}`}>
                              {item.isActive === false ? 'Inactive' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <footer className="py-6 text-center text-xs text-outline tracking-widest uppercase border-t border-outline-variant/30 mt-8">
            © 2024 The Curated Sanctuary · Administration
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;