import React, { useState } from 'react';
import { Story } from '../../types';
import { BookOpen, Users } from 'lucide-react';

interface StoryCardProps {
  story: Partial<Story>;
  onSelect?: (story: Partial<Story>) => void;
  isSelected?: boolean;
  clickable?: boolean;
  disabled?: boolean;
}

const DEFAULT_BOOK_COVER = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80';

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onSelect,
  isSelected = false,
  clickable = true,
  disabled = false,
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  const getAgeGroupEmoji = (ageGroup?: string) => {
    switch (ageGroup) {
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
  };

  const normalizeImageUrl = (url?: string): string | null => {
    if (!url) return null;
    // Convert http:// to https://
    return url.replace(/^http:\/\//, 'https://');
  };

  const getCoverImageUrl = (): string => {
    if (!imageLoadError) {
      const normalizedUrl = normalizeImageUrl(story.coverImage);
      if (normalizedUrl) {
        return normalizedUrl;
      }
    }
    return DEFAULT_BOOK_COVER;
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canInteract = clickable && !disabled;

  return (
    <div
      className={`card-interactive flex flex-col h-full transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-nestory-600 shadow-lg' : ''
      } ${canInteract ? 'cursor-pointer active:scale-95' : ''} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={() => canInteract && onSelect?.(story)}
    >
      {/* Cover Image */}
      <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
        <img
          src={getCoverImageUrl()}
          alt={story.title || 'Book cover'}
          className="w-full h-full object-cover"
          onError={() => setImageLoadError(true)}
        />
      </div>

      {/* Title & Author */}
      <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">{story.title || 'Untitled'}</h3>
      <p className="text-sm text-gray-600 mb-3">{story.author || 'Unknown Author'}</p>

      {/* Reading Level Badge */}
      {story.readingLevel && (
        <div className="mb-3">
          <span className={`badge ${getLevelColor(story.readingLevel)} text-xs`}>
            {story.readingLevel}
          </span>
        </div>
      )}

      {/* Description */}
      {story.description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-3">{story.description}</p>
      )}

      {/* Footer Info */}
      <div className="mt-auto pt-3 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BookOpen size={14} />
          {story.pageCount || '?'} pages
        </div>
        <div className="flex items-center gap-1">
          <Users size={14} />
          {story.ageGroup || 'N/A'}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-nestory-600 rounded-full flex items-center justify-center text-white text-sm">
          ✓
        </div>
      )}
    </div>
  );
};

export default StoryCard;
