import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import ChildCard from '../../components/common/ChildCard';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';
import FamilyService from '../../services/familyService';
import ChildService from '../../services/childService';
import DashboardService from '../../services/dashboardService';
import ReadingService from '../../services/readingService';
import toast from 'react-hot-toast';
import {
  Book,
  Users,
  TrendingUp,
  Clock,
  Plus,
  AlertCircle,
  Home,
} from 'lucide-react';
import { Family, Child } from '../../types';

const avatarEmojiRegex = /^(\p{Extended_Pictographic}|\uFE0F|\u200D)+$/u;

const isValidAvatar = (value: string) => {
  if (!value.trim()) return true;

  const isUrl = /^https?:\/\//i.test(value);
  if (isUrl) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  return avatarEmojiRegex.test(value.trim());
};

const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [familyNameError, setFamilyNameError] = useState('');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [deletingChildId, setDeletingChildId] = useState('');
  const [summaryStats, setSummaryStats] = useState({
    totalAssignments: 0,
    inProgress: 0,
    completed: 0,
  });
  const [readingStats, setReadingStats] = useState({
    weeklyMinutes: 0,
    topStreak: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<Array<{
    id: string;
    childName: string;
    storyTitle: string;
    status: string;
  }>>([]);

  const [formData, setFormData] = useState({
    name: '',
    age: 5,
    avatar: '👧',
    readingLevel: 'beginner' as const,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateChildForm = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedAvatar = formData.avatar.trim();

    if (!trimmedName) {
      newErrors.name = 'Child name is required';
    } else if (trimmedName.length < 2 || trimmedName.length > 50) {
      newErrors.name = 'Child name must be between 2 and 50 characters';
    }

    if (!Number.isInteger(formData.age) || formData.age < 1 || formData.age > 17) {
      newErrors.age = 'Age must be a whole number between 1 and 17';
    }

    if (trimmedAvatar.length > 2048) {
      newErrors.avatar = 'Avatar must be 2048 characters or less';
    } else if (!isValidAvatar(trimmedAvatar)) {
      newErrors.avatar = 'Avatar must be an emoji or a valid http/https URL';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetDashboardData = () => {
    setChildren([]);
    setSummaryStats({ totalAssignments: 0, inProgress: 0, completed: 0 });
    setReadingStats({ weeklyMinutes: 0, topStreak: 0 });
    setRecentAssignments([]);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError('');

      let familyData: Family | null = null;

      try {
        familyData = await FamilyService.getMyFamily();
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setFamily(null);
          resetDashboardData();
          return;
        }
        throw error;
      }

      setFamily(familyData);

      const [childrenData, summaryData, familyDashboardData] = await Promise.all([
        ChildService.getChildren(),
        DashboardService.getFamilySummary().catch(() => null),
        DashboardService.getFamilyDashboard().catch(() => null),
      ]);

      setChildren(childrenData);

      if (summaryData) {
        setSummaryStats({
          totalAssignments: Number(summaryData.totalAssignments) || 0,
          inProgress: Number(summaryData.inProgress) || 0,
          completed: Number(summaryData.completed) || 0,
        });
      } else {
        setSummaryStats({ totalAssignments: 0, inProgress: 0, completed: 0 });
      }

      const rawRecent = familyDashboardData?.recentAssignments || [];
      setRecentAssignments(
        rawRecent.map((item) => ({
          id: item.id,
          childName: item.child?.name || 'Unknown child',
          storyTitle: item.story?.title || 'Untitled story',
          status: item.status || 'assigned',
        }))
      );

      if (childrenData.length > 0) {
        const readingData = await Promise.all(
          childrenData.map(async (child: Child) => {
            const [weekly, streak] = await Promise.all([
              ReadingService.getWeeklyReadingTime(child.id).catch(() => ({ totalTime: 0 })),
              ReadingService.getReadingStreak(child.id).catch(() => ({ streak: 0 })),
            ]);

            return {
              weeklyMinutes: Number(weekly?.totalTime) || 0,
              streak: Number(streak?.streak) || 0,
            };
          })
        );

        const totalWeekly = readingData.reduce((sum, item) => sum + item.weeklyMinutes, 0);
        const topStreak = readingData.reduce((max, item) => Math.max(max, item.streak), 0);
        setReadingStats({ weeklyMinutes: totalWeekly, topStreak });
      } else {
        setReadingStats({ weeklyMinutes: 0, topStreak: 0 });
      }
    } catch (error: any) {
      setLoadError(error?.response?.data?.message || 'Failed to load family data. Please try again.');
      resetDashboardData();
      setFamily(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFamily = async () => {
    const trimmedFamilyName = newFamilyName.trim();

    if (!trimmedFamilyName) {
      setFamilyNameError('Family name is required');
      return;
    }

    if (trimmedFamilyName.length < 2 || trimmedFamilyName.length > 100) {
      setFamilyNameError('Family name must be between 2 and 100 characters');
      return;
    }

    try {
      setIsCreatingFamily(true);
      const createdFamily = await FamilyService.createFamily({ familyName: trimmedFamilyName });
      setFamily(createdFamily);
      setFamilyNameError('');
      setNewFamilyName('');
      toast.success('Family created successfully');
      await loadData();
    } catch (error: any) {
      setFamilyNameError(error?.response?.data?.message || 'Failed to create family');
    } finally {
      setIsCreatingFamily(false);
    }
  };

  const handleAddChild = async () => {
    if (!family?.id) {
      toast.error('Create a family group before adding children');
      return;
    }

    if (!validateChildForm()) {
      toast.error('Please correct the highlighted fields');
      return;
    }

    try {
      setIsSavingChild(true);
      const payload = {
        name: formData.name.trim(),
        age: formData.age,
        avatar: formData.avatar.trim(),
        readingLevel: formData.readingLevel,
      };

      if (editingChild) {
        const updated = await ChildService.updateChild(editingChild.id, {
          ...payload,
        });
        setChildren(children.map(c => c.id === editingChild.id ? updated : c));
        toast.success('Child updated successfully');
      } else {
        const newChild = await ChildService.addChild({
          ...payload,
          family: family.id,
        });
        setChildren([...children, newChild]);
        toast.success('Child added successfully');
      }

      // Reset form and close modal
      setFormData({ name: '', age: 5, avatar: '👧', readingLevel: 'beginner' });
      setShowAddChildModal(false);
      setEditingChild(null);
      setFormErrors({});
      await loadData();
    } catch (error: any) {
      const backendErrors = error?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        const mapped: Record<string, string> = {};
        backendErrors.forEach((item: any) => {
          if (item?.field && item?.message) {
            mapped[item.field] = item.message;
          }
        });
        if (Object.keys(mapped).length > 0) {
          setFormErrors((prev) => ({ ...prev, ...mapped }));
        }
      }

      toast.error(error?.response?.data?.message || 'Failed to save child');
    } finally {
      setIsSavingChild(false);
    }
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setFormErrors({});
    setFormData({
      name: child.name,
      age: child.age,
      avatar: child.avatar || '👧',
      readingLevel: child.readingLevel || 'beginner',
    });
    setShowAddChildModal(true);
  };

  const handleDeleteChild = async (childId: string) => {
    if (!window.confirm('Are you sure you want to delete this child?')) return;

    try {
      setDeletingChildId(childId);
      await ChildService.deleteChild(childId);
      setChildren(children.filter(c => c.id !== childId));
      toast.success('Child deleted successfully');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete child');
    } finally {
      setDeletingChildId('');
    }
  };

  const handleCloseModal = () => {
    setShowAddChildModal(false);
    setEditingChild(null);
    setFormErrors({});
    setFormData({ name: '', age: 5, avatar: '👧', readingLevel: 'beginner' });
  };

  const avatarEmojis = ['👧', '👦', '🧒', '👨', '👩', '🤓', '😊', '🎒'];
  const readingLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const parseReadingLevel = (value: string): Child['readingLevel'] => {
    if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
      return value;
    }
    return 'beginner';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Dashboard" />
        <div className="container-responsive py-8 text-center">
          <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your family data...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Dashboard" />
        <div className="container-responsive py-10">
          <div className="card max-w-2xl mx-auto text-center py-12">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={36} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to load your dashboard</h2>
            <p className="text-gray-600 mb-6">{loadError}</p>
            <div className="flex justify-center gap-3">
              <button onClick={loadData} className="btn-primary">Try Again</button>
              <button onClick={() => navigate('/family-settings')} className="btn-secondary">Family Settings</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Dashboard" />
        <div className="container-responsive py-10">
          <div className="card max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-nestory-100 flex items-center justify-center">
                <Home className="text-nestory-700" size={22} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Family Group</h1>
                <p className="text-gray-600">To add children, assign stories, and track reading progress, start by creating your family profile.</p>
              </div>
            </div>

            <div className="space-y-4">
              <InputField
                label="Family Name"
                name="familyName"
                value={newFamilyName}
                onChange={(e) => {
                  setNewFamilyName(e.target.value);
                  if (familyNameError) setFamilyNameError('');
                }}
                placeholder="e.g., The Silva Family"
                error={familyNameError}
                required
              />

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCreateFamily}
                  className="btn-primary"
                  disabled={isCreatingFamily}
                >
                  {isCreatingFamily ? 'Creating Family...' : 'Create Family'}
                </button>
                <button
                  onClick={() => navigate('/family-settings')}
                  className="btn-secondary"
                >
                  Open Family Settings
                </button>
              </div>

              <p className="text-sm text-gray-500">
                Backend rules: only parents can manage families, and each parent can have only one family group.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Dashboard" />

      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Parent Dashboard</h1>
            <p className="text-gray-600">{family?.familyName || 'Your Family'} • {children.length} children</p>
          </div>
          <button
            onClick={() => navigate('/stories')}
            className="btn-primary flex items-center gap-2"
          >
            <Book size={20} />
            Browse Stories
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Books Read"
            value={summaryStats.completed}
            icon={Book}
            color="blue"
            subtext="Completed assignments"
          />
          <StatCard
            title="Active Children"
            value={children.length}
            icon={Users}
            color="green"
            subtext="Family members"
          />
          <StatCard
            title="Reading Streak"
            value={readingStats.topStreak}
            icon={TrendingUp}
            color="purple"
            subtext="Days"
          />
          <StatCard
            title="Total Hours"
            value={(readingStats.weeklyMinutes / 60).toFixed(1)}
            icon={Clock}
            color="orange"
            subtext="Family this week"
          />
        </div>

        {/* Children Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Family Members ({children.length})</h2>
              <button
                onClick={() => setShowAddChildModal(true)}
                className="btn-primary flex items-center gap-2"
                disabled={!family}
              >
                <Plus size={18} />
                Add Child
              </button>
            </div>

            {children.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-600 mb-4">No children added yet</p>
                <button
                  onClick={() => setShowAddChildModal(true)}
                  className="btn-primary mx-auto"
                >
                  Add Your First Child
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map((child) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    onEdit={handleEditChild}
                    onDelete={handleDeleteChild}
                    isDeleting={deletingChildId === child.id}
                    onClick={() => navigate(`/child/${child.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card h-fit">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowAddChildModal(true)}
                className="btn-outline w-full text-left flex items-center gap-2 py-3"
              >
                <Plus size={18} />
                Add Child
              </button>
              <button
                onClick={() => navigate('/stories')}
                className="btn-outline w-full text-left flex items-center gap-2 py-3"
              >
                <Book size={18} />
                View Story Library
              </button>
              <button
                onClick={() => navigate('/assignments')}
                className="btn-outline w-full text-left flex items-center gap-2 py-3"
              >
                <TrendingUp size={18} />
                Manage Assignments
              </button>
              <button
                onClick={() => navigate('/family-settings')}
                className="btn-outline w-full text-left flex items-center gap-2 py-3"
              >
                <Users size={18} />
                Family Settings
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          {recentAssignments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <p className="text-gray-600">No activity yet. Start by assigning a story to your child.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAssignments.map((activity) => (
                <div key={activity.id} className="rounded-lg border border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{activity.childName} • {activity.storyTitle}</p>
                    <p className="text-sm text-gray-600 capitalize">Status: {activity.status.replace('_', ' ')}</p>
                  </div>
                  <span className="badge bg-nestory-100 text-nestory-800 capitalize">{activity.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Child Modal */}
      <Modal
        isOpen={showAddChildModal}
        title={editingChild ? 'Edit Child' : 'Add New Child'}
        onClose={handleCloseModal}
        onConfirm={handleAddChild}
        confirmText={editingChild ? 'Update' : 'Add Child'}
        size="md"
        isLoading={isSavingChild}
      >
        <div className="space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Choose Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {avatarEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setFormData({ ...formData, avatar: emoji })}
                  type="button"
                  className={`text-3xl p-3 rounded-lg border-2 transition-all ${
                    formData.avatar === emoji
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
            label="Child's Name"
            name="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (formErrors.name) {
                setFormErrors((prev) => ({ ...prev, name: '' }));
              }
            }}
            placeholder="e.g., Emma"
            error={formErrors.name}
            required
          />

          {/* Age */}
          <InputField
            label="Age"
            name="age"
            type="number"
            value={formData.age}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setFormData({ ...formData, age: Number.isNaN(value) ? 0 : value });
              if (formErrors.age) {
                setFormErrors((prev) => ({ ...prev, age: '' }));
              }
            }}
            min="1"
            max="17"
            error={formErrors.age}
            required
          />

          <InputField
            label="Avatar (Emoji or URL)"
            name="avatar"
            value={formData.avatar}
            onChange={(e) => {
              setFormData({ ...formData, avatar: e.target.value });
              if (formErrors.avatar) {
                setFormErrors((prev) => ({ ...prev, avatar: '' }));
              }
            }}
            placeholder="e.g., 👧 or https://example.com/avatar.png"
            error={formErrors.avatar}
          />

          {/* Reading Level */}
          <SelectField
            label="Reading Level"
            name="readingLevel"
            value={formData.readingLevel}
            onChange={(e) => setFormData({ ...formData, readingLevel: parseReadingLevel(e.target.value) })}
            options={readingLevels}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ParentDashboard;

