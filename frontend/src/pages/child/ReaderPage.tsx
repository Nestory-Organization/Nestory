import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import StoryService from '../../services/storyService';
import AssignmentService from '../../services/assignmentService';
import { useAuth } from '../../contexts/AuthContext';
import { Story } from '../../types';

interface GoogleBooksEmbedProps {
  googleBookId: string;
}

const GoogleBooksEmbed: React.FC<GoogleBooksEmbedProps> = ({ googleBookId }) => {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      <div
        style={{
          width: '100%',
          height: '600px',
          border: 'none',
        }}
        dangerouslySetInnerHTML={{
          __html: `
            <iframe 
              src="https://books.google.com/books?id=${googleBookId}&pg=PA1&output=embed" 
              width="100%" 
              height="100%" 
              frameborder="0" 
              style="border: none;">
            </iframe>
          `,
        }}
      />
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-nestory-600 font-semibold">Loading your story...</p>
    </div>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
      <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <span className="text-red-600 text-2xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      <button
        onClick={() => window.history.back()}
        className="btn btn-primary"
      >
        Go Back
      </button>
    </div>
  </div>
);

const ReaderPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStory = async () => {
      if (!storyId) {
        setError('Story ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const storyData = await StoryService.getStoryById(storyId);

        if (user?.role === 'child') {
          const assignments = await AssignmentService.getMyAssignments().catch(() => []);
          const sid = String(storyId);
          const allowed = assignments.some(
            (a) =>
              a.status !== 'completed' &&
              sid === String(a.storyId || a.story?._id || a.story?.id || ''),
          );
          if (!allowed) {
            setStory(null);
            setError('This book is not assigned to you. Ask a parent to assign it before reading.');
            return;
          }
        }

        setStory(storyData);
        setError(null);
      } catch (err: unknown) {
        const errorMessage =
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Failed to load the story. Please try again.';

        setError(errorMessage || 'Failed to load the story.');
        toast.error('Story loading failed');
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId, user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !story) {
    return <ErrorDisplay message={error || 'Story not found'} />;
  }

  const hasGoogleBooks = story.googleBookId && story.googleBookId.trim();
  const hasPreviewLink = story.previewLink && story.previewLink.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-responsive py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-nestory-600 hover:text-nestory-700 transition-colors font-medium"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{story.title}</h1>
            <p className="text-sm text-gray-600 truncate">{story.author}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-responsive py-8">
        {/* Story Metadata Card - Visible on smaller screens */}
        <div className="lg:hidden mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex gap-4 mb-4">
            <img
              src={story.coverImage}
              alt={story.title}
              className="w-24 h-32 object-cover rounded-lg shadow-md flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 mb-2">{story.title}</h2>
              <p className="text-sm text-gray-600 mb-3">{story.author}</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Age Group:</span> {story.ageGroup}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Level:</span> {story.readingLevel}
                </p>
                {story.genres && story.genres.length > 0 && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Genres:</span> {story.genres.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {story.description && (
            <div className="mb-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700">{story.description}</p>
            </div>
          )}

          {/* Action Buttons - Mobile */}
          {hasGoogleBooks && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-900 mb-3">
                📖 This story is available from Google Books
              </p>
              <a
                href={`https://books.google.com/books?id=${story.googleBookId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center gap-2"
              >
                Open on Google Books
                <ExternalLink size={16} />
              </a>
            </div>
          )}

          {!hasGoogleBooks && hasPreviewLink && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-900 mb-3">
                📚 Preview available
              </p>
              <a
                href={story.previewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center gap-2"
              >
                View Preview
                <ExternalLink size={16} />
              </a>
            </div>
          )}

          {!hasGoogleBooks && !hasPreviewLink && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                ✨ This story's full readable content is not yet available in the app. Check back soon!
              </p>
            </div>
          )}
        </div>

        {/* Main Content - Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <img
                src={story.coverImage}
                alt={story.title}
                className="w-full rounded-lg shadow-md mb-4"
              />

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Book Info</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>
                      <span className="font-semibold">Age Group:</span>
                      <p className="capitalize">{story.ageGroup}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Reading Level:</span>
                      <p className="capitalize">{story.readingLevel}</p>
                    </div>
                    {story.genres && story.genres.length > 0 && (
                      <div>
                        <span className="font-semibold">Genres:</span>
                        <p>{story.genres.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {story.description && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                    <p className="text-sm text-gray-600">{story.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Reader Area - Desktop */}
          <div className="hidden lg:block lg:col-span-3">
            {hasGoogleBooks && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-nestory-500 to-blue-600 text-white p-6 mb-4">
                  <div className="flex items-center gap-3">
                    <BookOpen size={24} />
                    <div>
                      <h2 className="text-lg font-bold">Google Books Preview</h2>
                      <p className="text-blue-100">Read inside Google Books</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <GoogleBooksEmbed googleBookId={story.googleBookId} />
                </div>

                <div className="bg-blue-50 border-t border-blue-200 p-4 text-center">
                  <p className="text-sm text-blue-900 mb-3">Want to read more?</p>
                  <a
                    href={`https://books.google.com/books?id=${story.googleBookId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    Open Full Book on Google Books
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            )}

            {!hasGoogleBooks && hasPreviewLink && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 mb-4">
                  <div className="flex items-center gap-3">
                    <BookOpen size={24} />
                    <div>
                      <h2 className="text-lg font-bold">Book Preview</h2>
                      <p className="text-green-100">Sample pages available</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 text-center">
                  <p className="text-gray-700 mb-6">
                    A preview of this book is available. Click below to view sample pages.
                  </p>
                  <a
                    href={story.previewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    View Preview
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            )}

            {!hasGoogleBooks && !hasPreviewLink && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 mb-4">
                  <div className="flex items-center gap-3">
                    <BookOpen size={24} />
                    <div>
                      <h2 className="text-lg font-bold">Coming Soon</h2>
                      <p className="text-amber-100">Digital version not yet available</p>
                    </div>
                  </div>
                </div>

                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Full Content Not Yet Available</h3>
                  <p className="text-gray-600 mb-4">
                    We're working on making this story available to read in the app. Check back soon!
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 text-sm text-blue-900">
                    💡 In the meantime, you can ask your parent about borrowing this book from your local library.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReaderPage;
