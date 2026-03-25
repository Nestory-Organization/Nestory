import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, BookOpen, Flame } from 'lucide-react';

const ChildDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Navbar with playful design */}
      <nav className="bg-white shadow-md border-b-4 border-nestory-400">
        <div className="container-responsive h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gradient">📚 Nestory</h1>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-gray-700">Hi, {user?.name}! 👋</span>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2 hover:animate-bounce-gentle"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content with playful animations */}
      <div className="container-responsive py-8">
        <div className="animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-2 animate-slide-down">
            🌟 Welcome to Your Reading Adventure!
          </h2>
          <p className="text-xl text-gray-600 mb-8">Keep reading and unlock amazing achievements!</p>

          {/* Stats Cards with playful animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card-interactive transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center text-3xl animate-float">
                  ✨
                </div>
                <div>
                  <p className="text-sm text-gray-600">Books Read</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </div>

            <div className="card-interactive transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-300 to-pink-400 rounded-full flex items-center justify-center text-3xl animate-pulse-glow">
                  <Flame size={32} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reading Streak</p>
                  <p className="text-2xl font-bold text-gray-900">5 Days</p>
                </div>
              </div>
            </div>

            <div className="card-interactive transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-300 to-emerald-400 rounded-full flex items-center justify-center text-3xl animate-bounce-gentle">
                  📖
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pages</p>
                  <p className="text-2xl font-bold text-gray-900">892</p>
                </div>
              </div>
            </div>

            <div className="card-interactive transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full flex items-center justify-center text-3xl animate-float">
                  ⏱️
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">4h 30m</p>
                </div>
              </div>
            </div>
          </div>

          {/* My Books Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="text-nestory-600" size={28} />
                <h3 className="text-2xl font-bold">📚 My Books</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] bg-gradient-to-br from-nestory-100 to-blue-100 rounded-lg shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer flex items-center justify-center text-4xl animate-scale-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    📖
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold mb-4">🏆 Recent Achievements</h3>
              <div className="space-y-4">
                {[
                  { emoji: '⭐', text: 'First Book!' },
                  { emoji: '🔥', text: '3-Day Streak' },
                  { emoji: '📚', text: '100 Pages' },
                ].map((achievement, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200 hover:shadow-md transition-all animate-slide-in-left"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <span className="text-2xl">{achievement.emoji}</span>
                    <span className="font-semibold text-gray-700">{achievement.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildDashboard;
