import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Clock3 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import AssignmentService from '../../services/assignmentService';
import ReadingService from '../../services/readingService';
import { Assignment, BookReadingProgress } from '../../types';

const ChildAssignmentDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [bookReading, setBookReading] = useState<BookReadingProgress | null>(null);
  const [bookReadingLoading, setBookReadingLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isOpeningReader, setIsOpeningReader] = useState(false);

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

        const nextAssignment =
          fetched.status === 'assigned'
            ? await AssignmentService.updateMyAssignmentStatus(assignmentId, 'in_progress')
            : fetched;
        setAssignment(nextAssignment);

        const storyOid = String(
          nextAssignment.storyId || nextAssignment.story?._id || nextAssignment.story?.id || ''
        );
        if (storyOid) {
          setBookReadingLoading(true);
          ReadingService.getProgressByBook(storyOid)
            .then(setBookReading)
            .catch(() => setBookReading(null))
            .finally(() => setBookReadingLoading(false));
        } else {
          setBookReading(null);
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

  const handleReadBook = async () => {
    const storyId =
      assignment?.storyId || assignment?.story?._id || assignment?.story?.id;
    if (!storyId) {
      toast.error('This book is not available to open yet.');
      return;
    }
    try {
      setIsOpeningReader(true);
      const { _id } = await ReadingService.startMySession({ storyId: String(storyId) });
      navigate(`/child/read/${_id}`);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Could not open this book';
      toast.error(message || 'Could not open this book');
    } finally {
      setIsOpeningReader(false);
    }
  };

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
            <p className="text-gray-700 mb-4">
              Read the book here and log your pages when you are done for this session.
            </p>
            <button
              type="button"
              onClick={handleReadBook}
              disabled={isOpeningReader}
              className="btn-primary inline-flex items-center justify-center gap-2 mb-4"
            >
              <BookOpen size={18} />
              {isOpeningReader ? 'Opening…' : 'Read this book'}
            </button>
            <p className="text-sm text-gray-600">
              Tip: opening this assignment for the first time automatically moved it to In Progress.
            </p>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Progress</h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-nestory-100 bg-nestory-50/40 p-3">
                <p className="text-xs text-gray-600 mb-2">Reading progress</p>
                {bookReadingLoading ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : !bookReading || bookReading.session === null ? (
                  <p className="text-sm text-gray-600">
                    No pages logged yet. Open the reader and tap Save progress as you read — works with any book,
                    including ones without a Google preview.
                  </p>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">
                      {bookReading.pagesRead ?? 0} / {bookReading.totalPages ?? '—'} pages
                    </p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          bookReading.completed ? 'bg-green-500' : 'bg-nestory-500'
                        }`}
                        style={{ width: `${Math.min(bookReading.progress ?? 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {Math.round(bookReading.progress ?? 0)}% of the book
                      {bookReading.completed ? ' — reading session complete' : ''}
                    </p>
                    {bookReading.lastUpdatedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last update {new Date(bookReading.lastUpdatedAt).toLocaleString()}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleReadBook}
                      disabled={isOpeningReader}
                      className="mt-3 text-sm font-semibold text-nestory-700 hover:text-nestory-900 underline-offset-2 hover:underline"
                    >
                      {isOpeningReader ? 'Opening…' : 'Continue in reader'}
                    </button>
                  </>
                )}
              </div>
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
