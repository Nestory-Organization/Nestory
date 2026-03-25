import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import InputField from '../../components/common/InputField';
import FamilyService from '../../services/familyService';
import { Family } from '../../types';

const FamilySettingsPage: React.FC = () => {
  const [family, setFamily] = useState<Family | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadFamily = async () => {
    try {
      setIsLoading(true);
      const data = await FamilyService.getMyFamily();
      const normalized = { ...data, id: (data as any).id || (data as any)._id || '' };
      setFamily(normalized);
      setFamilyName(normalized.familyName || '');
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setFamily(null);
        setFamilyName('');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to load family');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFamily();
  }, []);

  const handleCreate = async () => {
    if (!familyName.trim()) {
      toast.error('Family name is required');
      return;
    }

    try {
      setIsSaving(true);
      const created = await FamilyService.createFamily({ familyName: familyName.trim() });
      const normalized = { ...created, id: (created as any).id || (created as any)._id || '' };
      setFamily(normalized);
      toast.success('Family created successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create family');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!family?.id) return;
    if (!familyName.trim()) {
      toast.error('Family name is required');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await FamilyService.updateFamily(family.id, { familyName: familyName.trim() });
      const normalized = { ...updated, id: (updated as any).id || (updated as any)._id || family.id };
      setFamily(normalized);
      toast.success('Family updated successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update family');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!family?.id) return;
    if (!window.confirm('Delete this family group? This action cannot be undone.')) return;

    try {
      setIsSaving(true);
      await FamilyService.deleteFamily(family.id);
      setFamily(null);
      setFamilyName('');
      toast.success('Family deleted successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete family');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Family Settings" />
        <div className="container-responsive py-10 text-center">
          <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Family Settings" />
      <div className="container-responsive py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Family Settings</h1>
          <p className="text-gray-600">Create, update, or delete your family group.</p>
        </div>

        <div className="card max-w-2xl">
          <InputField
            label="Family Name"
            name="familyName"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="e.g., The Silva Family"
            required
          />

          <div className="mt-6 flex flex-wrap gap-3">
            {!family ? (
              <button className="btn-primary" onClick={handleCreate} disabled={isSaving}>
                {isSaving ? 'Creating...' : 'Create Family'}
              </button>
            ) : (
              <>
                <button className="btn-primary" onClick={handleUpdate} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Update Family'}
                </button>
                <button className="btn-danger" onClick={handleDelete} disabled={isSaving}>
                  Delete Family
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilySettingsPage;
