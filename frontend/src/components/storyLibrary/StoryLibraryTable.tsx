import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Story } from '../../types';

interface StoryLibraryTableProps {
  stories: Story[];
  isLoading: boolean;
  syncingStoryId?: string | null;
  onEdit: (story: Story) => void;
  onDelete: (storyId: string) => void;
  onSync: (storyId: string) => void;
}

const StoryLibraryTable: React.FC<StoryLibraryTableProps> = ({
  stories,
  isLoading,
  syncingStoryId = null,
  onEdit,
  onDelete,
  onSync,
}) => {
  if (isLoading) {
    return <p className="text-gray-600">Loading stories...</p>;
  }

  if (stories.length === 0) {
    return <p className="text-gray-600">No stories found.</p>;
  }

  return (
    <div className="space-y-3">
      {stories.map((story) => {
        const isGoogleStory = story.source === 'google';
        const isSyncing = syncingStoryId === story.id;

        return (
          <div
            key={story.id}
            className="rounded-lg border border-gray-200 p-4 flex flex-col gap-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
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

                  <span
                    className={`badge capitalize ${
                      isGoogleStory
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {story.source}
                  </span>

                  <span className="badge bg-emerald-100 text-emerald-800">
                    {story.pageCount && story.pageCount > 0
                      ? `${story.pageCount} pages`
                      : 'Pages N/A'}
                  </span>

                  {story.previewLink ? (
                    <span className="badge bg-indigo-100 text-indigo-800">
                      Preview available
                    </span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-500">
                      No preview
                    </span>
                  )}
                </div>

                {story.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {story.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {isGoogleStory && (
                  <button
                    className="btn-secondary inline-flex items-center gap-2"
                    onClick={() => onSync(story.id)}
                    disabled={isSyncing}
                    type="button"
                  >
                    <RefreshCw
                      size={16}
                      className={isSyncing ? 'animate-spin' : ''}
                    />
                    {isSyncing ? 'Syncing...' : 'Sync Metadata'}
                  </button>
                )}

                <button
                  className="btn-secondary"
                  onClick={() => onEdit(story)}
                  type="button"
                >
                  Edit
                </button>

                <button
                  className="btn-danger"
                  onClick={() => onDelete(story.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StoryLibraryTable;