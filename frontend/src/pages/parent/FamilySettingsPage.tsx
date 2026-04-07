import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, Home } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import InputField from '../../components/common/InputField';
import FamilyService from '../../services/familyService';
import { Family } from '../../types';

const FamilySettingsPage: React.FC = () => {
  const [family, setFamily] = useState<Family | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [familyNameError, setFamilyNameError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const validateFamilyName = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'Family name is required';
    }

    if (trimmed.length < 2 || trimmed.length > 100) {
      return 'Family name must be between 2 and 100 characters';
    }

    return '';
  };

  const loadFamily = async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const data = await FamilyService.getMyFamily();
      setFamily(data);
      setFamilyName(data.familyName || '');
      setFamilyNameError('');
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setFamily(null);
        setFamilyName('');
        setFamilyNameError('');
      } else {
        setLoadError(error?.response?.data?.message || 'Failed to load family settings');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFamily();
  }, []);

  const handleCreate = async () => {
    const validationError = validateFamilyName(familyName);
    if (validationError) {
      setFamilyNameError(validationError);
      return;
    }

    try {
      setIsSaving(true);
      const created = await FamilyService.createFamily({ familyName: familyName.trim() });
      setFamily(created);
      setFamilyName(created.familyName || familyName.trim());
      setFamilyNameError('');
      toast.success('Family created successfully');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create family';
      setFamilyNameError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!family?.id) return;
    const validationError = validateFamilyName(familyName);
    if (validationError) {
      setFamilyNameError(validationError);
      return;
    }

    try {
      setIsSaving(true);
      const updated = await FamilyService.updateFamily(family.id, { familyName: familyName.trim() });
      setFamily(updated);
      setFamilyName(updated.familyName || familyName.trim());
      setFamilyNameError('');
      toast.success('Family updated successfully');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update family';
      setFamilyNameError(message);
      toast.error(message);
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
      setFamilyNameError('');
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

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Family Settings" />
        <div className="container-responsive py-10">
          <div className="card max-w-2xl mx-auto text-center py-12">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={36} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to load family settings</h1>
            <p className="text-gray-600 mb-6">{loadError}</p>
            <button className="btn-primary" onClick={loadFamily}>Try Again</button>
          </div>
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
          {!family && (
            <div className="rounded-lg border border-dashed border-nestory-300 bg-nestory-50 p-4 mb-6">
              <div className="flex items-start gap-3">
                <Home className="text-nestory-700 mt-0.5" size={18} />
                <div>
                  <p className="font-semibold text-gray-900">No family group yet</p>
                  <p className="text-sm text-gray-600">
                    Create your family group first. Each parent account can have one family group.
                  </p>
                </div>
              </div>
            </div>
          )}

          <InputField
            label="Family Name"
            name="familyName"
            value={familyName}
            onChange={(e) => {
              setFamilyName(e.target.value);
              if (familyNameError) setFamilyNameError('');
            }}
            placeholder="e.g., The Silva Family"
            error={familyNameError}
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
