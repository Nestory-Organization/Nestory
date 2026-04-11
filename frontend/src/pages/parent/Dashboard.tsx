import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FamilyService from '../../services/familyService';
import ChildService from '../../services/childService';
import DashboardService from '../../services/dashboardService';
import ReadingService from '../../services/readingService';
import chatService from '../../services/chatService';
import toast from 'react-hot-toast';
import {
  Book,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock,
  Flame,
  Plus,
  AlertCircle,
  Home,
  Pencil,
  Trash2,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  X,
  MessageCircle,
} from 'lucide-react';
import {
  Container,
  Section,
  Grid,
  Card,
  StatCard,
  ActivityItem,
  NavItem,
} from '../../components/common/StitchComponents';
import Navbar from '../../components/common/Navbar';
import { Family, Child, ChildAccountCredentials } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RecentAssignmentRow {
  id: string;
  childId?: string;
  childAvatar?: string;
  childName: string;
  storyTitle: string;
  status: string;
  dueDate?: string;
  createdAt?: string;
}

interface RecentCompletionRow {
  id: string;
  childId?: string;
  childAvatar?: string;
  childName: string;
  storyTitle: string;
  status: string;
  completedAt?: string;
}

interface ChildPerformanceRow {
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
}

// ─── Sidebar Nav ─────────────────────────────────────────────────────────────
const Sidebar: React.FC<{
  activeTab: string;
  onNavigate: (route: string) => void;
  unreadMessages: number;
}> = ({ activeTab, onNavigate, unreadMessages }) => {
  const navItems = [
    { icon: 'home', label: 'Home', route: '/' },
    { icon: 'library_books', label: 'Library', route: '/stories' },
    { icon: 'science', label: 'Lab (Assignments)', route: '/assignments' },
    { icon: 'group', label: 'Family', route: '/family-settings' },
    { icon: 'archive', label: 'Progress', route: '/progress' },
    { icon: 'military_tech', label: 'Rewards', route: '/gamification' },
    { icon: 'chat', label: 'Chat', route: '/chat', badge: unreadMessages },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-surface-container-low p-4 gap-1 flex-shrink-0">
      <div className="px-4 py-6 mb-2">
        <span className="text-xl font-bold serif-text text-primary tracking-tight">The Sanctuary</span>
      </div>
      {navItems.map((item) => (
        <NavItem
          key={item.route}
          icon={item.icon}
          label={item.label}
          active={activeTab === item.route}
          onClick={() => onNavigate(item.route)}
          badge={item.badge}
        />
      ))}
    </aside>
  );
};

// ─── Quick Action Card ────────────────────────────────────────────────────────
const QuickActionCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}> = ({ icon, label, color, onClick }) => (
  <Card interactive onClick={onClick} className="flex flex-col items-center justify-center gap-3 py-8 text-center cursor-pointer">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center"
      style={{ backgroundColor: color + '30', color: color }}
    >
      {icon}
    </div>
    <span className="font-semibold text-sm text-on-surface">{label}</span>
  </Card>
);

// ─── Child Card (in dashboard) ────────────────────────────────────────────────
const ChildCard: React.FC<{
  child: Child;
  performance?: ChildPerformanceRow;
  isDeleting: boolean;
  isResetting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
  onViewProgress: () => void;
}> = ({ child, performance, isDeleting, isResetting, onEdit, onDelete, onResetPassword, onViewProgress }) => {
  const rate = performance?.assignments.completionRate ?? 0;
  const completed = performance?.assignments.completed ?? 0;
  const total = performance?.assignments.total ?? 0;

  return (
    <Card className="flex flex-col gap-3">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
          {child.avatar?.startsWith('http') ? (
            <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
          ) : (
            <span>{child.avatar || '🧒'}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-on-surface truncate">{child.name}</p>
          <p className="text-xs text-on-surface-variant capitalize">
            Age {child.age} · {child.readingLevel || 'Beginner'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-on-surface-variant mb-1">
          <span>Assignment progress</span>
          <span>{completed}/{total} done</span>
        </div>
        <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, rate)}%` }}
          />
        </div>
      </div>

      {/* Action row */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={onViewProgress}
          className="flex-1 btn-primary text-xs py-2"
        >
          Progress
        </button>
        <button
          type="button"
          onClick={onEdit}
          title="Edit child"
          className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onResetPassword}
          disabled={isResetting}
          title="Reset password"
          className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant disabled:opacity-50"
        >
          <RefreshCw size={14} className={isResetting ? 'animate-spin' : ''} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          title="Delete child"
          className="p-2 rounded-lg bg-error/10 hover:bg-error/20 transition-colors text-error disabled:opacity-50"
        >
          <Trash2 size={14} className={isDeleting ? 'animate-pulse' : ''} />
        </button>
      </div>
    </Card>
  );
};

// ─── Input Field helper ───────────────────────────────────────────────────────
const InputField: React.FC<{
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  min?: number;
  max?: number;
}> = ({ label, name, value, onChange, placeholder, type = 'text', error, min, max }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-semibold text-on-surface mb-1">{label}</label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      className={`w-full px-4 py-3 rounded-xl bg-surface-container border-0 text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/40 outline-none transition ${error ? 'ring-2 ring-error' : ''}`}
    />
    {error && <p className="text-xs text-error mt-1">{error}</p>}
  </div>
);

// ─── Add/Edit Child Modal ─────────────────────────────────────────────────────
const AddChildModal: React.FC<{
  editingChild: Child | null;
  formData: { name: string; age: number; avatar: string; readingLevel: string };
  formErrors: Record<string, string>;
  isSaving: boolean;
  onChange: (field: string, value: string | number) => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ editingChild, formData, formErrors, isSaving, onChange, onSave, onClose }) => {
  const avatarEmojis = ['👧', '👦', '🧒', '👨', '👩', '🤓', '😊', '🎒'];
  const readingLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="serif-text text-xl font-bold text-on-surface">
            {editingChild ? 'Edit Reader' : 'Add a Reader'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="space-y-4">
          <InputField
            label="Child's Name"
            name="name"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g., Sophie"
            error={formErrors.name}
          />

          <InputField
            label="Age"
            name="age"
            type="number"
            value={formData.age}
            onChange={(e) => onChange('age', parseInt(e.target.value, 10))}
            min={1}
            max={18}
            error={formErrors.age}
          />

          {/* Avatar picker */}
          <div>
            <p className="text-sm font-semibold text-on-surface mb-2">Avatar</p>
            <div className="flex flex-wrap gap-2">
              {avatarEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onChange('avatar', emoji)}
                  className={`w-10 h-10 rounded-xl text-xl transition-all ${
                    formData.avatar === emoji
                      ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                      : 'bg-surface-container hover:bg-surface-container-high'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.avatar}
              onChange={(e) => onChange('avatar', e.target.value)}
              placeholder="Or enter emoji / image URL"
              className="mt-2 w-full px-3 py-2 rounded-xl bg-surface-container text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
            />
            {formErrors.avatar && <p className="text-xs text-error mt-1">{formErrors.avatar}</p>}
          </div>

          {/* Reading level */}
          <div>
            <p className="text-sm font-semibold text-on-surface mb-2">Reading Level</p>
            <div className="flex gap-2">
              {readingLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => onChange('readingLevel', level.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    formData.readingLevel === level.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-outline-variant text-on-surface font-semibold hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {isSaving ? 'Saving…' : editingChild ? 'Update' : 'Add Reader'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Credentials Modal ────────────────────────────────────────────────────────
const CredentialsModal: React.FC<{
  credentials: AddChildCredentials;
  onClose: () => void;
  onCopy: (value: string, label: string) => void;
}> = ({ credentials, onClose, onCopy }) => {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="serif-text text-xl font-bold text-on-surface">Reader Credentials</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <p className="text-sm text-on-surface-variant mb-5">
          Share these with your child. They must change their password on first login.
        </p>

        <div className="space-y-3">
          {/* Email */}
          <div className="flex items-center justify-between bg-surface-container rounded-2xl px-4 py-3">
            <div>
              <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-widest mb-0.5">Login Email</p>
              <p className="text-sm font-mono text-on-surface break-all">{credentials.email || '—'}</p>
            </div>
            <button
              type="button"
              onClick={() => onCopy(credentials.email, 'Email')}
              className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
            >
              <Copy size={16} />
            </button>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between bg-surface-container rounded-2xl px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-widest mb-0.5">Temporary Password</p>
              <p className="text-sm font-mono text-on-surface break-all">
                {showPw ? credentials.temporaryPassword : '••••••••'}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                onClick={() => onCopy(credentials.temporaryPassword, 'Password')}
                className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-primary-container/20 rounded-2xl">
          <p className="text-xs text-on-surface-variant">
            ⚠️ This password is temporary. Your child will be asked to set a new one on their first login.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-2xl bg-primary text-on-primary font-semibold hover:bg-primary/90 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Family & children state ──
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // ── Stats ──
  const [summaryStats, setSummaryStats] = useState({
    totalAssignments: 0, assigned: 0, inProgress: 0, completed: 0, completionRate: 0,
  });
  const [readingStats, setReadingStats] = useState({ weeklyMinutes: 0, topStreak: 0 });
  const [recentAssignments, setRecentAssignments] = useState<RecentAssignmentRow[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<RecentCompletionRow[]>([]);
  const [childPerformance, setChildPerformance] = useState<ChildPerformanceRow[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);

  // ── Create family ──
  const [newFamilyName, setNewFamilyName] = useState('');
  const [familyNameError, setFamilyNameError] = useState('');
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);

  // ── Child modal ──
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState({ name: '', age: 5, avatar: '👧', readingLevel: 'beginner' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [deletingChildId, setDeletingChildId] = useState('');
  const [resettingChildId, setResettingChildId] = useState('');

  // ── Credentials modal ──
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newChildCredentials, setNewChildCredentials] = useState<AddChildCredentials | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const isValidAvatar = (v: string) =>
    /^https?:\/\/.+/.test(v) || [...v].length <= 2;

  const validateChildForm = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedAvatar = formData.avatar.trim();

    if (!trimmedName) {
      newErrors.name = 'Name is required';
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      newErrors.name = 'Name must be between 2 and 100 characters';
    }
    if (!formData.age || formData.age < 1 || formData.age > 18) {
      newErrors.age = 'Age must be between 1 and 18';
    }
    if (trimmedAvatar && !isValidAvatar(trimmedAvatar)) {
      newErrors.avatar = 'Avatar must be an emoji or a valid http/https URL';
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
  };

  // ── Load data ─────────────────────────────────────────────────────────────────
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

      try {
        const unreadCount = await chatService.getUnread();
        setUnreadMessages(unreadCount);
      } catch { /* silent */ }

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

      setLastUpdatedAt(new Date().toISOString());
    } catch (error: any) {
      setLoadError(error?.response?.data?.message || 'Failed to load family data. Please try again.');
      resetDashboardData();
      setFamily(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Poll for unread messages
  useEffect(() => {
    if (!family) return;
    const interval = setInterval(async () => {
      try {
        const count = await chatService.getUnread();
        setUnreadMessages(count);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [family]);

  // ── Family creation ───────────────────────────────────────────────────────────
  const handleCreateFamily = async () => {
    const trimmed = newFamilyName.trim();
    if (!trimmed) { setFamilyNameError('Family name is required'); return; }
    if (trimmed.length < 2 || trimmed.length > 100) {
      setFamilyNameError('Family name must be between 2 and 100 characters'); return;
    }
    try {
      setIsCreatingFamily(true);
      const created = await FamilyService.createFamily({ familyName: trimmed });
      setFamily(created);
      setFamilyNameError('');
      setNewFamilyName('');
      toast.success('Family created successfully!');
      await loadData();
    } catch (error: any) {
      setFamilyNameError(error?.response?.data?.message || 'Failed to create family');
    } finally {
      setIsCreatingFamily(false);
    }
  };

  // ── Child add/edit ────────────────────────────────────────────────────────────
  const handleAddChild = async () => {
    if (!family?.id) { toast.error('Create a family group before adding children'); return; }
    if (!validateChildForm()) { toast.error('Please correct the highlighted fields'); return; }

    try {
      setIsSavingChild(true);
      const payload = {
        name: formData.name.trim(),
        age: formData.age,
        avatar: formData.avatar.trim(),
        readingLevel: formData.readingLevel,
      };

      if (editingChild) {
        const updated = await ChildService.updateChild(editingChild.id, payload);
        setChildren(children.map(c => c.id === editingChild.id ? updated : c));
        toast.success('Reader updated successfully');
      } else {
        const resp = await ChildService.addChild({ ...payload, family: family.id });
        setChildren([...children, resp.child]);
        setNewChildCredentials(resp.credentials);
        setShowCredentialsModal(true);
        toast.success('Reader added successfully!');
      }

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
          if (item?.field && item?.message) mapped[item.field] = item.message;
        });
        if (Object.keys(mapped).length > 0) setFormErrors(prev => ({ ...prev, ...mapped }));
      }
      toast.error(error?.response?.data?.message || 'Failed to save reader');
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
      toast.success('Reader deleted successfully');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete reader');
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

  const handleResetChildPassword = async (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (!window.confirm(`Reset password for ${child?.name || 'this child'}?`)) return;
    try {
      setResettingChildId(childId);
      const resp = await ChildService.resetChildPassword(childId);
      setNewChildCredentials(resp.credentials);
      setShowCredentialsModal(true);
      toast.success(`Password reset for ${child?.name || 'reader'}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingChildId('');
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    if (!value) { toast.error(`No ${label.toLowerCase()} available to copy`); return; }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  // ── Quick actions ─────────────────────────────────────────────────────────────
  const quickActions = [
    { id: 'stories', label: 'Browse Library', icon: <Book size={28} />, color: '#8e4e14', route: '/stories' },
    { id: 'assignments', label: 'Assign Reading', icon: <CheckCircle2 size={28} />, color: '#006878', route: '/assignments' },
    { id: 'progress', label: 'View Progress', icon: <TrendingUp size={28} />, color: '#7a573d', route: '/progress' },
    { id: 'gamification', label: 'Rewards', icon: <Award size={28} />, color: '#f4a261', route: '/gamification' },
  ];

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full border-4 border-surface-container-high border-t-primary animate-spin mx-auto" />
          <p className="text-on-surface-variant font-medium">Loading your library...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar familyName={family?.familyName} unreadMessages={unreadMessages} />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center py-12">
            <AlertCircle className="mx-auto mb-4 text-error" size={36} />
            <h2 className="serif-text text-2xl font-bold text-on-surface mb-2">Unable to load dashboard</h2>
            <p className="text-on-surface-variant mb-6">{loadError}</p>
            <div className="flex justify-center gap-3">
              <button onClick={loadData} className="btn-primary">Try Again</button>
              <button onClick={() => navigate('/family-settings')} className="btn-outline">Family Settings</button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── No family yet ─────────────────────────────────────────────────────────────
  if (!family) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar unreadMessages={unreadMessages} />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-lg w-full animate-slide-up">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Home className="text-primary" size={22} />
              </div>
              <div>
                <h1 className="serif-text text-2xl font-bold text-on-surface mb-1">Create Your Family Group</h1>
                <p className="text-on-surface-variant text-sm">
                  To add children, assign stories, and track reading progress, start by creating your family profile.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="familyName" className="block text-sm font-semibold text-on-surface mb-1">
                  Family Name
                </label>
                <input
                  id="familyName"
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => { setNewFamilyName(e.target.value); if (familyNameError) setFamilyNameError(''); }}
                  placeholder="e.g., The Silva Family"
                  className={`w-full px-4 py-3 rounded-xl bg-surface-container border-0 text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/40 outline-none transition ${familyNameError ? 'ring-2 ring-error' : ''}`}
                />
                {familyNameError && <p className="text-xs text-error mt-1">{familyNameError}</p>}
              </div>

              <button
                type="button"
                onClick={handleCreateFamily}
                disabled={isCreatingFamily || !newFamilyName.trim()}
                className="w-full py-3 rounded-2xl bg-primary text-on-primary font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {isCreatingFamily ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  <><Plus size={18} /> Create Family</>
                )}
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main dashboard ────────────────────────────────────────────────────────────
  const outstandingAssignments = summaryStats.assigned + summaryStats.inProgress;
  const completionProgress =
    summaryStats.totalAssignments > 0
      ? Math.min(Math.round((summaryStats.completed / summaryStats.totalAssignments) * 100), 100)
      : 0;

  const activityFeed = [
    ...recentCompletions.map(c => ({
      icon: 'emoji_events',
      title: `${c.childName} completed "${c.storyTitle}"`,
      subtitle: 'Reading completed',
      time: c.completedAt ? new Date(c.completedAt).toLocaleDateString() : '',
    })),
    ...recentAssignments.map(a => ({
      icon: 'assignment',
      title: `${a.childName} assigned "${a.storyTitle}"`,
      subtitle: `Status: ${a.status}`,
      time: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '',
    })),
  ].slice(0, 5);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar familyName={family?.familyName} unreadMessages={unreadMessages} />

      <div className="flex flex-1">
        <Sidebar activeTab="/" onNavigate={navigate} unreadMessages={unreadMessages} />

        <main className="flex-1 min-w-0 overflow-y-auto">
          <Container className="py-8">

            {/* Welcome Banner */}
            <div className="mb-8 animate-slide-up">
              <h1 className="text-4xl serif-text font-bold text-primary leading-tight">
                Curate your child's<br />intellectual voyage.
              </h1>
              <p className="mt-3 text-on-surface-variant text-lg max-w-2xl">
                Welcome back, <strong>{user?.name || 'Parent'}</strong>. Your family sanctuary,{' '}
                <em>{family.familyName}</em>, is ready.
              </p>
              {lastUpdatedAt && (
                <p className="text-xs text-outline mt-1">
                  Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Stats Strip */}
            <Grid columns={4} gap="lg" className="mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <StatCard
                label="Reading Streak"
                value={`${readingStats.topStreak} Days`}
                icon={<Flame size={28} className="text-error" />}
                trend={readingStats.topStreak > 0 ? 'up' : undefined}
                trendValue="Best this month!"
              />
              <StatCard
                label="Outstanding"
                value={outstandingAssignments}
                icon={<CheckCircle2 size={28} className="text-tertiary" />}
              />
              <StatCard
                label="Completion Rate"
                value={`${completionProgress}%`}
                icon={<TrendingUp size={28} className="text-secondary" />}
                trend={completionProgress >= 70 ? 'up' : 'down'}
              />
              <StatCard
                label="Weekly Reading"
                value={`${Math.round(readingStats.weeklyMinutes / 7) || 0} Min/day`}
                icon={<Clock size={28} className="text-primary" />}
              />
            </Grid>

            {/* Quick Actions */}
            <Section title="Quick Actions" className="mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <Grid columns={4} gap="md">
                {quickActions.map((action) => (
                  <QuickActionCard
                    key={action.id}
                    icon={action.icon}
                    label={action.label}
                    color={action.color}
                    onClick={() => navigate(action.route)}
                  />
                ))}
              </Grid>
            </Section>

            {/* Two-Column Region */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

              {/* Children Readers (2/3 width) */}
              <div className="lg:col-span-2">
                <Section
                  title="Your Readers"
                  subtitle={`${children.length} reader${children.length !== 1 ? 's' : ''} in your family library`}
                  action={
                    <button
                      onClick={() => {
                        setEditingChild(null);
                        setFormData({ name: '', age: 5, avatar: '👧', readingLevel: 'beginner' });
                        setFormErrors({});
                        setShowAddChildModal(true);
                      }}
                      className="btn-outline text-sm py-2 px-4 flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Reader
                    </button>
                  }
                >
                  {children.length === 0 ? (
                    <Card
                      interactive
                      onClick={() => setShowAddChildModal(true)}
                      className="flex flex-col items-center justify-center py-16 text-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">child_care</span>
                      <h3 className="serif-text font-bold text-xl text-on-surface mb-2">Add Your First Reader</h3>
                      <p className="text-on-surface-variant text-sm max-w-xs">
                        Invite a child to join your family sanctuary and begin their reading journey.
                      </p>
                    </Card>
                  ) : (
                    <Grid columns={children.length > 2 ? 3 : 2} gap="md">
                      {children.map((child) => {
                        const perf = childPerformance.find(p => p.childId === child.id || p.id === child.id);
                        return (
                          <ChildCard
                            key={child.id}
                            child={child}
                            performance={perf}
                            isDeleting={deletingChildId === child.id}
                            isResetting={resettingChildId === child.id}
                            onEdit={() => handleEditChild(child)}
                            onDelete={() => handleDeleteChild(child.id)}
                            onResetPassword={() => handleResetChildPassword(child.id)}
                            onViewProgress={() => navigate(`/child/${child.id}`)}
                          />
                        );
                      })}
                    </Grid>
                  )}
                </Section>

                {/* Chat shortcut */}
                <Card
                  interactive
                  onClick={() => navigate('/chat')}
                  className="mt-6 flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-secondary/10 flex items-center justify-center">
                      <MessageCircle size={22} className="text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">Family Chat</p>
                      <p className="text-xs text-on-surface-variant">
                        {unreadMessages > 0 ? `${unreadMessages} unread message${unreadMessages !== 1 ? 's' : ''}` : 'No new messages'}
                      </p>
                    </div>
                  </div>
                  {unreadMessages > 0 && (
                    <span className="px-3 py-1 rounded-full bg-error text-white text-xs font-bold">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Card>
              </div>

              {/* Right Column: Activity + Insight */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold serif-text text-on-surface">Recent Activity</h3>
                    <button onClick={() => navigate('/progress')} className="text-xs font-bold text-primary hover:underline">
                      See all
                    </button>
                  </div>
                  <div className="divide-y divide-outline-variant/20">
                    {activityFeed.length === 0 ? (
                      <p className="text-sm text-on-surface-variant py-4 text-center">No activity yet</p>
                    ) : (
                      activityFeed.map((item, i) => (
                        <ActivityItem key={i} icon={item.icon} title={item.title} subtitle={item.subtitle} time={item.time} />
                      ))
                    )}
                  </div>
                </Card>

                {/* Weekly Insight */}
                <Card className="bg-primary-container/20">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                      lightbulb
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface mb-1">Weekly Insight</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {children.length === 0
                          ? 'Add your first reader to start tracking reading progress.'
                          : summaryStats.completionRate >= 70
                          ? `Great job! Your family's completion rate is ${completionProgress}% this week.`
                          : `Your family has ${outstandingAssignments} outstanding assignment${outstandingAssignments !== 1 ? 's' : ''}. Keep going!`}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Featured for the family */}
                <Card>
                  <h4 className="font-bold serif-text text-on-surface mb-4">Featured for the Family</h4>
                  <div className="space-y-3">
                    {[
                      { title: 'Meditations on the Cosmos', tag: 'Science & Philosophy · 12+' },
                      { title: 'The Whispering Woods', tag: 'Fantasy · 8–11 years' },
                    ].map((book) => (
                      <div
                        key={book.title}
                        onClick={() => navigate('/stories')}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-10 h-14 bg-surface-container rounded-md flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-outline-variant text-base">menu_book</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{book.title}</p>
                          <p className="text-xs text-on-surface-variant">{book.tag}</p>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => navigate('/stories')}
                      className="w-full mt-2 py-2.5 rounded-full border border-outline-variant text-primary text-sm font-semibold hover:bg-surface-container-low transition-colors"
                    >
                      Explore Full Library
                    </button>
                  </div>
                </Card>
              </div>
            </div>

          </Container>

          <footer className="py-6 text-center text-xs text-outline tracking-widest uppercase border-t border-outline-variant/30 mt-8">
            © 2024 The Curated Sanctuary · Family Reading Library
          </footer>
        </main>
      </div>

      {/* ── Modals ── */}
      {showAddChildModal && (
        <AddChildModal
          editingChild={editingChild}
          formData={formData}
          formErrors={formErrors}
          isSaving={isSavingChild}
          onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
          onSave={handleAddChild}
          onClose={handleCloseModal}
        />
      )}

      {showCredentialsModal && newChildCredentials && (
        <CredentialsModal
          credentials={newChildCredentials}
          onClose={() => { setShowCredentialsModal(false); setNewChildCredentials(null); }}
          onCopy={copyToClipboard}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
