import React, { useState } from 'react';
import { Story } from '../../types';
import { BookOpen, Users, ExternalLink, FileText } from 'lucide-react';

interface StoryCardProps {
  story: Partial<Story>;
  onSelect?: (story: Partial<Story>) => void;
  isSelected?: boolean;
  clickable?: boolean;
  disabled?: boolean;
}

const DEFAULT_BOOK_COVER =
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80';

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onSelect,
  isSelected = false,
  clickable = true,
  disabled = false,
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  const normalizeImageUrl = (url?: string): string | null => {
    if (!url || !url.trim()) return null;
    return url.replace(/^http:\/\//i, 'https://');
  };

  const getCoverImageUrl = (): string => {
    if (!imageLoadError) {
      const normalizedUrl = normalizeImageUrl(story.coverImage);
      if (normalizedUrl) return normalizedUrl;
    }
    return DEFAULT_BOOK_COVER;
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-tertiary-container text-tertiary-onContainer';
      case 'intermediate':
        return 'bg-primary-container text-primary-800';
      case 'advanced':
        return 'bg-secondary-100 text-secondary-900';
      default:
        return 'bg-secondary-container text-secondary-onContainer';
    }
  };

  const getAgeGroupLabel = (ageGroup?: string) => {
    switch (ageGroup) {
      case 'toddler':
        return 'Toddler';
      case 'early-reader':
        return 'Early Reader';
      case 'middle-grade':
        return 'Middle Grade';
      case 'young-adult':
        return 'Young Adult';
      default:
        return 'N/A';
    }
  };

  const hasGooglePreview = Boolean(story.previewLink && story.previewLink.trim());
  const isGoogleBook = story.source === 'google';
  const pageCount =
    typeof story.pageCount === 'number' && story.pageCount > 0 ? story.pageCount : null;

  const canInteract = clickable && !disabled;

  const handleClick = () => {
    if (!canInteract) return;
    onSelect?.(story);
  };

  return (
    <button
      type="button"
      className={`relative w-full text-left card-interactive flex flex-col h-full ${
        isSelected ? 'ring-2 ring-primary-600/40 shadow-ambient' : ''
      } ${canInteract ? 'cursor-pointer active:scale-[0.98] transition-transform duration-200 ease-spring' : ''} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={handleClick}
      disabled={!canInteract}
    >
      <div className="w-full h-44 bg-surface-container-high rounded-xl mb-4 overflow-hidden flex items-center justify-center shadow-ambient-sm">
        <img
          src={getCoverImageUrl()}
          alt={story.title || 'Book cover'}
          className="w-full h-full object-cover pointer-events-none"
          onError={() => setImageLoadError(true)}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {story.readingLevel && (
          <span className={`badge ${getLevelColor(story.readingLevel)} text-xs capitalize`}>
            {story.readingLevel}
          </span>
        )}

        <span
          className={`badge text-xs ${
            isGoogleBook
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isGoogleBook ? 'Google Book' : 'Library Book'}
        </span>

        {hasGooglePreview && (
          <span className="badge bg-indigo-100 text-indigo-800 text-xs flex items-center gap-1">
            <ExternalLink size={12} />
            Preview
          </span>
        )}
      </div>

      <h3 className="font-headline font-semibold text-on-surface line-clamp-2 mb-1">
        {story.title || 'Untitled'}
      </h3>

      <p className="text-sm text-on-surface-variant mb-3">
        {story.author || 'Unknown Author'}
      </p>

      {story.description && (
        <p className="text-xs text-on-surface-variant/90 line-clamp-3 mb-3">
          {story.description}
        </p>
      )}

      <div className="mt-auto pt-3 space-y-2 text-xs text-on-surface-variant rounded-xl bg-surface-container-low px-3 py-3 -mx-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 min-w-0">
            <BookOpen size={14} />
            <span className="truncate">
              {pageCount
                ? `${pageCount} pages`
                : isGoogleBook
                ? 'Pages not available'
                : 'Manual story'}
            </span>
          </div>

          <div className="flex items-center gap-1 min-w-0">
            <Users size={14} />
            <span className="truncate">{getAgeGroupLabel(story.ageGroup)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-on-surface-variant/80">
            {hasGooglePreview
              ? 'Click to open preview'
              : isGoogleBook
              ? 'No preview link available'
              : 'Click to read story'}
          </span>

          {!hasGooglePreview && !isGoogleBook && (
            <span className="text-[11px] inline-flex items-center gap-1 text-on-surface-variant">
              <FileText size={12} />
              Manual entry
            </span>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-3 right-3 w-7 h-7 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm shadow-ambient-sm ring-2 ring-white/90">
          ✓
        </div>
      )}
    </button>
  );
};

export default StoryCard;