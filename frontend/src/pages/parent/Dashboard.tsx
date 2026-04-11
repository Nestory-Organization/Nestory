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
import chatService from '../../services/chatService';
import toast from 'react-hot-toast';
import {
  Book,
  Users,
  TrendingUp,
  Clock,
  Plus,
  AlertCircle,
  Home,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Copy,
  BarChart3,
  MessageCircle,
} from 'lucide-react';
import { Family, Child, ChildAccountCredentials, ReadingActivitySummary } from '../../types';

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

const formatRelativeTime = (value?: string) => {
  if (!value) return 'Just now';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const deltaMs = Date.now() - timestamp;
  const deltaMinutes = Math.max(Math.floor(deltaMs / 60000), 0);

  if (deltaMinutes < 1) return 'Just now';
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;

  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
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
  const [resettingChildId, setResettingChildId] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newChildCredentials, setNewChildCredentials] = useState<ChildAccountCredentials | null>(null);
  const [summaryStats, setSummaryStats] = useState({
    totalAssignments: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    completionRate: 0,
  });
  const [readingStats, setReadingStats] = useState({
    weeklyMinutes: 0,
    topStreak: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<Array<{
    id: string;
    childId: string;
    childAvatar?: string;
    childName: string;
    storyTitle: string;
    status: string;
    dueDate?: string;
    createdAt?: string;
  }>>([]);
  const [recentCompletions, setRecentCompletions] = useState<Array<{
    id: string;
    childId: string;
    childAvatar?: string;
    childName: string;
    storyTitle: string;
    status: string;
    completedAt?: string;
  }>>([]);
  const [childPerformance, setChildPerformance] = useState<Array<{
    id: string;
    childId: string;
    name: string;
    avatar: string;
    assignments: {
      total: number;
      assigned: number;
      inProgress: number;
      completed: number;
      completionRate: number;
    };
  }>>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');
  const [weekActivity, setWeekActivity] = useState<ReadingActivitySummary | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    age: number;
    avatar: string;
    readingLevel: 'beginner' | 'intermediate' | 'advanced';
    email?: string;
  }>({
    name: '',
    age: 5,
    avatar: '👧',
    readingLevel: 'beginner',
    email: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateChildForm = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedAvatar = formData.avatar.trim();
    const trimmedEmail = formData.email?.trim() || '';

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

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Please provide a valid email address';
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetDashboardData = () => {
    setChildren([]);
    setSummaryStats({ totalAssignments: 0, assigned: 0, inProgress: 0, completed: 0, completionRate: 0 });
    setReadingStats({ weeklyMinutes: 0, topStreak: 0 });
    setRecentAssignments([]);
    setRecentCompletions([]);
    setChildPerformance([]);
    setLastUpdatedAt('');
    setWeekActivity(null);
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

      // Load unread messages
      try {
        const unreadCount = await chatService.getUnread();
        setUnreadMessages(unreadCount);
      } catch (error) {
        console.error('Failed to load unread messages:', error);
      }

      const [childrenData, summaryData, familyDashboardData] = await Promise.all([
        ChildService.getChildren(),
        DashboardService.getFamilySummary().catch(() => null),
        DashboardService.getFamilyDashboard().catch(() => null),
      ]);

      setChildren(childrenData);

      const statsFromDashboard = familyDashboardData?.overallStats;
      if (statsFromDashboard) {
        setSummaryStats({
          totalAssignments: Number(statsFromDashboard.total) || 0,
          assigned: Number(statsFromDashboard.assigned) || 0,
          inProgress: Number(statsFromDashboard.inProgress) || 0,
          completed: Number(statsFromDashboard.completed) || 0,
          completionRate: Number(statsFromDashboard.completionRate) || 0,
        });
      } else if (summaryData) {
        setSummaryStats({
          totalAssignments: Number(summaryData.totalAssignments) || 0,
          assigned: Number(summaryData.assigned) || 0,
          inProgress: Number(summaryData.inProgress) || 0,
          completed: Number(summaryData.completed) || 0,
          completionRate: Number(summaryData.completionRate) || 0,
        });
      } else {
        setSummaryStats({ totalAssignments: 0, assigned: 0, inProgress: 0, completed: 0, completionRate: 0 });
      }

      const rawRecent = familyDashboardData?.recentAssignments || [];
      setRecentAssignments(
        rawRecent.map((item) => ({
          id: item.id,
          childId: item.child?.id || item.childId,
          childAvatar: item.child?.avatar,
          childName: item.child?.name || 'Unknown child',
          storyTitle: item.story?.title || 'Untitled story',
          status: item.status || 'assigned',
          dueDate: item.dueDate,
          createdAt: item.createdAt,
        }))
      );

      const rawCompletions = familyDashboardData?.recentCompletions || [];
      setRecentCompletions(
        rawCompletions.map((item) => ({
          id: item.id,
          childId: item.child?.id || item.childId,
          childAvatar: item.child?.avatar,
          childName: item.child?.name || 'Unknown child',
          storyTitle: item.story?.title || 'Untitled story',
          status: item.status || 'completed',
          completedAt: item.completedAt,
        }))
      );

      const childCards = familyDashboardData?.children || [];
      setChildPerformance(
        childCards.map((child) => ({
          id: child.id,
          childId: child.childId || child.id,
          name: child.name,
          avatar: child.avatar || '🧒',
          assignments: {
            total: Number(child.assignments.total) || 0,
            assigned: Number(child.assignments.assigned) || 0,
            inProgress: Number(child.assignments.inProgress) || 0,
            completed: Number(child.assignments.completed) || 0,
            completionRate: Number(child.assignments.completionRate) || 0,
          },
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

      if (childrenData.length > 0) {
        try {
          const wa = await ReadingService.getFamilyActivitySummary(7);
          setWeekActivity(wa);
        } catch {
          setWeekActivity(null);
        }
      } else {
        setWeekActivity(null);
      }

      setLastUpdatedAt(new Date().toISOString());
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
      const payload: any = {
        name: formData.name.trim(),
        age: formData.age,
        avatar: formData.avatar.trim(),
        readingLevel: formData.readingLevel,
      };

      if (formData.email?.trim()) {
        payload.email = formData.email.trim();
      }

      if (editingChild) {
        const updated = await ChildService.updateChild(editingChild.id, {
          ...payload,
        });
        setChildren(children.map(c => c.id === editingChild.id ? updated : c));
        toast.success('Child updated successfully');
      } else {
        const addChildResponse = await ChildService.addChild({
          ...payload,
          family: family.id,
        });
        const newChild = addChildResponse.child;
        setChildren([...children, newChild]);
        setNewChildCredentials(addChildResponse.credentials);
        setShowCredentialsModal(true);
        toast.success('Child added successfully');
      }

      // Reset form and close modal
      setFormData({ name: '', age: 5, avatar: '👧', readingLevel: 'beginner', email: '' });
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
      email: child.email || '',
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
    setFormData({ name: '', age: 5, avatar: '👧', readingLevel: 'beginner', email: '' });
  };

  const handleResetChildPassword = async (childId: string) => {
    const selectedChild = children.find((item) => item.id === childId);
    const childName = selectedChild?.name || 'this child';

    if (!window.confirm(`Reset password for ${childName}?`)) return;

    try {
      setResettingChildId(childId);
      const response = await ChildService.resetChildPassword(childId);
      setNewChildCredentials(response.credentials);
      setShowCredentialsModal(true);
      toast.success(`Password reset for ${childName}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset child password');
    } finally {
      setResettingChildId('');
    }
  };

  const handleCloseCredentialsModal = () => {
    setShowCredentialsModal(false);
    setNewChildCredentials(null);
  };

  const copyToClipboard = async (value: string, label: string) => {
    if (!value) {
      toast.error(`No ${label.toLowerCase()} available to copy`);
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const avatarEmojis = ['👧', '👦', '🧒', '👨', '👩', '🤓', '😊', '🎒'];
  const readingLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const parseReadingLevel = (value: string): 'beginner' | 'intermediate' | 'advanced' => {
    if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
      return value;
    }
    return 'beginner';
  };

  // Set up polling for unread messages
  useEffect(() => {
    if (!family) return;

    const interval = setInterval(async () => {
      try {
        const unreadCount = await chatService.getUnread();
        setUnreadMessages(unreadCount);
      } catch (error) {
        console.error('Failed to check unread messages:', error);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [family]);

  const outstandingAssignments = summaryStats.assigned + summaryStats.inProgress;
  const completionProgress =
    summaryStats.totalAssignments > 0
      ? Math.min(Math.round((summaryStats.completed / summaryStats.totalAssignments) * 100), 100)
      : 0;

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar title="Dashboard" />

      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Parent Dashboard</h1>
            <p className="text-gray-600 text-lg">{family?.familyName || 'Your Family'}  <span className="text-gray-400">•</span>  {children.length} {children.length === 1 ? 'child' : 'children'}</p>
            {lastUpdatedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated {new Date(lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 animate-slide-down">
            <button
              onClick={() => loadData()}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh Metrics
            </button>
            <button
              onClick={() => navigate('/stories')}
              className="btn-primary flex items-center gap-2"
            >
              <Book size={20} />
              Browse Stories
            </button>
            <button
              onClick={() => navigate('/gamification')}
              className="btn-secondary flex items-center gap-2"
            >
              <Sparkles size={18} />
              View Gamification
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 relative"
            >
              <MessageCircle size={18} />
              Family Chat
              {unreadMessages > 0 && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
          <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <StatCard
              title="Assigned"
              value={summaryStats.assigned}
              icon={Book}
              color="blue"
              subtext="Pending to start"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <StatCard
              title="In Progress"
              value={summaryStats.inProgress}
              icon={TrendingUp}
              color="orange"
              subtext="Currently being read"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Completed"
              value={summaryStats.completed}
              icon={CheckCircle2}
              color="green"
              subtext={`${summaryStats.totalAssignments} total assignments`}
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <StatCard
              title="Completion Rate"
              value={`${summaryStats.completionRate}%`}
              icon={Users}
              color="purple"
              subtext="Across all children"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="Family Reading"
              value={(readingStats.weeklyMinutes / 60).toFixed(1)}
              icon={Clock}
              color="pink"
              subtext={`${readingStats.topStreak} day top streak`}
            />
          </div>
        </div>

        {weekActivity && children.length > 0 && (
          <div className="card mb-8 border-nestory-200 bg-gradient-to-br from-white to-nestory-50/40">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="text-nestory-600" size={20} />
                  Week in review
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Pages and minutes from children tapping Save progress (last {weekActivity.days} days).
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(weekActivity.periodStart).toLocaleDateString()} –{' '}
                  {new Date(weekActivity.periodEnd).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary text-sm shrink-0 self-start"
                onClick={() => navigate('/progress')}
              >
                Full progress report
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/80 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500">Pages logged</p>
                <p className="text-2xl font-bold text-gray-900">{weekActivity.totalPagesLogged}</p>
              </div>
              <div className="rounded-lg bg-white/80 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500">Minutes logged</p>
                <p className="text-2xl font-bold text-gray-900">{weekActivity.totalMinutesLogged}</p>
              </div>
              <div className="rounded-lg bg-white/80 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500">Progress saves</p>
                <p className="text-2xl font-bold text-gray-900">{weekActivity.progressSaveCount}</p>
              </div>
              <div className="rounded-lg bg-white/80 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500">Children with activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {weekActivity.byChild?.filter((c) => c.progressSaveCount > 0).length ?? 0}
                </p>
              </div>
            </div>
            {weekActivity.byChild && weekActivity.byChild.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-800 mb-2">By child</p>
                <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                  {weekActivity.byChild.map((c) => (
                    <li key={c.childId} className="flex flex-col sm:flex-row sm:justify-between gap-1 rounded-lg bg-gray-50 px-3 py-2">
                      <span className="font-medium">{c.childName}</span>
                      <span className="text-gray-600">
                        {c.pages} pg · {c.minutes} min · {c.progressSaveCount} saves
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-nestory-700 flex items-center gap-2">
                <Sparkles size={16} /> At a Glance
              </p>
              <h2 className="text-xl font-bold text-gray-900 mt-1">Family Assignment Momentum</h2>
              <p className="text-sm text-gray-600 mt-1">
                {summaryStats.completed} completed, {outstandingAssignments} still active across your family.
              </p>
            </div>
            <div className="min-w-[220px]">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Completion Progress</span>
                <span className="font-semibold text-gray-900">{completionProgress}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: `${completionProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Child Performance Cards */}
        <div className="card mb-10 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Child Performance</h2>
              <p className="text-sm text-gray-600 mt-1">Track progress and completion rates</p>
            </div>
            <button onClick={() => navigate('/assignments')} className="btn-secondary">View All</button>
          </div>

          {childPerformance.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Add a child and assign a story to see live performance analytics.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {childPerformance.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/child/${item.childId}`)}
                  className="text-left rounded-xl border border-gray-200 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-nestory-50 p-5 hover:border-nestory-400 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-scale-in"
                  style={{ animationDelay: `${idx * 75}ms` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-2xl shadow-sm">
                      {item.avatar || '🧒'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.assignments.total} total assignments</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="rounded-lg bg-blue-50 py-3 border border-blue-100 hover:border-blue-300 transition-colors">
                      <p className="text-xs font-medium text-blue-700">Assigned</p>
                      <p className="font-bold text-lg text-blue-900">{item.assignments.assigned}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 py-3 border border-amber-100 hover:border-amber-300 transition-colors">
                      <p className="text-xs font-medium text-amber-700">In Progress</p>
                      <p className="font-bold text-lg text-amber-900">{item.assignments.inProgress}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 py-3 border border-green-100 hover:border-green-300 transition-colors">
                      <p className="text-xs font-medium text-green-700">Completed</p>
                      <p className="font-bold text-lg text-green-900">{item.assignments.completed}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-700">Completion Rate</p>
                    <span className="font-bold text-gray-900">{item.assignments.completionRate}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-3 bg-gradient-to-r from-nestory-400 to-nestory-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.assignments.completionRate, 100)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Children Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 animate-slide-up">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Family Members</h2>
                <p className="text-sm text-gray-600 mt-1">{children.length} {children.length === 1 ? 'child' : 'children'} in your family</p>
              </div>
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
                    onResetPassword={handleResetChildPassword}
                    onDelete={handleDeleteChild}
                    isDeleting={deletingChildId === child.id}
                    isResettingPassword={resettingChildId === child.id}
                    onClick={() => navigate(`/child/${child.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card h-fit animate-slide-down">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
              <Sparkles size={20} className="text-nestory-600" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowAddChildModal(true)}
                className="btn-outline w-full text-left flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Plus size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add Child</p>
                  <p className="text-xs text-gray-500">Create new member</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/stories')}
                className="btn-outline w-full text-left flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-green-50 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Book size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Browse Stories</p>
                  <p className="text-xs text-gray-500">Find & assign books</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/assignments')}
                className="btn-outline w-full text-left flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-purple-50 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Assignments</p>
                  <p className="text-xs text-gray-500">Track & manage</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/progress')}
                className="btn-outline w-full text-left flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-orange-50 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <BarChart3 size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Reading Progress</p>
                  <p className="text-xs text-gray-500">View analytics</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/family-settings')}
                className="btn-outline w-full text-left flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users size={18} className="text-gray-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Family Settings</p>
                  <p className="text-xs text-gray-500">Manage profile</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-slide-up">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Assignments</h3>
                <p className="text-sm text-gray-600 mt-1">Latest activity</p>
              </div>
              {recentAssignments.length > 0 && (
                <button
                  onClick={() => navigate('/assignments')}
                  className="text-sm text-nestory-600 hover:text-nestory-700 font-medium"
                >
                  View All →
                </button>
              )}
            </div>
            {recentAssignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <Book size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600">No recent assignments yet.</p>
                <p className="text-sm text-gray-500 mt-1">Assign stories to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAssignments.slice(0, 5).map((activity, idx) => (
                  <button
                    key={activity.id}
                    className="w-full text-left rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:border-nestory-400 hover:bg-nestory-50 hover:shadow-md transition-all duration-200 transform hover:translate-x-1 animate-slide-up"
                    onClick={() => navigate(`/child/${activity.childId}`)}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">
                        {activity.childAvatar || '🧒'}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="font-semibold text-gray-900 truncate">{activity.childName}</p>
                        <p className="text-sm text-gray-600 truncate">{activity.storyTitle}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="badge bg-blue-100 text-blue-800 capitalize text-xs">
                        {activity.status.replace('_', ' ')}
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Completions</h3>
                <p className="text-sm text-gray-600 mt-1">Achievements unlocked</p>
              </div>
              {recentCompletions.length > 0 && (
                <button
                  onClick={() => navigate('/progress')}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View All →
                </button>
              )}
            </div>
            {recentCompletions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <CheckCircle2 size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600">No completed assignments yet.</p>
                <p className="text-sm text-gray-500 mt-1">Celebrate milestones here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCompletions.slice(0, 5).map((activity, idx) => (
                  <button
                    key={activity.id}
                    className="w-full text-left rounded-lg border border-gray-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-4 flex items-center justify-between hover:border-green-400 hover:shadow-md transition-all duration-200 transform hover:translate-x-1 animate-slide-up"
                    onClick={() => navigate(`/child/${activity.childId}`)}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg flex-shrink-0">
                        {activity.childAvatar || '🧒'}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="font-semibold text-gray-900 truncate">{activity.childName}</p>
                        <p className="text-sm text-gray-600 truncate">{activity.storyTitle}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {activity.completedAt
                            ? `Completed ${formatRelativeTime(activity.completedAt)}`
                            : 'Recently completed'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="badge bg-green-100 text-green-800 text-xs">✓ Done</span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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

          {/* Email (Optional) */}
          <InputField
            label="Email (Optional)"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (formErrors.email) {
                setFormErrors((prev) => ({ ...prev, email: '' }));
              }
            }}
            placeholder="e.g., emma.doe@example.com (leave empty to auto-generate)"
            error={formErrors.email}
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

      <Modal
        isOpen={showCredentialsModal}
        title="Child Login Credentials"
        onClose={handleCloseCredentialsModal}
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Share these credentials with your child. They will be prompted to change this temporary password after first login.
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Login Email</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900 break-all">{newChildCredentials?.email}</p>
              <button
                type="button"
                className="btn-secondary whitespace-nowrap inline-flex items-center gap-2"
                onClick={() => copyToClipboard(newChildCredentials?.email || '', 'Email')}
              >
                <Copy size={16} />
                Copy
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Temporary Password</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900">{newChildCredentials?.temporaryPassword}</p>
              <button
                type="button"
                className="btn-secondary whitespace-nowrap inline-flex items-center gap-2"
                onClick={() => copyToClipboard(newChildCredentials?.temporaryPassword || '', 'Password')}
              >
                <Copy size={16} />
                Copy
              </button>
            </div>
          </div>
          <div className="pt-2">
            <button className="btn-primary" onClick={handleCloseCredentialsModal}>Done</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ParentDashboard;

