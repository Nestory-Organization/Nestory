import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/common/Navbar';
import InputField from '../../../components/common/InputField';
import SelectField from '../../../components/common/SelectField';
import Modal from '../../../components/common/Modal';
import { Plus, Award, Zap, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import GamificationService from '../../../services/gamificationService';
import { GamificationBadge, GamificationAchievement } from '../../../types';

type BadgeFormData = {
  name: string;
  description: string;
  icon: string;
  category: 'reading' | 'streak' | 'achievement' | 'social' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: 'story_count' | 'days_streak' | 'total_points' | 'assignments_completed' | 'custom';
    threshold: number;
  };
  isActive: boolean;
};

type AchievementFormData = {
  name: string;
  description: string;
  icon: string;
  category: 'reading' | 'consistency' | 'milestone' | 'social' | 'exploration';
  type: 'one_time' | 'repeatable' | 'progressive';
  targetValue: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  reward: {
    points: number;
    badge?: string;
  };
  isActive: boolean;
};

const GamificationAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'badges' | 'achievements'>('badges');
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [isCreatingBadge, setIsCreatingBadge] = useState(false);
  const [isCreatingAchievement, setIsCreatingAchievement] = useState(false);
  const [badgeFormErrors, setBadgeFormErrors] = useState<Record<string, string>>({});
  const [achievementFormErrors, setAchievementFormErrors] = useState<Record<string, string>>({});
  const [availableBadges, setAvailableBadges] = useState<GamificationBadge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);

  const [badgeForm, setBadgeForm] = useState<BadgeFormData>({
    name: '',
    description: '',
    icon: '🏆',
    category: 'achievement',
    tier: 'bronze',
    points: 10,
    rarity: 'common',
    criteria: {
      type: 'story_count',
      threshold: 5,
    },
    isActive: true,
  });

  const [achievementForm, setAchievementForm] = useState<AchievementFormData>({
    name: '',
    description: '',
    icon: '⭐',
    category: 'milestone',
    type: 'one_time',
    targetValue: 10,
    difficulty: 'medium',
    reward: {
      points: 50,
    },
    isActive: true,
  });

  useEffect(() => {
    const loadBadges = async () => {
      try {
        setIsLoadingBadges(true);
        const badges = await GamificationService.getAllBadges();
        setAvailableBadges(badges);
      } catch (error) {
        console.error('Error loading badges:', error);
      } finally {
        setIsLoadingBadges(false);
      }
    };

    loadBadges();
  }, []);

  const validateBadgeForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!badgeForm.name.trim()) errors.name = 'Badge name is required';
    if (!badgeForm.description.trim()) errors.description = 'Badge description is required';
    if (badgeForm.points < 0) errors.points = 'Points cannot be negative';
    if (badgeForm.criteria.threshold <= 0) errors.threshold = 'Threshold must be greater than 0';
    setBadgeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAchievementForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!achievementForm.name.trim()) errors.name = 'Achievement name is required';
    if (!achievementForm.description.trim()) errors.description = 'Achievement description is required';
    if (achievementForm.targetValue <= 0) errors.targetValue = 'Target value must be greater than 0';
    if (achievementForm.reward.points < 0) errors.points = 'Points cannot be negative';
    setAchievementFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBadge = async () => {
    if (!validateBadgeForm()) {
      toast.error('Please correct the highlighted fields');
      return;
    }

    try {
      setIsCreatingBadge(true);
      const response = await GamificationService.createBadge({
        name: badgeForm.name.trim(),
        description: badgeForm.description.trim(),
        icon: badgeForm.icon,
        category: badgeForm.category,
        tier: badgeForm.tier,
        points: badgeForm.points,
        rarity: badgeForm.rarity,
        criteria: badgeForm.criteria,
        isActive: badgeForm.isActive,
      } as Partial<GamificationBadge>);

      toast.success('Badge created successfully');
      setBadgeForm({
        name: '',
        description: '',
        icon: '🏆',
        category: 'achievement',
        tier: 'bronze',
        points: 10,
        rarity: 'common',
        criteria: {
          type: 'story_count',
          threshold: 5,
        },
        isActive: true,
      });
      setBadgeFormErrors({});
      setShowBadgeModal(false);

      // Refresh badges list
      const badges = await GamificationService.getAllBadges();
      setAvailableBadges(badges);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create badge';
      toast.error(message);
    } finally {
      setIsCreatingBadge(false);
    }
  };

  const handleCreateAchievement = async () => {
    if (!validateAchievementForm()) {
      toast.error('Please correct the highlighted fields');
      return;
    }

    try {
      setIsCreatingAchievement(true);
      await GamificationService.createAchievement({
        name: achievementForm.name.trim(),
        description: achievementForm.description.trim(),
        icon: achievementForm.icon,
        category: achievementForm.category,
        type: achievementForm.type,
        targetValue: achievementForm.targetValue,
        difficulty: achievementForm.difficulty,
        reward: {
          points: achievementForm.reward.points,
          badge: achievementForm.reward.badge ? { id: achievementForm.reward.badge } as any : undefined,
        },
        isActive: achievementForm.isActive,
      });

      toast.success('Achievement created successfully');
      setAchievementForm({
        name: '',
        description: '',
        icon: '⭐',
        category: 'milestone',
        type: 'one_time',
        targetValue: 10,
        difficulty: 'medium',
        reward: {
          points: 50,
        },
        isActive: true,
      });
      setAchievementFormErrors({});
      setShowAchievementModal(false);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create achievement';
      toast.error(message);
    } finally {
      setIsCreatingAchievement(false);
    }
  };

  const badgeEmojiOptions = ['🏆', '🥇', '🥈', '🥉', '⭐', '✨', '🌟', '💫', '🎖️', '🎯', '🔥', '💎'];
  const achievementEmojiOptions = ['⭐', '✨', '🌟', '💫', '🏅', '🎖️', '🎯', '🚀', '🔥', '💪', '👑', '🏆'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Gamification Administration" />
      <div className="container-responsive py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gamification Admin</h1>
            <p className="text-gray-600 mt-1">Create and manage badges and achievements for your system.</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Admin
          </button>
        </div>

        {/* Tabs */}
        <div className="card mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'badges'
                  ? 'border-nestory-600 text-nestory-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Award size={18} />
                Badges
              </div>
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'achievements'
                  ? 'border-nestory-600 text-nestory-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap size={18} />
                Achievements
              </div>
            </button>
          </div>
        </div>

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Badges</h2>
                <p className="text-gray-600 mt-1">Create new badges that users can earn through the system.</p>
              </div>
              <button
                onClick={() => setShowBadgeModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Create Badge
              </button>
            </div>

            {isLoadingBadges ? (
              <div className="card text-center py-8">
                <p className="text-gray-600">Loading badges...</p>
              </div>
            ) : availableBadges.length === 0 ? (
              <div className="card text-center py-12">
                <AlertCircle className="mx-auto mb-3 text-gray-400" size={32} />
                <p className="text-gray-600 mb-4">No badges created yet.</p>
                <button
                  onClick={() => setShowBadgeModal(true)}
                  className="btn-primary mx-auto flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Your First Badge
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableBadges.map((badge) => (
                  <div key={badge.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-4xl">{badge.icon || '🏆'}</span>
                      <span className={`badge ${badge.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {badge.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900">{badge.name}</p>
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-semibold text-gray-900">{badge.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tier:</span>
                        <span className="font-semibold text-gray-900 capitalize">{badge.tier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Points:</span>
                        <span className="font-semibold text-nestory-600">{badge.points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rarity:</span>
                        <span className="font-semibold text-gray-900 capitalize">{badge.rarity || 'common'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Achievements</h2>
                <p className="text-gray-600 mt-1">Create new achievements that users can complete and progress through.</p>
              </div>
              <button
                onClick={() => setShowAchievementModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Create Achievement
              </button>
            </div>

            <div className="card text-center py-12 border-dashed">
              <Zap className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="text-gray-600 mb-4">Achievement management coming soon. Use the form to create achievements.</p>
              <button
                onClick={() => setShowAchievementModal(true)}
                className="btn-primary mx-auto flex items-center gap-2"
              >
                <Plus size={18} />
                Create Achievement
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Badge Creation Modal */}
      <Modal
        isOpen={showBadgeModal}
        title="Create New Badge"
        onClose={() => {
          setShowBadgeModal(false);
          setBadgeForm({
            name: '',
            description: '',
            icon: '🏆',
            category: 'achievement',
            tier: 'bronze',
            points: 10,
            rarity: 'common',
            criteria: {
              type: 'story_count',
              threshold: 5,
            },
            isActive: true,
          });
          setBadgeFormErrors({});
        }}
        onConfirm={handleCreateBadge}
        confirmText="Create Badge"
        size="lg"
        isLoading={isCreatingBadge}
      >
        <div className="space-y-6">
          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {badgeEmojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setBadgeForm({ ...badgeForm, icon: emoji })}
                  type="button"
                  className={`text-3xl p-2 rounded-lg border-2 transition-all ${
                    badgeForm.icon === emoji
                      ? 'border-nestory-600 bg-nestory-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <InputField
            label="Badge Name"
            name="name"
            value={badgeForm.name}
            onChange={(e) => {
              setBadgeForm({ ...badgeForm, name: e.target.value });
              if (badgeFormErrors.name) setBadgeFormErrors({ ...badgeFormErrors, name: '' });
            }}
            placeholder="e.g., Story Master"
            error={badgeFormErrors.name}
            required
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              className={`w-full rounded-lg border px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-nestory-600 focus:outline-none ${
                badgeFormErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              value={badgeForm.description}
              onChange={(e) => {
                setBadgeForm({ ...badgeForm, description: e.target.value });
                if (badgeFormErrors.description) setBadgeFormErrors({ ...badgeFormErrors, description: '' });
              }}
              placeholder="e.g., Earned by reading 10 stories"
              rows={3}
            />
            {badgeFormErrors.description && <p className="text-sm text-red-600 mt-1">{badgeFormErrors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <SelectField
              label="Category"
              name="category"
              value={badgeForm.category}
              onChange={(e) => setBadgeForm({ ...badgeForm, category: e.target.value as any })}
              options={[
                { value: 'reading', label: 'Reading' },
                { value: 'streak', label: 'Streak' },
                { value: 'achievement', label: 'Achievement' },
                { value: 'social', label: 'Social' },
                { value: 'special', label: 'Special' },
              ]}
            />

            {/* Tier */}
            <SelectField
              label="Tier"
              name="tier"
              value={badgeForm.tier}
              onChange={(e) => setBadgeForm({ ...badgeForm, tier: e.target.value as any })}
              options={[
                { value: 'bronze', label: 'Bronze' },
                { value: 'silver', label: 'Silver' },
                { value: 'gold', label: 'Gold' },
                { value: 'platinum', label: 'Platinum' },
                { value: 'diamond', label: 'Diamond' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Points */}
            <InputField
              label="Points"
              name="points"
              type="number"
              value={badgeForm.points}
              onChange={(e) => setBadgeForm({ ...badgeForm, points: parseInt(e.target.value) || 0 })}
              min="0"
              error={badgeFormErrors.points}
              required
            />

            {/* Rarity */}
            <SelectField
              label="Rarity"
              name="rarity"
              value={badgeForm.rarity}
              onChange={(e) => setBadgeForm({ ...badgeForm, rarity: e.target.value as any })}
              options={[
                { value: 'common', label: 'Common' },
                { value: 'rare', label: 'Rare' },
                { value: 'epic', label: 'Epic' },
                { value: 'legendary', label: 'Legendary' },
              ]}
            />
          </div>

          {/* Criteria */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">Unlock Criteria</label>
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Type"
                name="criteriaType"
                value={badgeForm.criteria.type}
                onChange={(e) =>
                  setBadgeForm({
                    ...badgeForm,
                    criteria: { ...badgeForm.criteria, type: e.target.value as any },
                  })
                }
                options={[
                  { value: 'story_count', label: 'Stories Read' },
                  { value: 'days_streak', label: 'Reading Streak' },
                  { value: 'total_points', label: 'Total Points' },
                  { value: 'assignments_completed', label: 'Assignments Completed' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />

              <InputField
                label="Threshold"
                name="threshold"
                type="number"
                value={badgeForm.criteria.threshold}
                onChange={(e) =>
                  setBadgeForm({
                    ...badgeForm,
                    criteria: { ...badgeForm.criteria, threshold: parseInt(e.target.value) || 1 },
                  })
                }
                min="1"
                error={badgeFormErrors.threshold}
                required
              />
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={badgeForm.isActive}
                onChange={(e) => setBadgeForm({ ...badgeForm, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-semibold text-gray-700">Active Badge (visible to users)</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Achievement Creation Modal */}
      <Modal
        isOpen={showAchievementModal}
        title="Create New Achievement"
        onClose={() => {
          setShowAchievementModal(false);
          setAchievementForm({
            name: '',
            description: '',
            icon: '⭐',
            category: 'milestone',
            type: 'one_time',
            targetValue: 10,
            difficulty: 'medium',
            reward: {
              points: 50,
            },
            isActive: true,
          });
          setAchievementFormErrors({});
        }}
        onConfirm={handleCreateAchievement}
        confirmText="Create Achievement"
        size="lg"
        isLoading={isCreatingAchievement}
      >
        <div className="space-y-6">
          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {achievementEmojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAchievementForm({ ...achievementForm, icon: emoji })}
                  type="button"
                  className={`text-3xl p-2 rounded-lg border-2 transition-all ${
                    achievementForm.icon === emoji
                      ? 'border-nestory-600 bg-nestory-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <InputField
            label="Achievement Name"
            name="name"
            value={achievementForm.name}
            onChange={(e) => {
              setAchievementForm({ ...achievementForm, name: e.target.value });
              if (achievementFormErrors.name) setAchievementFormErrors({ ...achievementFormErrors, name: '' });
            }}
            placeholder="e.g., Reading Streak"
            error={achievementFormErrors.name}
            required
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              className={`w-full rounded-lg border px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-nestory-600 focus:outline-none ${
                achievementFormErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              value={achievementForm.description}
              onChange={(e) => {
                setAchievementForm({ ...achievementForm, description: e.target.value });
                if (achievementFormErrors.description) setAchievementFormErrors({ ...achievementFormErrors, description: '' });
              }}
              placeholder="e.g., Read for 7 consecutive days"
              rows={3}
            />
            {achievementFormErrors.description && (
              <p className="text-sm text-red-600 mt-1">{achievementFormErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <SelectField
              label="Category"
              name="category"
              value={achievementForm.category}
              onChange={(e) => setAchievementForm({ ...achievementForm, category: e.target.value as any })}
              options={[
                { value: 'reading', label: 'Reading' },
                { value: 'consistency', label: 'Consistency' },
                { value: 'milestone', label: 'Milestone' },
                { value: 'social', label: 'Social' },
                { value: 'exploration', label: 'Exploration' },
              ]}
            />

            {/* Type */}
            <SelectField
              label="Type"
              name="type"
              value={achievementForm.type}
              onChange={(e) => setAchievementForm({ ...achievementForm, type: e.target.value as any })}
              options={[
                { value: 'one_time', label: 'One-time' },
                { value: 'repeatable', label: 'Repeatable' },
                { value: 'progressive', label: 'Progressive' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Target Value */}
            <InputField
              label="Target Value"
              name="targetValue"
              type="number"
              value={achievementForm.targetValue}
              onChange={(e) => setAchievementForm({ ...achievementForm, targetValue: parseInt(e.target.value) || 1 })}
              min="1"
              error={achievementFormErrors.targetValue}
              required
            />

            {/* Difficulty */}
            <SelectField
              label="Difficulty"
              name="difficulty"
              value={achievementForm.difficulty}
              onChange={(e) => setAchievementForm({ ...achievementForm, difficulty: e.target.value as any })}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
                { value: 'expert', label: 'Expert' },
              ]}
            />
          </div>

          {/* Reward Points */}
          <InputField
            label="Reward Points"
            name="rewardPoints"
            type="number"
            value={achievementForm.reward.points}
            onChange={(e) =>
              setAchievementForm({
                ...achievementForm,
                reward: { ...achievementForm.reward, points: parseInt(e.target.value) || 0 },
              })
            }
            min="0"
            error={achievementFormErrors.points}
            required
          />

          {/* Reward Badge */}
          <SelectField
            label="Reward Badge (Optional)"
            name="rewardBadge"
            value={achievementForm.reward.badge || ''}
            onChange={(e) =>
              setAchievementForm({
                ...achievementForm,
                reward: { ...achievementForm.reward, badge: e.target.value || undefined },
              })
            }
            options={[
              { value: '', label: 'No badge reward' },
              ...availableBadges.map((badge) => ({
                value: badge.id,
                label: `${badge.icon} ${badge.name}`,
              })),
            ]}
          />

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={achievementForm.isActive}
                onChange={(e) => setAchievementForm({ ...achievementForm, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-semibold text-gray-700">Active Achievement (tracking enabled)</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GamificationAdminPage;
