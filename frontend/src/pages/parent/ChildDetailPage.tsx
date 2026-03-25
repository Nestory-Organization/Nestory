import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Book, CalendarDays, Flame, Hourglass, UserCircle2 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import ChildService from '../../services/childService';
import AssignmentService from '../../services/assignmentService';
import ReadingService from '../../services/readingService';
import { Child } from '../../types';

type AssignmentStatus = 'assigned' | 'in_progress' | 'completed';

interface AssignmentWithStory {
  id: string;
  status: AssignmentStatus;
  dueDate?: string;
  createdAt?: string;
  story?: {
    id?: string;
    _id?: string;
    title?: string;
    author?: string;
    readingLevel?: string;
  };
}

const ChildDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();

  const [child, setChild] = useState<Child | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithStory[]>([]);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const assignmentStats = useMemo(() => {
    const assigned = assignments.filter((item) => item.status === 'assigned').length;
    const inProgress = assignments.filter((item) => item.status === 'in_progress').length;
    const completed = assignments.filter((item) => item.status === 'completed').length;
    return {
      total: assignments.length,
      assigned,
      inProgress,
      completed,
    };
  }, [assignments]);

  useEffect(() => {
    const loadChildData = async () => {
      if (!childId) {
        toast.error('Invalid child id');
        navigate('/dashboard');
        return;
      }

      try {
        setIsLoading(true);

        const [childData, assignmentData, weeklyData, streakData] = await Promise.all([
          ChildService.getChildById(childId),
          AssignmentService.getChildAssignments(childId),
          ReadingService.getWeeklyReadingTime(childId).catch(() => ({ totalTime: 0, unit: 'minutes' })),
          ReadingService.getReadingStreak(childId).catch(() => ({ streak: 0, longestStreak: 0 })),
        ]);

        const normalizedAssignments = (assignmentData as unknown as Array<Record<string, unknown>>).map((item) => ({
          id: String(item.id ?? item._id ?? ''),
          status: (item.status as AssignmentStatus) || 'assigned',
          dueDate: typeof item.dueDate === 'string' ? item.dueDate : undefined,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
          story:
            typeof item.story === 'object' && item.story !== null
              ? {
                  id: String((item.story as Record<string, unknown>).id ?? ''),
                  _id: String((item.story as Record<string, unknown>)._id ?? ''),
                  title: ((item.story as Record<string, unknown>).title as string) || 'Untitled story',
                  author: ((item.story as Record<string, unknown>).author as string) || 'Unknown author',
                  readingLevel: ((item.story as Record<string, unknown>).readingLevel as string) || 'beginner',
                }
              : undefined,
        }));

        setChild(childData);
        setAssignments(normalizedAssignments);
        setWeeklyMinutes(Number(weeklyData.totalTime) || 0);
        setCurrentStreak(Number(streakData.streak) || 0);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load child details');
      } finally {
        setIsLoading(false);
      }
    };

    loadChildData();
  }, [childId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Child Details" />
        <div className="container-responsive py-10 text-center">
          <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading child dashboard...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Child Details" />
        <div className="container-responsive py-10">
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">Child not found</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Child Details" />

      <div className="container-responsive py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary mb-6 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-nestory-100 flex items-center justify-center text-3xl">
              {child.avatar || '🧒'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserCircle2 className="text-nestory-600" size={22} />
                {child.name}
              </h1>
              <p className="text-gray-600">
                Age {child.age} • <span className="capitalize">{child.readingLevel || 'beginner'}</span> reader
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Total Assignments</p>
            <p className="text-2xl font-bold text-gray-900">{assignmentStats.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-blue-700">{assignmentStats.inProgress}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-2"><Flame size={16} /> Streak</p>
            <p className="text-2xl font-bold text-orange-600">{currentStreak} days</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-2"><Hourglass size={16} /> This Week</p>
            <p className="text-2xl font-bold text-green-700">{weeklyMinutes} min</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Book size={20} className="text-nestory-600" />
            Assigned Stories
          </h2>

          {assignments.length === 0 ? (
            <p className="text-gray-600">No assignments yet.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{assignment.story?.title || 'Untitled story'}</p>
                    <p className="text-sm text-gray-600">{assignment.story?.author || 'Unknown author'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="badge bg-gray-100 text-gray-700 capitalize">{assignment.status.replace('_', ' ')}</span>
                      {assignment.story?.readingLevel && (
                        <span className="badge bg-nestory-100 text-nestory-800 capitalize">{assignment.story.readingLevel}</span>
                      )}
                    </div>
                  </div>
                  {assignment.dueDate && (
                    <p className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-1">
                      <CalendarDays size={14} />
                      Due {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildDetailPage;