import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Settings, Users } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-responsive h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="text-nestory-600" size={28} />
            <h1 className="text-2xl font-bold text-gradient">Nestory Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user?.name}!</span>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-responsive py-8">
        <div className="animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Administration Panel</h2>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Users', value: '145', color: 'bg-blue-100' },
              { label: 'Families', value: '48', color: 'bg-green-100' },
              { label: 'Stories', value: '256', color: 'bg-purple-100' },
              { label: 'Active Sessions', value: '23', color: 'bg-yellow-100' },
            ].map((stat, i) => (
              <div key={i} className="card hover:shadow-lg transition-shadow">
                <div className={`${stat.color} rounded-lg p-4 mb-4`}>
                  <p className="text-sm font-semibold text-gray-700">{stat.label}</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Users Management */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <Users className="text-nestory-600" size={24} />
                <h3 className="text-xl font-bold">User Management</h3>
              </div>
              <div className="space-y-4">
                <button className="btn-primary w-full">View All Users</button>
                <button className="btn-secondary w-full">Manage Roles</button>
                <button className="btn-secondary w-full">View Reports</button>
              </div>
            </div>

            {/* Story Management */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">📚</span>
                <h3 className="text-xl font-bold">Story Library</h3>
              </div>
              <div className="space-y-4">
                <button className="btn-primary w-full">Browse Stories</button>
                <button className="btn-secondary w-full">Import from Google Books</button>
                <button className="btn-secondary w-full">Manage Categories</button>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="card">
            <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-700">User</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Action</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Time</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                      </td>
                      <td className="p-4">
                        <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          Success
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
