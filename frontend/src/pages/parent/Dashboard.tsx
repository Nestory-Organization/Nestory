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
import toast from 'react-hot-toast';
import {
  Book,
  Users,
  TrendingUp,
  Clock,
  Plus,
} from 'lucide-react';
import { Family, Child } from '../../types';

const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    age: 5,
    avatar: '👧',
    readingLevel: 'beginner' as const,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateChildForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Child name is required';
    }

    if (!Number.isInteger(formData.age) || formData.age < 1 || formData.age > 18) {
      newErrors.age = 'Age must be a whole number between 1 and 18';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const familyData = await FamilyService.getMyFamily();
        setFamily(familyData);

        const childrenData = await ChildService.getChildren();
        setChildren(childrenData);
      } catch (error: any) {
        toast.error('Failed to load family data');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddChild = async () => {
    if (!validateChildForm()) {
      toast.error('Please correct the highlighted fields');
      return;
    }

    try {
      if (editingChild) {
        // Edit existing child
        const updated = await ChildService.updateChild(editingChild.id, {
          name: formData.name,
          age: formData.age,
          avatar: formData.avatar,
          readingLevel: formData.readingLevel,
        });
        setChildren(children.map(c => c.id === editingChild.id ? updated : c));
        toast.success('Child updated successfully');
      } else {
        // Add new child
        const newChild = await ChildService.addChild({
          name: formData.name,
          age: formData.age,
          avatar: formData.avatar,
          family: family?.id || '',
        });
        setChildren([...children, newChild]);
        toast.success('Child added successfully');
      }

      // Reset form and close modal
      setFormData({ name: '', age: 5, avatar: '👧', readingLevel: 'beginner' });
      setShowAddChildModal(false);
      setEditingChild(null);
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
      await ChildService.deleteChild(childId);
      setChildren(children.filter(c => c.id !== childId));
      toast.success('Child deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete child');
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
            value="0"
            icon={Book}
            color="blue"
            subtext="This month"
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
            value="0"
            icon={TrendingUp}
            color="purple"
            subtext="Days"
          />
          <StatCard
            title="Total Hours"
            value="0"
            icon={Clock}
            color="orange"
            subtext="This month"
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
              <button className="btn-outline w-full text-left flex items-center gap-2 py-3" disabled>
                <TrendingUp size={18} />
                Analytics (Soon)
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-gray-600">No activity yet. Start by assigning a story to your child.</p>
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
            max="18"
            error={formErrors.age}
            required
          />

          {/* Reading Level */}
          <SelectField
            label="Reading Level"
            name="readingLevel"
            value={formData.readingLevel}
            onChange={(e) => setFormData({ ...formData, readingLevel: e.target.value as any })}
            options={readingLevels}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ParentDashboard;

