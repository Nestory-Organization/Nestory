import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import { Users, Settings, BookOpen, Activity } from 'lucide-react';
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

        const rawUsers = Array.isArray(usersResponse.data?.data) ? usersResponse.data.data : [];
        const normalizedUsers = rawUsers.map((item: AdminUser) => ({
          ...item,
          role: item.role === 'user' ? 'parent' : item.role,
        }));

        setUsers(normalizedUsers);
        setStoryCount(Array.isArray(storiesResponse.data) ? storiesResponse.data.length : 0);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load admin dashboard');
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
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);
  }, [users]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Admin" />

      {/* Main Content */}
      <div className="container-responsive py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Administration Panel</h1>
          <p className="text-gray-600">Welcome, {user?.name || 'Admin'}. Monitor users, families, and stories.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Users" value={isLoading ? '...' : userStats.total} icon={Users} color="blue" subtext="Registered" />
          <StatCard title="Active Users" value={isLoading ? '...' : userStats.active} icon={Settings} color="green" subtext="Enabled accounts" />
          <StatCard title="Stories" value={isLoading ? '...' : storyCount} icon={BookOpen} color="purple" subtext="Library count" />
          <StatCard title="Parents" value={isLoading ? '...' : userStats.parents} icon={Activity} color="orange" subtext={`Admins: ${userStats.admins}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-nestory-600" size={22} />
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            </div>
            <div className="space-y-3">
              <button className="btn-primary w-full" onClick={() => window.location.reload()}>Refresh Metrics</button>
              <button className="btn-outline w-full">Total Accounts: {userStats.total}</button>
              <button className="btn-outline w-full">Parent Accounts: {userStats.parents}</button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-nestory-600" size={22} />
              <h2 className="text-xl font-bold text-gray-900">Story Management</h2>
            </div>
            <div className="space-y-3">
              <button className="btn-primary w-full" onClick={() => navigate('/admin/stories')}>Browse Stories</button>
              <button className="btn-outline w-full">Total Stories: {storyCount}</button>
              <button className="btn-outline w-full">Catalog Health: Good</button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Recent Activity</h2>
          {isLoading ? (
            <p className="text-gray-600">Loading activity...</p>
          ) : recentUsers.length === 0 ? (
            <p className="text-gray-600">No user activity available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-700">User</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Joined</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((item) => (
                    <tr key={item._id || item.id || item.email} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{item.name || 'Unnamed user'}</p>
                        <p className="text-sm text-gray-600">{item.email || '-'}</p>
                      </td>
                      <td className="p-4 capitalize">{item.role || 'unknown'}</td>
                      <td className="p-4 text-gray-700">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="p-4">
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${item.isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {item.isActive === false ? 'Inactive' : 'Active'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
