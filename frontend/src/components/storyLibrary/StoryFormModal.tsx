import React from 'react';
import Modal from '../common/Modal';
import InputField from '../common/InputField';
import SelectField from '../common/SelectField';

export interface StoryFormValues {
  title: string;
  author: string;
  description: string;
  ageGroup: 'toddler' | 'early-reader' | 'middle-grade' | 'young-adult';
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  genres: string;
  pageCount: number;
  coverImage: string;
}

interface StoryFormModalProps {
  isOpen: boolean;
  isSaving: boolean;
  editingId: string | null;
  formData: StoryFormValues;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: keyof StoryFormValues, value: string | number) => void;
}

const ageGroupOptions = [
  { value: 'toddler', label: 'Toddler' },
  { value: 'early-reader', label: 'Early Reader' },
  { value: 'middle-grade', label: 'Middle Grade' },
  { value: 'young-adult', label: 'Young Adult' },
];

const readingLevelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const StoryFormModal: React.FC<StoryFormModalProps> = ({
  isOpen,
  isSaving,
  editingId,
  formData,
  onClose,
  onSave,
  onChange,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      title={editingId ? 'Edit Story' : 'Create Story'}
      onClose={onClose}
      onConfirm={onSave}
      confirmText={editingId ? 'Update' : 'Create'}
      isLoading={isSaving}
      size="lg"
    >
      <div className="space-y-4">
        <InputField
          label="Title"
          name="title"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          required
        />

        <InputField
          label="Author"
          name="author"
          value={formData.author}
          onChange={(e) => onChange('author', e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            title="Story description"
            placeholder="Write a short summary of the story"
            className="input-base min-h-24"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Age Group"
            name="ageGroup"
            value={formData.ageGroup}
            onChange={(e) => onChange('ageGroup', e.target.value)}
            options={ageGroupOptions}
          />

          <SelectField
            label="Reading Level"
            name="readingLevel"
            value={formData.readingLevel}
            onChange={(e) => onChange('readingLevel', e.target.value)}
            options={readingLevelOptions}
          />

          <InputField
            label="Genres"
            name="genres"
            value={formData.genres}
            onChange={(e) => onChange('genres', e.target.value)}
            placeholder="Fantasy, Adventure, Animals"
            required
          />

          <InputField
            label="Page Count"
            name="pageCount"
            type="number"
            value={formData.pageCount}
            min="1"
            onChange={(e) => onChange('pageCount', Math.max(1, Number(e.target.value)))}
          />

          <div className="md:col-span-2">
            <InputField
              label="Cover Image URL"
              name="coverImage"
              value={formData.coverImage}
              onChange={(e) => onChange('coverImage', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StoryFormModal;