import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, LayoutDashboard, Book, CheckCircle2, TrendingUp, MessageCircle, 
  Settings, Award, Flame, Clock, AlertCircle, Home, LogOut, Key, 
  Trash2, Edit2, Clipboard, X, MessageSquare, ArrowRight, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';




import FamilyService from '../../services/familyService';
import ChildService from '../../services/childService';
import DashboardService from '../../services/dashboardService';
import ReadingService from '../../services/readingService';
import chatService from '../../services/chatService';
import { Child, Family } from '../../types';
import { Container, Section, Grid, Card } from '../../components/common/StitchComponents';
import { toast } from 'react-hot-toast';

// -- Types --------------------------------------------------------------------
interface RecentAssignmentRow {
  id: string;
  childId: string;
  childAvatar?: string;
  childName: string;
  storyTitle: string;
  status: string;
  dueDate?: string;
  createdAt?: string;
}

interface RecentCompletionRow {
  id: string;
  childId: string;
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

import { ChildAccountCredentials as AddChildCredentials } from '../../types';
/*
interface AddChildCredentials {
  username: string;
  password?: string;
}*/

// -- Helper Components ---------------------------------------------------------

const Sidebar = ({ activeTab, onNavigate, unreadMessages }: any) => {
  const tabs = [
    { id: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { id: "/stories", icon: <Book size={20} />, label: "Library" },
    { id: "/assignments", icon: <CheckCircle2 size={20} />, label: "Assignments" },
    { id: "/progress", icon: <TrendingUp size={20} />, label: "Progress" },
    { id: "/chat", icon: <MessageCircle size={20} />, label: "Family Chat", badge: unreadMessages },
    { id: "/gamification", icon: <Award size={20} />, label: "Rewards" },
    { id: "/family-settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant/30 hidden md:flex flex-col py-6 px-4">
      <div className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === tab.id 
                ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={activeTab === tab.id ? "text-on-primary" : "text-primary group-hover:scale-110 transition-transform"}>
                {tab.icon}
              </span>
              <span className="font-semibold text-sm">{tab.label}</span>
            </div>
            {tab.badge > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? "bg-on-primary text-primary" : "bg-error text-white"
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-auto pt-6 border-t border-outline-variant/20">
        <div className="bg-primary/5 rounded-2xl p-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Sanctuary Pro</p>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Unlock advanced analytics and unlimited story generations.
          </p>
          <button className="w-full mt-3 py-2 bg-on-surface text-surface text-xs font-bold rounded-lg hover:bg-on-surface/90 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
};

const StatCard = ({ label, value, icon, trend, trendValue }: any) => (
  <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-b-4 border-b-primary/10 hover:border-b-primary">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-bold serif-text text-on-surface group-hover:text-primary transition-colors">{value}</h3>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 ${trend === 'up' ? 'text-success' : 'text-error'}`}>
            <span className="material-symbols-outlined text-sm">{trend === 'up' ? 'trending_up' : 'trending_down'}</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{trendValue || (trend === 'up' ? '+12% growth' : '-4% change')}</span>
          </div>
        )}
      </div>
      <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
    </div>
  </Card>
);

const QuickActionCard = ({ icon, label, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-6 bg-surface-container-low rounded-3xl border border-outline-variant/30 hover:bg-surface-container-high hover:shadow-lg transition-all duration-300 group"
  >
    <div 
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-active:scale-95 shadow-md"
      style={{ backgroundColor: `${color}15`, color: color }}
    >
      {icon}
    </div>
    <span className="text-sm font-bold text-on-surface text-center leading-tight">{label}</span>
  </button>
);

const ChildCard = ({ child, performance, isDeleting, isResetting, onEdit, onDelete, onResetPassword, onViewProgress }: any) => (
  <Card className="group relative overflow-hidden flex flex-col h-full border-t-8 border-t-primary/20 hover:border-t-primary transition-all duration-500">
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center text-4xl shadow-inner group-hover:scale-105 transition-transform">
            {child.avatar && child.avatar.startsWith('http') ? (
              <img src={child.avatar} alt={child.name} className="w-full h-full object-cover rounded-3xl" />
            ) : (
              child.avatar || '??'
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-on-primary rounded-xl flex items-center justify-center border-2 border-surface shadow-md">
            <span className="text-[10px] font-bold">{child.age}</span>
          </div>
        </div>
        <div>
          <h3 className="serif-text text-2xl font-bold text-on-surface group-hover:text-primary transition-colors">{child.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-lg bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider">
              {child.readingLevel || 'Beginner'}
            </span>
            <span className="text-xs text-on-surface-variant font-medium">Lvl {Math.floor((performance?.assignments?.completed || 0) / 5) + 1}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant" title="Edit Profile">
          <Edit2 size={16} />
        </button>
        <button onClick={onResetPassword} disabled={isResetting} className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant" title="Reset Credentials">
          <Key size={16} />
        </button>
        <button onClick={onDelete} disabled={isDeleting} className="p-2 rounded-xl hover:bg-error/10 text-error" title="Remove reader">
          <Trash2 size={16} />
        </button>
      </div>
    </div>

    {/* Performance stats */}
    <div className="bg-surface-container/30 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-4">
      <div className="text-center border-r border-outline-variant/30">
        <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Completed</p>
        <p className="text-xl font-bold text-on-surface">{performance?.assignments?.completed || 0}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] uppercase font-bold text-outline tracking-widest mb-1">Pass Rate</p>
        <p className="text-xl font-bold text-on-surface">{Math.round(performance?.assignments?.completionRate || 0)}%</p>
      </div>
    </div>

    <div className="mt-auto space-y-3">
      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${performance?.assignments?.completionRate || 0}%` }}
        />
      </div>
      <button 
        onClick={onViewProgress}
        className="w-full py-3 rounded-2xl bg-on-surface text-surface text-sm font-bold hover:bg-on-surface/90 transition-all flex items-center justify-center gap-2 group/btn"
      >
        View Journey <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  </Card>
);

const ActivityItem = ({ icon, title, subtitle, time }: any) => (
  <div className="py-3 flex items-start gap-3 group px-1">
    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
      <span className="material-symbols-outlined text-lg text-primary">{icon}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors leading-snug">{title}</p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-[10px] text-on-surface-variant">{subtitle}</p>
        <p className="text-[10px] text-outline italic">{time}</p>
      </div>
    </div>
  </div>
);

const AddChildModal = ({ editingChild, formData, formErrors, isSaving, onChange, onSave, onClose }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-surface/80 backdrop-blur-md" onClick={onClose} />
    <Card className="w-full max-w-lg z-10 animate-scale-up relative border border-outline-variant shadow-2xl">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-outline-variant hover:text-on-surface transition-colors">
        <X size={20} />
      </button>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Plus className="text-primary" size={24} />
        </div>
        <div>
          <h2 className="serif-text text-2xl font-bold text-on-surface">
            {editingChild ? "Edit Reader Profile" : "Add a New Reader"}
          </h2>
          <p className="text-sm text-on-surface-variant">Configure your child's personal reading sanctuary</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Display Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              className={`modern-input ${formErrors.name ? 'ring-2 ring-error/50' : ''}`}
              placeholder="e.g. Leo Silva"
            />
            {formErrors.name && <p className="text-[10px] text-error mt-1.5 font-bold uppercase tracking-tight">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Age</label>
            <input
              type="number"
              min="1"
              max="18"
              value={formData.age}
              onChange={(e) => onChange('age', parseInt(e.target.value))}
              className={`modern-input ${formErrors.age ? 'ring-2 ring-error/50' : ''}`}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Icon or Avatar</label>
            <div className="relative">
              <input
                type="text"
                value={formData.avatar}
                onChange={(e) => onChange('avatar', e.target.value)}
                className={`modern-input pl-14 ${formErrors.avatar ? 'ring-2 ring-error/50' : ''}`}
                placeholder="Emoji or URL"
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-xl shadow-inner">
                {formData.avatar ? (formData.avatar.startsWith('http') ? '???' : formData.avatar) : '??'}
              </div>
            </div>
            {formErrors.avatar && <p className="text-[10px] text-error mt-1.5 font-bold uppercase tracking-tight">{formErrors.avatar}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Reading Level</label>
            <select
              value={formData.readingLevel}
              onChange={(e) => onChange('readingLevel', e.target.value as 'beginner' | 'intermediate' | 'advanced')}
              className="modern-input appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%237D4E3A%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat pr-10"
            >
              <option value="beginner">Beginner (Age 5-7)</option>
              <option value="intermediate">Explorer (Age 8-10)</option>
              <option value="advanced">Scholar (Age 11+)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-10">
        <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-surface-container-high text-on-surface font-bold hover:bg-surface-container-highest transition-colors">
          Cancel
        </button>
        <button onClick={onSave} disabled={isSaving} className="flex-[2] py-4 rounded-2xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
          ) : (
            <>Save Reader Profile</>
          )}
        </button>
      </div>
    </Card>
  </div>
);

const CredentialsModal = ({ credentials, onClose, onCopy }: any) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-surface/90 backdrop-blur-xl" />
    <Card className="w-full max-w-md z-10 animate-scale-up border-2 border-primary/20 shadow-2xl overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary" />
      <div className="p-2 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center mx-auto mb-6 mt-4">
          <Key size={36} className="text-on-primary" />
        </div>
        <h2 className="serif-text text-3xl font-bold text-on-surface mb-2">Access Granted</h2>
        <p className="text-sm text-on-surface-variant font-medium leading-relaxed px-4">
          Please provide these credentials to your reader. For security, these won't be shown again.
        </p>
      </div>

      <div className="mt-8 space-y-4 px-2">
        <div className="bg-surface-container p-5 rounded-3xl border border-outline-variant/50 group hover:border-primary transition-colors cursor-copy" onClick={() => onCopy(credentials.username, 'Username')}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Username</span>
            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Clipboard size={14} /></span>
          </div>
          <p className="text-xl font-bold text-on-surface font-mono">{credentials.username}</p>
        </div>

        {credentials.password && (
          <div className="bg-surface-container p-5 rounded-3xl border border-outline-variant/50 group hover:border-primary transition-colors cursor-copy" onClick={() => onCopy(credentials.password, 'Password')}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Temporary Password</span>
              <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Clipboard size={14} /></span>
            </div>
            <p className="text-xl font-bold text-on-surface font-mono">{credentials.password}</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-1">
        <button onClick={onClose} className="w-full py-5 rounded-3xl bg-on-surface text-surface font-bold text-base hover:bg-on-surface/90 shadow-xl transition-all">
          I've saved these credentials
        </button>
      </div>
    </Card>
  </div>
);

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
        readingLevel: formData.readingLevel as 'beginner' | 'intermediate' | 'advanced',
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
          onChange={(field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }))}
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
