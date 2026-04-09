import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/common/Navbar';
import GoogleBookCard from '../../../components/storyLibrary/GoogleBookCard';
import StoryService from '../../../services/storyService';
import toast from 'react-hot-toast';
import { Story } from '../../../types';

interface GoogleBook {
  googleBookId: string;
  title: string;
  author: string;
  description?: string;
  coverImage?: string;
  previewLink?: string;
}

const GoogleBooksImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [importedGoogleBookIds, setImportedGoogleBookIds] = useState<string[]>([]);

  const importedSet = useMemo(
    () => new Set(importedGoogleBookIds),
    [importedGoogleBookIds]
  );

  const loadImportedBooks = async () => {
    try {
      const response = await StoryService.getStories(1, 200, {
        source: 'google',
      });

      const ids = (response.stories || [])
        .map((story: Story) => story.googleBookId)
        .filter((id): id is string => Boolean(id && id.trim()));

      setImportedGoogleBookIds(ids);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadImportedBooks();
  }, []);

  const searchBooks = async () => {
    if (!query.trim()) {
      toast.error('Enter a search term');
      return;
    }

    try {
      setLoading(true);
      const results = await StoryService.searchGoogle(query.trim());
      setBooks(results || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to search books');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (
    googleBookId: string,
    config: {
      ageGroup: string;
      genres: string[];
      readingLevel: string;
    }
  ) => {
    if (importedSet.has(googleBookId)) {
      toast('This book is already imported');
      return;
    }

    try {
      await StoryService.importFromGoogle(googleBookId, config);
      toast.success('Book imported successfully');

      setImportedGoogleBookIds((prev) =>
        prev.includes(googleBookId) ? prev : [...prev, googleBookId]
      );
    } catch (error: any) {
      console.error(error);

      const message = error?.response?.data?.message || 'Import failed';

      if (
        typeof message === 'string' &&
        message.toLowerCase().includes('already been imported')
      ) {
        toast('This book is already imported');
        setImportedGoogleBookIds((prev) =>
          prev.includes(googleBookId) ? prev : [...prev, googleBookId]
        );
        return;
      }

      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Import from Google Books" />

      <div className="container-responsive py-8">
        <div className="flex items-center justify-between mb-6 gap-3 flex-col sm:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Google Books Import
            </h1>
            <p className="text-gray-600">
              Search Google Books and import selected titles into your story library.
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/stories')}
            className="btn-secondary"
            type="button"
          >
            Back to Story Library
          </button>
        </div>

        <div className="card mb-6">
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="text"
              placeholder="Search books by title or author..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchBooks();
              }}
              className="input-base flex-1"
            />

            <button onClick={searchBooks} className="btn-primary" type="button">
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-10">
            <p className="text-gray-600">Searching Google Books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-600">
              Search for a book to start importing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {books.map((book) => (
              <GoogleBookCard
                key={book.googleBookId}
                book={book}
                isImported={importedSet.has(book.googleBookId)}
                onAlreadyImported={() => toast('This book is already imported')}
                onImport={handleImport}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleBooksImportPage;