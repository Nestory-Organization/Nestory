import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import { BookOpen, Flame, Clock, Award } from 'lucide-react';

const ChildDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="My Reading" />

      <div className="container-responsive py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome, {user?.name || 'Reader'}</h1>
          <p className="text-gray-600">Track your progress and continue your reading journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Books Read"
            value="12"
            icon={BookOpen}
            color="blue"
            subtext="All time"
          />
          <StatCard
            title="Reading Streak"
            value="5"
            icon={Flame}
            color="orange"
            subtext="Days"
          />
          <StatCard
            title="Total Pages"
            value="892"
            icon={Award}
            color="green"
            subtext="Completed"
          />
          <StatCard
            title="This Week"
            value="4h 30m"
            icon={Clock}
            color="purple"
            subtext="Reading time"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-nestory-600" size={22} />
              <h2 className="text-xl font-bold text-gray-900">My Books</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-[3/4] rounded-lg border border-gray-200 bg-nestory-50 flex items-center justify-center text-3xl">
                  📘
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Achievements</h2>
            <div className="space-y-3">
              {[
                { emoji: '⭐', text: 'First Book' },
                { emoji: '🔥', text: '3-Day Streak' },
                { emoji: '📚', text: '100 Pages Read' },
              ].map((achievement) => (
                <div key={achievement.text} className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center gap-3">
                  <span className="text-xl">{achievement.emoji}</span>
                  <span className="font-medium text-gray-700">{achievement.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildDashboard;
