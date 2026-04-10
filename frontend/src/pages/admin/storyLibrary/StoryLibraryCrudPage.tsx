import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../../components/common/Navbar';
import StoryLibraryTable from '../../../components/storyLibrary/StoryLibraryTable';
import StoryFormModal, {
  StoryFormValues,
} from '../../../components/storyLibrary/StoryFormModal';
import StoryLibraryFilters from '../../../components/storyLibrary/StoryLibraryFilters';
import StoryService from '../../../services/storyService';
import { Story } from '../../../types';

const defaultForm: StoryFormValues = {
  title: '',
  author: '',
  description: '',
  ageGroup: 'early-reader',
  readingLevel: 'beginner',
  genres: '',
  pageCount: 1,
  coverImage: '',
};

const StoryLibraryCrudPage: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [syncingStoryId, setSyncingStoryId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StoryFormValues>(defaultForm);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [readingLevel, setReadingLevel] = useState('');
  const [genre, setGenre] = useState('');
  const [source, setSource] = useState('');

  const ageGroupOptions = useMemo(
    () => [
      { value: '', label: 'All Age Groups' },
      { value: 'toddler', label: 'Toddler' },
      { value: 'early-reader', label: 'Early Reader' },
      { value: 'middle-grade', label: 'Middle Grade' },
      { value: 'young-adult', label: 'Young Adult' },
    ],
    []
  );

  const readingLevelOptions = useMemo(
    () => [
      { value: '', label: 'All Levels' },
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
    []
  );

  const genreOptions = useMemo(
    () => [
      { value: '', label: 'All Genres' },
      { value: 'Fantasy', label: 'Fantasy' },
      { value: 'Adventure', label: 'Adventure' },
      { value: 'Animals', label: 'Animals' },
      { value: 'Fairy Tale', label: 'Fairy Tale' },
      { value: 'Education', label: 'Education' },
      { value: 'General', label: 'General' },
      { value: 'Romance', label: 'Romance' },
      { value: 'Mystery', label: 'Mystery' },
      { value: 'Science', label: 'Science' },
    ],
    []
  );

  const sourceOptions = useMemo(
    () => [
      { value: '', label: 'All Sources' },
      { value: 'internal', label: 'Manual / Internal' },
      { value: 'google', label: 'Google Imported' },
    ],
    []
  );

  const loadStories = async () => {
    try {
      setIsLoading(true);

      const response = await StoryService.getStories(page, 8, {
        search: search.trim() || undefined,
        ageGroup: ageGroup || undefined,
        readingLevel: readingLevel || undefined,
        genre: genre || undefined,
        source: source || undefined,
      });

      setStories(response.stories);
      setPages(response.pages || 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, [page, search, ageGroup, readingLevel, genre, source]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = async (story: Story) => {
    try {
      const fullStory = await StoryService.getStoryById(story.id);

      setEditingId(fullStory.id);
      setFormData({
        title: fullStory.title || '',
        author: fullStory.author || '',
        description: fullStory.description || '',
        ageGroup: fullStory.ageGroup || 'early-reader',
        readingLevel: fullStory.readingLevel || 'beginner',
        genres: Array.isArray(fullStory.genres)
          ? fullStory.genres.join(', ')
          : '',
        pageCount: fullStory.pageCount || 1,
        coverImage: fullStory.coverImage || '',
      });

      setIsModalOpen(true);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to load story details'
      );
    }
  };

  const handleFormChange = (
    field: keyof StoryFormValues,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (
      !formData.title.trim() ||
      !formData.author.trim() ||
      !formData.genres.trim()
    ) {
      toast.error('Title, author and at least one genre are required');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      description: formData.description.trim(),
      ageGroup: formData.ageGroup,
      readingLevel: formData.readingLevel,
      genres: formData.genres
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      pageCount: Number(formData.pageCount) || 1,
      coverImage: formData.coverImage.trim(),
    };

    try {
      setIsSaving(true);

      if (editingId) {
        await StoryService.updateStory(editingId, payload);
        toast.success('Story updated successfully');
      } else {
        await StoryService.createStory(payload);
        toast.success('Story created successfully');
      }

      setIsModalOpen(false);
      setFormData(defaultForm);
      await loadStories();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save story');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this story?'
    );
    if (!confirmed) return;

    try {
      await StoryService.deleteStory(storyId);
      toast.success('Story deleted successfully');

      if (stories.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadStories();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete story');
    }
  };

  const handleSync = async (storyId: string) => {
    try {
      setSyncingStoryId(storyId);
      await StoryService.syncStoryMetadata(storyId);
      toast.success('Google metadata synced successfully');
      await loadStories();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to sync story metadata'
      );
    } finally {
      setSyncingStoryId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Story Library Management" />

      <div className="container-responsive py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Story Library CRUD
            </h1>
            <p className="text-gray-600">
              Admin can add, edit, delete, search and manage story records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="btn-secondary"
              onClick={() => navigate('/admin/google-import')}
              type="button"
            >
              Import from Google
            </button>

            <button className="btn-primary" onClick={openCreate} type="button">
              Add New Story
            </button>
          </div>
        </div>

        <StoryLibraryFilters
          search={search}
          ageGroup={ageGroup}
          readingLevel={readingLevel}
          genre={genre}
          source={source}
          ageGroupOptions={ageGroupOptions}
          readingLevelOptions={readingLevelOptions}
          genreOptions={genreOptions}
          sourceOptions={sourceOptions}
          onSearchChange={(value) => {
            setPage(1);
            setSearch(value);
          }}
          onAgeGroupChange={(value) => {
            setPage(1);
            setAgeGroup(value);
          }}
          onReadingLevelChange={(value) => {
            setPage(1);
            setReadingLevel(value);
          }}
          onGenreChange={(value) => {
            setPage(1);
            setGenre(value);
          }}
          onSourceChange={(value) => {
            setPage(1);
            setSource(value);
          }}
        />

        <div className="card">
          <StoryLibraryTable
            stories={stories}
            isLoading={isLoading}
            syncingStoryId={syncingStoryId}
            onEdit={openEdit}
            onDelete={handleDelete}
            onSync={handleSync}
          />

          {!isLoading && pages > 1 && (
            <div className="flex items-center justify-between mt-6 border-t pt-4">
              <button
                className="btn-secondary disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                type="button"
              >
                Previous
              </button>

              <p className="text-sm text-gray-600">
                Page {page} of {pages}
              </p>

              <button
                className="btn-secondary disabled:opacity-50"
                disabled={page === pages}
                onClick={() => setPage((prev) => prev + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <StoryFormModal
        isOpen={isModalOpen}
        isSaving={isSaving}
        editingId={editingId}
        formData={formData}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onChange={handleFormChange}
      />
    </div>
  );
};

export default StoryLibraryCrudPage;