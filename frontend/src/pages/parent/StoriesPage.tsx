import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import StoryCard from '../../components/common/StoryCard';
import SelectField from '../../components/common/SelectField';
import StoryService from '../../services/storyService';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { Story } from '../../types';

const StoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ageGroupOptions = [
    { value: '', label: 'All Age Groups' },
    { value: 'toddler', label: '👶 Toddler' },
    { value: 'early-reader', label: '👧 Early Reader' },
    { value: 'middle-grade', label: '🧒 Middle Grade' },
    { value: 'young-adult', label: '👦 Young Adult' },
  ];

  const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  useEffect(() => {
    const loadStories = async () => {
      try {
        setIsLoading(true);
        const response = await StoryService.getStories(currentPage, 12, {
          ageGroup: selectedAgeGroup,
          readingLevel: selectedLevel,
        });
        setStories(response.data || []);
      } catch (error: any) {
        toast.error('Failed to load stories');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [currentPage, selectedAgeGroup, selectedLevel]);

  // Filter stories by search query
  useEffect(() => {
    const filtered = stories.filter(
      (story) =>
        story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.author?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStories(filtered);
  }, [searchQuery, stories]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Story Library" />

      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Story Library</h1>
            <p className="text-gray-600">Discover stories for your family by age and reading level</p>
          </div>
          <p className="text-sm text-gray-500">{filteredStories.length} results</p>
        </div>

        {/* Search & Filters */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base pl-10"
              />
            </div>

            <SelectField
              name="ageGroup"
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value)}
              options={ageGroupOptions}
            />

            <SelectField
              name="level"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              options={levelOptions}
            />
          </div>
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading stories...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No stories found with your filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedAgeGroup('');
                setSelectedLevel('');
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-8">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="animate-slide-up"
              >
                <StoryCard
                  story={story}
                  onSelect={() => navigate(`/story/${story.id}`)}
                  clickable
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredStories.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-600 px-2">Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesPage;
