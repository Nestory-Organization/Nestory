import React from 'react';
import { Story } from '../../types';

interface StoryLibraryTableProps {
  stories: Story[];
  isLoading: boolean;
  onEdit: (story: Story) => void;
  onDelete: (storyId: string) => void;
}

const StoryLibraryTable: React.FC<StoryLibraryTableProps> = ({
  stories,
  isLoading,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return <p className="text-gray-600">Loading stories...</p>;
  }

  if (stories.length === 0) {
    return <p className="text-gray-600">No stories found.</p>;
  }

  return (
    <div className="space-y-3">
      {stories.map((story) => (
        <div
          key={story.id}
          className="rounded-lg border border-gray-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{story.title}</p>
            <p className="text-sm text-gray-600">{story.author}</p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="badge bg-blue-100 text-blue-800 capitalize">
                {story.ageGroup}
              </span>
              <span className="badge bg-nestory-100 text-nestory-800 capitalize">
                {story.readingLevel}
              </span>
              <span className="badge bg-gray-100 text-gray-700">
                {story.genres?.join(', ') || 'No genres'}
              </span>
              <span className="badge bg-amber-100 text-amber-800 capitalize">
                {story.source}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => onEdit(story)}>
              Edit
            </button>
            <button className="btn-danger" onClick={() => onDelete(story.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoryLibraryTable;