import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import { Users, Settings, BookOpen, Activity } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

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
          <StatCard title="Total Users" value="145" icon={Users} color="blue" subtext="Registered" />
          <StatCard title="Families" value="48" icon={Settings} color="green" subtext="Active groups" />
          <StatCard title="Stories" value="256" icon={BookOpen} color="purple" subtext="Library count" />
          <StatCard title="Sessions" value="23" icon={Activity} color="orange" subtext="Currently active" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-nestory-600" size={22} />
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            </div>
            <div className="space-y-3">
              <button className="btn-primary w-full">View All Users</button>
              <button className="btn-outline w-full">Manage Roles</button>
              <button className="btn-outline w-full">View Reports</button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-nestory-600" size={22} />
              <h2 className="text-xl font-bold text-gray-900">Story Management</h2>
            </div>
            <div className="space-y-3">
              <button className="btn-primary w-full">Browse Stories</button>
              <button className="btn-outline w-full">Import from Google Books</button>
              <button className="btn-outline w-full">Manage Categories</button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Recent Activity</h2>
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
  );
};

export default AdminDashboard;
