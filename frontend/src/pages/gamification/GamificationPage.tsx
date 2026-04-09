import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import { Sparkles, Trophy, Award, ShieldCheck, ListChecks, Clock, TrendingUp, ChevronRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import GamificationService from '../../services/gamificationService';
import {
  GamificationProgress,
  GamificationBadgeProgress,
  GamificationAchievementProgress,
  GamificationBadge,
  GamificationAchievement,
  GamificationTransaction,
  LeaderboardEntry,
} from '../../types';

const maxLeaderboardItems = 6;

const formatBadgeLabel = (badge: GamificationBadge) => {
  return `${badge.name} • ${badge.points} pts`;
};

const GamificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState<GamificationProgress | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<GamificationBadgeProgress[]>([]);
  const [achievements, setAchievements] = useState<GamificationAchievementProgress[]>([]);
  const [availableBadges, setAvailableBadges] = useState<GamificationBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [transactions, setTransactions] = useState<GamificationTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        return;
      }

      setIsLoading(true);
      try {
        const [progressData, badgesData, achievementsData, allBadgesData, leaderboardData, transactionsData] =
          await Promise.all([
            GamificationService.getUserProgress(user.id),
            GamificationService.getUserBadges(user.id),
            GamificationService.getUserAchievements(user.id),
            GamificationService.getAllBadges(undefined, undefined, true),
            GamificationService.getLeaderboard(maxLeaderboardItems, user.role === 'child'),
            GamificationService.getTransactionHistory(user.id, undefined, 10),
          ]);

        setProgress(progressData);
        setEarnedBadges(badgesData);
        setAchievements(achievementsData);
        setAvailableBadges(
          allBadgesData.filter((badge) =>
            !badgesData.some((earned) => earned.badge.id === badge.id)
          )
        );
        setLeaderboard(leaderboardData);
        setTransactions(transactionsData);
      } catch (error: unknown) {
        const message =
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Unable to load gamification data';

        toast.error(message || 'Unable to load gamification data');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  const completedAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.completed),
    [achievements]
  );

  const activeAchievements = useMemo(
    () => achievements.filter((achievement) => !achievement.completed),
    [achievements]
  );

  const leaderboardTitle = user?.role === 'child' ? 'Child Leaderboard' : 'Leaderboard';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Gamification" />
      <div className="container-responsive py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gamification</h1>
            <p className="text-gray-600 mt-1">
              Track points, badges, achievements, and leaderboard progress inside Nestory.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(user?.role === 'child' ? '/child' : '/dashboard')}
              className="btn-secondary flex items-center gap-2"
            >
              <ChevronRight size={18} />
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Points"
            value={isLoading ? '...' : progress?.totalPoints ?? 0}
            icon={Sparkles}
            color="blue"
            subtext="Points earned so far"
          />
          <StatCard
            title="Current Level"
            value={isLoading ? '...' : progress?.level ?? 1}
            icon={Trophy}
            color="purple"
            subtext="Level based on points"
          />
          <StatCard
            title="Streak"
            value={isLoading ? '...' : progress?.currentStreak ?? 0}
            icon={Clock}
            color="orange"
            subtext="Days in a row reading"
          />
          <StatCard
            title="Assignments Completed"
            value={isLoading ? '...' : progress?.stats.assignmentsCompleted ?? 0}
            icon={ListChecks}
            color="green"
            subtext="Assignments finished"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-semibold text-nestory-700 flex items-center gap-2">
                    <Award size={16} /> Earned Badges
                  </p>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">Your Badge Collection</h2>
                </div>
                <span className="text-sm text-gray-500">
                  {earnedBadges.length} earned
                </span>
              </div>
              {isLoading ? (
                <p className="text-gray-600">Loading badges …</p>
              ) : earnedBadges.length === 0 ? (
                <p className="text-gray-600">No badges earned yet. Keep reading and completing assignments to unlock your first badge.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {earnedBadges.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-gray-200 p-4 bg-white">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{item.badge.name}</p>
                          <p className="text-sm text-gray-500">{item.badge.category}</p>
                        </div>
                        <div className="badge bg-green-100 text-green-800">{item.badge.points} pts</div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{item.badge.description}</p>
                      <p className="text-xs text-gray-500">Earned {item.earnedAt ? new Date(item.earnedAt).toLocaleDateString() : 'recently'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-semibold text-nestory-700 flex items-center gap-2">
                    <ShieldCheck size={16} /> Available Badges
                  </p>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">Badges to Earn</h2>
                </div>
                <span className="text-sm text-gray-500">{availableBadges.length} options</span>
              </div>
              {isLoading ? (
                <p className="text-gray-600">Loading available badge list …</p>
              ) : availableBadges.length === 0 ? (
                <p className="text-gray-600">You have already unlocked all active badges, or no badge definitions are available.</p>
              ) : (
                <div className="space-y-3">
                  {availableBadges.slice(0, 6).map((badge) => (
                    <div key={badge.id} className="rounded-2xl border border-gray-200 p-4 bg-white">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="font-semibold text-gray-900">{badge.name}</p>
                        <span className="badge bg-indigo-100 text-indigo-800">{badge.points} pts</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                      <p className="text-xs text-gray-500">Requires {badge.criteria?.threshold ?? 'N/A'} {badge.criteria?.type?.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-nestory-700 flex items-center gap-2">
                  <ListChecks size={16} /> Achievement Progress
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-1">Goal Tracker</h2>
              </div>
              <span className="text-sm text-gray-500">{achievements.length} tracked</span>
            </div>
            {isLoading ? (
              <p className="text-gray-600">Loading achievements …</p>
            ) : achievements.length === 0 ? (
              <p className="text-gray-600">No tracked achievements yet. Complete more actions to start progress bars.</p>
            ) : (
              <div className="space-y-4">
                {[...activeAchievements, ...completedAchievements].map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 p-4 bg-white">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{item.achievement.name}</p>
                        <p className="text-sm text-gray-500">{item.achievement.description}</p>
                      </div>
                      <span className={`badge ${item.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {item.completed ? 'Completed' : 'In progress'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {item.progress}/{item.achievement.targetValue} points
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-nestory-500 to-blue-500"
                        style={{ width: `${Math.min((item.progress / Math.max(item.achievement.targetValue, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    {item.completedAt && (
                      <p className="text-xs text-gray-500 mt-2">Completed {new Date(item.completedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-nestory-700 flex items-center gap-2">
                  <TrendingUp size={16} /> {leaderboardTitle}
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-1">Top Players</h2>
              </div>
              <span className="text-sm text-gray-500">Top {leaderboard.length}</span>
            </div>
            {isLoading ? (
              <p className="text-gray-600">Loading leaderboard …</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-gray-600">No leaderboard entries yet.</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} className="rounded-2xl border border-gray-200 p-4 bg-white flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">#{index + 1} {entry.child ? `(${entry.child.name})` : entry.user?.name}</p>
                      <p className="font-semibold text-gray-900">{entry.user?.name || entry.child?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 mt-1">{entry.totalPoints} points • Level {entry.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{entry.currentStreak}d</p>
                      <p className="text-xs text-gray-500">streak</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-nestory-700 flex items-center gap-2">
                  <Clock size={16} /> Recent Activity
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-1">Point History</h2>
              </div>
              <span className="text-sm text-gray-500">Last {transactions.length}</span>
            </div>
            {isLoading ? (
              <p className="text-gray-600">Loading transactions …</p>
            ) : transactions.length === 0 ? (
              <p className="text-gray-600">No recent point transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 p-4 bg-white">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500">{item.source.replace('_', ' ')}</p>
                      </div>
                      <span className={`font-semibold ${item.points >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {item.points > 0 ? `+${item.points}` : item.points}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Balance: {item.balanceAfter}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card border-dashed border-gray-300">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Sparkles size={16} /> Tip
          </div>
          <p className="text-sm text-gray-600">Use this screen to celebrate reading milestones, check current progress, and compare your score with other Nestory players. If you want, refresh the page after completing a story, assignment, or challenge.</p>
        </div>
      </div>
    </div>
  );
};

export default GamificationPage;
