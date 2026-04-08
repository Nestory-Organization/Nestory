import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Clock3 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import AssignmentService from '../../services/assignmentService';
import { Assignment } from '../../types';

const ChildAssignmentDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId) {
        toast.error('Invalid assignment');
        navigate('/child');
        return;
      }

      try {
        setIsLoading(true);
        const fetched = await AssignmentService.getMyAssignmentById(assignmentId);

        if (fetched.status === 'assigned') {
          const progressed = await AssignmentService.updateMyAssignmentStatus(assignmentId, 'in_progress');
          setAssignment(progressed);
        } else {
          setAssignment(fetched);
        }
      } catch (error: unknown) {
        const message =
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Failed to load assignment';
        toast.error(message || 'Failed to load assignment');
        navigate('/child');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignment();
  }, [assignmentId, navigate]);

  const handleMarkCompleted = async () => {
    if (!assignment?.id) return;

    try {
      setIsUpdatingStatus(true);
      const updated = await AssignmentService.updateMyAssignmentStatus(assignment.id, 'completed');
      setAssignment(updated);
      toast.success('Assignment marked as completed');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to update assignment status';
      toast.error(message || 'Failed to update assignment status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Assignment" />
        <div className="container-responsive py-10 text-center">
          <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Assignment" />
        <div className="container-responsive py-10">
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">Assignment not found.</p>
            <button onClick={() => navigate('/child')} className="btn-primary">Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Assignment" />

      <div className="container-responsive py-8">
        <button onClick={() => navigate('/child')} className="btn-secondary mb-6 inline-flex items-center gap-2">
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="text-nestory-600" size={20} />
            <h1 className="text-2xl font-bold text-gray-900">{assignment.story?.title || 'Untitled story'}</h1>
          </div>
          <p className="text-gray-700">By {assignment.story?.author || 'Unknown author'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="badge bg-blue-100 text-blue-800 capitalize">{assignment.status.replace('_', ' ')}</span>
            {assignment.story?.readingLevel && (
              <span className="badge bg-nestory-100 text-nestory-800 capitalize">{assignment.story.readingLevel}</span>
            )}
            {assignment.dueDate && (
              <span className="badge bg-gray-100 text-gray-700 inline-flex items-center gap-1">
                <CalendarDays size={14} />
                Due {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Story Details</h2>
            <p className="text-gray-700 mb-3">Open this story from the library and continue reading.</p>
            <p className="text-sm text-gray-600">Tip: opening this assignment for the first time automatically moved it to In Progress.</p>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Progress</h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-600 mb-1">Current Status</p>
                <p className="font-semibold capitalize text-gray-900">{assignment.status.replace('_', ' ')}</p>
              </div>
              {assignment.completedAt && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs text-green-700 mb-1">Completed At</p>
                  <p className="font-semibold text-green-900 inline-flex items-center gap-1">
                    <Clock3 size={14} />
                    {new Date(assignment.completedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {assignment.status !== 'completed' && (
                <button
                  type="button"
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                  onClick={handleMarkCompleted}
                  disabled={isUpdatingStatus}
                >
                  <CheckCircle2 size={18} />
                  {isUpdatingStatus ? 'Updating...' : 'Mark as Completed'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildAssignmentDetailPage;
