import { useState } from 'react';
import type { Book } from '../types';

interface ToReadTableProps {
  books: Book[];
  onClear: () => void;
  lastSearchTime?: string | null;
}

export function ToReadTable({ books, onClear, lastSearchTime }: ToReadTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Book | null; direction: 'asc' | 'desc' | null }>({
    key: 'ebook_wait',
    direction: 'asc',
  });

  const sortBooks = () => {
    const key = sortConfig.key;
    const direction = sortConfig.direction;

    if (!key || !direction) {
      return books;
    }

    return [...books].sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;

      const key = sortConfig.key;

      if (key === 'ebook_wait' || key === 'audiobook_wait' || key === 'title' || key === 'author') {
        aValue = a[key];
        bValue = b[key];
      }

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const renderBadge = (days?: number, itemId?: string, searchKey?: string) => {
    if (days === undefined || days === 9999) {
      return <span className="bw-avail-badge na">N/A</span>;
    }

    let badgeClass = 'long';
    let text = `${days} days`;

    if (days === 0) {
      badgeClass = 'available';
      text = 'Ready';
    } else if (days <= 14) {
      badgeClass = 'short';
    }

    const badgeSpan = <span className={`bw-avail-badge ${badgeClass}`}>{text}</span>;

    if (itemId && searchKey) {
      return (
        <a
          href={`https://libbyapp.com/search/${searchKey}/search/query-1/page-1/${itemId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bw-avail-link"
          title="Open in Libby"
        >
          <span className={`bw-avail-badge ${badgeClass}`}>
            {text} <i className="ti ti-arrow-up-right bw-avail-arrow" aria-hidden="true"></i>
          </span>
        </a>
      );
    }

    return badgeSpan;
  };

  if (books.length === 0) {
    return (
      <div className="bw-empty-table">
        Please upload your to-read list from The StoryGraph or Goodreads in the sidebar to see the books here.
      </div>
    );
  }

  return (
    <>
      <div className="bw-results-header">
        <div className="bw-results-title-container">
          <h2 className="bw-results-title">Results — {books.length} books</h2>
          {lastSearchTime && (
            <div className="bw-last-search">
              Last searched: {lastSearchTime}
            </div>
          )}
        </div>
        <div className="bw-results-actions">
          <button onClick={onClear} className="bw-clear-btn">Clear All</button>
          <div className="bw-sort-row">
            Sort:
            <button 
              className={`bw-sort-btn ${sortConfig.key === 'ebook_wait' ? 'active' : ''}`}
              onClick={() => setSortConfig({ key: 'ebook_wait', direction: 'asc' })}
            >
              Ebook
            </button>
            <button 
              className={`bw-sort-btn ${sortConfig.key === 'audiobook_wait' ? 'active' : ''}`}
              onClick={() => setSortConfig({ key: 'audiobook_wait', direction: 'asc' })}
            >
              Audio
            </button>
            <button 
              className={`bw-sort-btn ${sortConfig.key === 'title' ? 'active' : ''}`}
              onClick={() => setSortConfig({ key: 'title', direction: 'asc' })}
            >
              Title
            </button>
            <button 
              className={`bw-sort-btn ${sortConfig.key === 'author' ? 'active' : ''}`}
              onClick={() => setSortConfig({ key: 'author', direction: 'asc' })}
            >
              Author
            </button>
          </div>
        </div>
      </div>

      <div className="bw-card-list">
        {sortBooks().map((book, index) => (
          <div key={index} className="bw-book-card">
            <div className="bw-book-info">
              <p className="bw-book-title">{book.title}</p>
              <p className="bw-book-author">{book.author}</p>
            </div>
            <div className="bw-avail">
              <span className="bw-avail-label">Ebook</span>
              {renderBadge(book.ebook_wait, book.ebook_id, book.ebook_library)}
            </div>
            <div className="bw-avail">
              <span className="bw-avail-label">Audio</span>
              {renderBadge(book.audiobook_wait, book.audiobook_id, book.audiobook_library)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
