import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import SelectField from '../../components/common/SelectField';
import InputField from '../../components/common/InputField';
import AssignmentService from '../../services/assignmentService';
import ChildService from '../../services/childService';
import StoryService from '../../services/storyService';
import { Child, Story } from '../../types';

type AssignmentStatus = 'assigned' | 'in_progress' | 'completed';

interface AssignmentListItem {
  id: string;
  status: AssignmentStatus;
  dueDate?: string;
  notes?: string;
  storyTitle: string;
  storyAuthor: string;
  readingLevel?: string;
}

const AssignmentsPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    childId: '',
    storyId: '',
    dueDate: '',
    notes: '',
  });

  const childOptions = useMemo(
    () => [
      { value: '', label: 'Select Child' },
      ...children.map((child) => ({ value: child.id, label: `${child.name} (Age ${child.age})` })),
    ],
    [children]
  );

  const storyOptions = useMemo(
    () => [
      { value: '', label: 'Select Story' },
      ...stories.map((story) => ({ value: story.id, label: `${story.title} — ${story.author}` })),
    ],
    [stories]
  );

  const statusOptions = [
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  const normalizeId = (value: any): string => String(value?.id || value?._id || '');

  const loadBaseData = async () => {
    try {
      setIsLoading(true);
      const [childrenData, storyResponse] = await Promise.all([
        ChildService.getChildren(),
        StoryService.getStories(1, 100),
      ]);

      const normalizedChildren = childrenData.map((child: any) => ({
        ...child,
        id: normalizeId(child),
      }));

      const normalizedStories = (storyResponse.data || []).map((story: any) => ({
        ...story,
        id: normalizeId(story),
      }));

      setChildren(normalizedChildren);
      setStories(normalizedStories);

      if (normalizedChildren.length > 0) {
        const firstChildId = normalizedChildren[0].id;
        setSelectedChildId(firstChildId);
        setFormData((prev) => ({ ...prev, childId: firstChildId }));
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load assignment setup data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignments = async (childId: string) => {
    if (!childId) {
      setAssignments([]);
      return;
    }

    try {
      const data = await AssignmentService.getChildAssignments(childId);
      const normalized = (data as any[]).map((item: any) => ({
        id: normalizeId(item),
        status: item.status,
        dueDate: item.dueDate,
        notes: item.notes,
        storyTitle: item.story?.title || 'Untitled',
        storyAuthor: item.story?.author || 'Unknown',
        readingLevel: item.story?.readingLevel,
      }));
      setAssignments(normalized);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load assignments');
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    loadAssignments(selectedChildId);
  }, [selectedChildId]);

  const handleCreate = async () => {
    if (!formData.childId || !formData.storyId) {
      toast.error('Please select both child and story');
      return;
    }

    try {
      setIsSaving(true);
      await AssignmentService.createAssignment({
        childId: formData.childId,
        storyId: formData.storyId,
        dueDate: formData.dueDate || undefined,
        notes: formData.notes || undefined,
      });
      toast.success('Assignment created');
      setFormData((prev) => ({ ...prev, storyId: '', dueDate: '', notes: '' }));
      await loadAssignments(formData.childId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create assignment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusUpdate = async (assignmentId: string, status: AssignmentStatus) => {
    try {
      await AssignmentService.updateAssignmentStatus(assignmentId, status);
      toast.success('Assignment updated');
      await loadAssignments(selectedChildId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update assignment');
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!window.confirm('Delete this assignment?')) return;

    try {
      await AssignmentService.deleteAssignment(assignmentId);
      toast.success('Assignment deleted');
      await loadAssignments(selectedChildId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete assignment');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Assignments" />
        <div className="container-responsive py-10 text-center">
          <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Assignments" />
      <div className="container-responsive py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Manage Assignments</h1>
          <p className="text-gray-600">Create, view, update, and delete child assignments.</p>
        </div>

        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create Assignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <SelectField
              label="Child"
              name="childId"
              value={formData.childId}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, childId: e.target.value }));
                setSelectedChildId(e.target.value);
              }}
              options={childOptions}
            />
            <SelectField
              label="Story"
              name="storyId"
              value={formData.storyId}
              onChange={(e) => setFormData((prev) => ({ ...prev, storyId: e.target.value }))}
              options={storyOptions}
            />
            <InputField
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <textarea
              className="input-base min-h-24"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional assignment notes"
            />
          </div>
          <button onClick={handleCreate} disabled={isSaving} className="btn-primary">
            {isSaving ? 'Saving...' : 'Create Assignment'}
          </button>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Assignments</h2>
            <div className="w-64">
              <SelectField
                name="selectedChild"
                value={selectedChildId}
                onChange={(e) => {
                  setSelectedChildId(e.target.value);
                  setFormData((prev) => ({ ...prev, childId: e.target.value }));
                }}
                options={childOptions}
              />
            </div>
          </div>

          {assignments.length === 0 ? (
            <p className="text-gray-600">No assignments found for this child.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{assignment.storyTitle}</p>
                      <p className="text-sm text-gray-600">{assignment.storyAuthor}</p>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        {assignment.readingLevel && (
                          <span className="badge bg-nestory-100 text-nestory-800 capitalize">{assignment.readingLevel}</span>
                        )}
                        {assignment.dueDate && (
                          <span className="badge bg-gray-100 text-gray-700">Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="input-base w-40"
                        value={assignment.status}
                        onChange={(e) => handleStatusUpdate(assignment.id, e.target.value as AssignmentStatus)}
                        title="Assignment status"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <button className="btn-danger" onClick={() => handleDelete(assignment.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  {assignment.notes && <p className="text-sm text-gray-600 mt-2">{assignment.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;
