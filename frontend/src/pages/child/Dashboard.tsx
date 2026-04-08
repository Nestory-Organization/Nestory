import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import StoryCard from '../../components/common/StoryCard';
import { BookOpen, Flame, Clock, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import StoryService from '../../services/storyService';
import { Story } from '../../types';

const ChildDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      try {
        setIsLoading(true);
        const response = await StoryService.getStories(1, 24);
        setStories(response.data || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load stories');
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, []);

  const beginnerCount = useMemo(
    () => stories.filter((story) => story.readingLevel === 'beginner').length,
    [stories]
  );

  const middleGradeCount = useMemo(
    () => stories.filter((story) => story.ageGroup === 'middle-grade').length,
    [stories]
  );

  const quickPicks = useMemo(() => stories.slice(0, 6), [stories]);

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
            title="Stories Available"
            value={isLoading ? '...' : stories.length}
            icon={BookOpen}
            color="blue"
            subtext="In your library"
          />
          <StatCard
            title="Beginner Friendly"
            value={isLoading ? '...' : beginnerCount}
            icon={Flame}
            color="orange"
            subtext="Easy stories"
          />
          <StatCard
            title="Middle Grade"
            value={isLoading ? '...' : middleGradeCount}
            icon={Award}
            color="green"
            subtext="Age-fit picks"
          />
          <StatCard
            title="Quick Picks"
            value={isLoading ? '...' : quickPicks.length}
            icon={Clock}
            color="purple"
            subtext="Ready to read"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-nestory-600" size={22} />
              <h2 className="text-xl font-bold text-gray-900">Story Picks</h2>
            </div>
            {isLoading ? (
              <p className="text-gray-600">Loading story recommendations...</p>
            ) : quickPicks.length === 0 ? (
              <p className="text-gray-600">No stories available yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {quickPicks.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reading Tips</h2>
            <div className="space-y-3">
              {[
                { emoji: '📘', text: 'Read 15 minutes daily' },
                { emoji: '📝', text: 'Tell a parent what you learned' },
                { emoji: '🎯', text: 'Finish one story this week' },
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
