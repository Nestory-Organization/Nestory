import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, Clock, ExternalLink, Tag, User } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import StoryService from '../../services/storyService';
import { Story } from '../../types';

const StoryDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ageEmoji = useMemo(() => {
    switch (story?.ageGroup) {
      case 'toddler':
        return '👶';
      case 'early-reader':
        return '👧';
      case 'middle-grade':
        return '🧒';
      case 'young-adult':
        return '👦';
      default:
        return '📚';
    }
  }, [story?.ageGroup]);

  useEffect(() => {
    const loadStory = async () => {
      if (!storyId) {
        toast.error('Invalid story id');
        navigate('/stories');
        return;
      }

      try {
        setIsLoading(true);
        const storyData = await StoryService.getStoryById(storyId);
        setStory(storyData);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load story');
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [navigate, storyId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Story Details" />
        <div className="container-responsive py-10 text-center">
          <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading story...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Story Details" />
        <div className="container-responsive py-10">
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">Story not found</p>
            <button onClick={() => navigate('/stories')} className="btn-primary">
              Back to Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Story Details" />

      <div className="container-responsive py-8">
        <button
          onClick={() => navigate('/stories')}
          className="btn-secondary mb-6 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Library
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 card">
            <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-nestory-100 to-blue-100 flex items-center justify-center text-7xl mb-4">
              {ageEmoji}
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-nestory-600" />
                <span className="badge-primary capitalize">{story.readingLevel}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-nestory-600" />
                <span>{story.pageCount} pages</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-nestory-600" />
                <span>Source: {story.source}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 card">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{story.title}</h1>
            <p className="text-gray-600 flex items-center gap-2 mb-5">
              <User size={16} />
              {story.author}
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              <span className="badge bg-blue-100 text-blue-800 capitalize">{story.ageGroup}</span>
              {(story.genres || []).map((genre) => (
                <span key={genre} className="badge bg-gray-100 text-gray-700">
                  {genre}
                </span>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {story.description || 'No description available for this story.'}
              </p>
            </div>

            {story.previewLink && (
              <div className="pt-6">
                <a
                  href={story.previewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline inline-flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  Open Preview
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetailPage;