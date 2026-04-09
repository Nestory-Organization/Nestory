import React, { useState } from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';

interface GoogleBook {
  googleBookId: string;
  title: string;
  author: string;
  description?: string;
  coverImage?: string;
  previewLink?: string;
  pageCount?: number;
}

interface Props {
  book: GoogleBook;
  isImported?: boolean;
  onAlreadyImported?: () => void;
  onImport: (
    googleBookId: string,
    config: {
      ageGroup: string;
      genres: string[];
      readingLevel: string;
    }
  ) => Promise<void>;
}

const GoogleBookCard: React.FC<Props> = ({
  book,
  isImported = false,
  onAlreadyImported,
  onImport,
}) => {
  const [ageGroup, setAgeGroup] = useState('middle-grade');
  const [readingLevel, setReadingLevel] = useState('intermediate');
  const [genres, setGenres] = useState('General');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (isImported) {
      onAlreadyImported?.();
      return;
    }

    const parsedGenres = genres
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!ageGroup || parsedGenres.length === 0) return;

    try {
      setIsImporting(true);
      await onImport(book.googleBookId, {
        ageGroup,
        genres: parsedGenres,
        readingLevel,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="card p-4 flex flex-col h-full">
      <img
        src={book.coverImage || 'https://via.placeholder.com/150'}
        alt={book.title}
        className="w-full h-44 object-cover rounded mb-3"
      />

      <h3 className="font-bold text-gray-900 line-clamp-2">{book.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{book.author}</p>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <BookOpen size={14} />
        <span>
          {book.pageCount && book.pageCount > 0
            ? `${book.pageCount} pages`
            : 'Pages not available'}
        </span>
      </div>

      <p className="text-xs text-gray-500 line-clamp-3 mb-4">
        {book.description || 'No description available'}
      </p>

      <div className="space-y-3 mt-auto">
        <select
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
          className="input-base"
          disabled={isImported}
        >
          <option value="toddler">Toddler</option>
          <option value="early-reader">Early Reader</option>
          <option value="middle-grade">Middle Grade</option>
          <option value="young-adult">Young Adult</option>
        </select>

        <select
          value={readingLevel}
          onChange={(e) => setReadingLevel(e.target.value)}
          className="input-base"
          disabled={isImported}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <input
          type="text"
          value={genres}
          onChange={(e) => setGenres(e.target.value)}
          placeholder="Genres, comma separated"
          className="input-base"
          disabled={isImported}
        />

        <div className="flex items-center justify-between gap-2 pt-2">
          {book.previewLink ? (
            <a
              href={book.previewLink}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 flex items-center gap-1 text-sm"
            >
              <ExternalLink size={14} />
              Preview
            </a>
          ) : (
            <span className="text-xs text-gray-400">No preview</span>
          )}

          <button
            onClick={handleImport}
            className={
              isImported
                ? 'px-4 py-2 rounded-lg text-sm font-medium bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'btn-primary text-sm'
            }
            disabled={isImporting}
            type="button"
          >
            {isImported ? 'Imported' : isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleBookCard;