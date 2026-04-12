import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import { 
  Sparkles, 
  Trophy, 
  Award, 
  ShieldCheck, 
  ListChecks, 
  Clock, 
  TrendingUp, 
  ChevronRight, 
  Medal,
  Star,
  Zap,
  Flame,
  Target,
  Crown,
  History,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import GamificationService from '../../services/gamificationService';
import { Section, Container, Card, Grid } from '../../components/common/StitchComponents';
import {
  GamificationProgress,
  GamificationBadgeProgress,
  GamificationAchievementProgress,
  GamificationBadge,
  GamificationTransaction,
  LeaderboardEntry,
} from '../../types';

const maxLeaderboardItems = 6;

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
      if (!user?.id) return;
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
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Unable to load your rewards');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const activeAchievements = useMemo(
    () => achievements.filter((a) => !a.completed),
    [achievements]
  );

  const completedAchievements = useMemo(
    () => achievements.filter((a) => a.completed),
    [achievements]
  );

  const stats = [
    { label: 'Total XP', value: progress?.totalPoints ?? 0, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Sanctuary Level', value: progress?.level ?? 1, icon: Trophy, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Day Streak', value: progress?.currentStreak ?? 0, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Quests Done', value: progress?.stats.assignmentsCompleted ?? 0, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Navbar title="Hall of Achievements" />
      
      <main className="pb-20">
        <Section className="bg-primary/5 pt-12 pb-24 border-b border-outline-variant/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -mr-48 -mt-48 opacity-50" />
          <Container>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-surface shadow-2xl border-4 border-primary/20 flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-primary/5 rounded-2xl group-hover:scale-95 transition-transform duration-500" />
                  <Crown size={64} className="text-primary relative z-10" />
                  <div className="absolute -bottom-3 px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-full shadow-lg">
                    LVL {progress?.level ?? 1}
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black serif-text text-on-surface tracking-tight mb-2">
                    {user?.name}'s Legacy
                  </h1>
                  <p className="text-lg text-on-surface-variant max-w-lg font-medium">
                    Your journey through the Nestory archives. Every story read is a brick in your sanctuary.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate(-1)}
                className="self-start md:self-center px-6 py-3 bg-surface-container-highest/50 backdrop-blur-sm border border-outline-variant/50 rounded-2xl hover:bg-surface-container-highest transition-all flex items-center gap-3 font-bold text-on-surface-variant group"
              >
                <ChevronRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                Return to Journey
              </button>
            </div>
          </Container>
        </Section>

        <Container className="-mt-16 relative z-20">
          <Grid cols={4} className="gap-6">
            {stats.map((stat, i) => (
              <Card key={i} variant="elevated" className="p-6 group hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} group-hover:rotate-12 transition-transform`}>
                    <stat.icon size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-on-surface">{isLoading ? '...' : stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </Grid>

          <Grid cols={3} className="gap-8 mt-12">
            <div className="lg:col-span-2 space-y-12">
              <Section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                      <Medal size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-on-surface serif-text">Earned Badges</h2>
                      <p className="text-on-surface-variant font-medium">Milestones you have conquered</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-amber-50 text-amber-700 font-bold rounded-xl border border-amber-200">
                    {earnedBadges.length} Collected
                  </span>
                </div>

                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-surface-container rounded-3xl" />)}
                  </div>
                ) : earnedBadges.length === 0 ? (
                  <Card variant="outlined" className="p-12 text-center border-dashed border-2">
                    <Sparkles className="mx-auto text-outline-variant mb-4" size={48} />
                    <h3 className="text-xl font-bold text-on-surface mb-2">No badges yet</h3>
                    <p className="text-on-surface-variant max-w-xs mx-auto">Complete assignments or read stories to earn your first badge of honor!</p>
                  </Card>
                ) : (
                  <Grid cols={2} className="gap-4">
                    {earnedBadges.map((item) => (
                      <Card key={item.id} className="p-5 hover:bg-surface-container-low transition-colors border border-outline-variant/30">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                            <Zap size={32} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-black text-on-surface leading-tight">{item.badge.name}</h4>
                              <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                +{item.badge.points} XP
                              </span>
                            </div>
                            <p className="text-sm text-on-surface-variant font-medium line-clamp-2 mb-2">{item.badge.description}</p>
                            <p className="text-[10px] font-bold text-outline-variant uppercase tracking-tighter">
                              Earned {new Date(item.earnedAt || '').toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Grid>
                )}
              </Section>

              <Section>
                <div className="flex items-center justify-between mb-8 pt-8 border-t border-outline-variant/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <ListChecks size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-on-surface serif-text">Active Quests</h2>
                      <p className="text-on-surface-variant font-medium">Your current path to mastery</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[...activeAchievements, ...completedAchievements].slice(0, 5).map((item) => (
                    <Card key={item.achievement.id} variant="outlined" className={`p-6 transition-all ${item.completed ? 'opacity-70 bg-surface-container-low/50' : 'hover:border-primary/50'}`}>
                      <div className="flex items-center justify-between gap-6 mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${item.completed ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                            {item.completed ? <CheckCircle2 size={24} /> : <TrendingUp size={24} />}
                          </div>
                          <div>
                            <h4 className="font-black text-on-surface leading-tight">{item.achievement.name}</h4>
                            <p className="text-sm text-on-surface-variant font-medium">{item.achievement.description}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-black text-on-surface">{item.progress}<span className="text-sm text-on-surface-variant font-bold">/{item.achievement.targetValue}</span></p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Progress</p>
                        </div>
                      </div>
                      <div className="h-3 bg-surface-container rounded-full overflow-hidden border border-outline-variant/30">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${item.completed ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-primary-container'}`}
                          style={{ width: `${Math.min((item.progress / Math.max(item.achievement.targetValue, 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </Section>
            </div>

            <aside className="space-y-8">
              <Card className="p-6 bg-primary text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Crown size={24} />
                    <h3 className="text-xl font-black serif-text">Hall of Fame</h3>
                  </div>
                  <div className="space-y-4">
                    {leaderboard.map((entry, i) => (
                      <div key={entry.id} className={`flex items-center justify-between p-3 rounded-2xl ${i === 0 ? 'bg-white/20' : 'bg-white/5'} backdrop-blur-sm border border-white/10`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-400 text-amber-900' : 'bg-white/10'}`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-bold leading-none">{entry.user?.name || entry.child?.name}</p>
                            <p className="text-[10px] opacity-70 font-bold uppercase tracking-tighter mt-1">LVL {entry.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black leading-none">{entry.totalPoints}</p>
                          <p className="text-[10px] opacity-70 font-bold uppercase tracking-tighter mt-1">Total XP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card variant="outlined" className="p-6 border-outline-variant/30">
                <div className="flex items-center gap-3 mb-6">
                  <History className="text-primary" size={20} />
                  <h3 className="text-lg font-black text-on-surface serif-text">Point History</h3>
                </div>
                <div className="space-y-4">
                  {transactions.slice(0, 4).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between gap-4 pb-4 border-b border-outline-variant/20 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-bold text-on-surface leading-tight">{tx.description}</p>
                        <p className="text-[10px] font-bold text-outline-variant uppercase tracking-tighter mt-1">{tx.source.replace('_', ' ')}</p>
                      </div>
                      <span className={`text-sm font-black ${tx.points >= 0 ? 'text-green-600' : 'text-error'}`}>
                        {tx.points > 0 ? `+${tx.points}` : tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-surface-container-lowest border-2 border-dashed border-outline-variant/50">
                <div className="flex items-center gap-3 mb-3 text-primary">
                  <Info size={20} />
                  <h3 className="font-black uppercase tracking-widest text-xs">Architect's Tip</h3>
                </div>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  Every page you turn builds your legacy. Consistent readers earn a <strong>Day Streak bonus</strong>. Keep the flame alive to multiply your XP gains throughout the sanctuary.
                </p>
              </Card>
            </aside>
          </Grid>
        </Container>
      </main>
    </div>
  );
};

// Check for existing icon imports in components/common/Navbar and add if missing
import { CheckCircle2 } from 'lucide-react';

export default GamificationPage;
