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

  const renderBadge = (days?: number) => {
    if (days === undefined) return <span className="bw-avail-badge na">N/A</span>;
    if (days === 0) return <span className="bw-avail-badge available">Ready</span>;
    if (days <= 14) return <span className="bw-avail-badge short">{days} days</span>;
    if (days === 9999) return <span className="bw-avail-badge na">N/A</span>;
    return <span className="bw-avail-badge long">{days} days</span>;
  };

  if (books.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary)', fontStyle: 'italic' }}>
        Please upload your to-read list in the sidebar to see the books here.
      </div>
    );
  }

  return (
    <>
      <div className="bw-results-header">
        <div style={{ textAlign: 'left' }}>
          <h2 className="bw-results-title">Results — {books.length} books</h2>
          {lastSearchTime && (
            <div className="bw-last-search" style={{ fontSize: '11px', color: 'var(--secondary)', fontStyle: 'italic', marginTop: '2px', fontFamily: "'Courier Prime', monospace", textAlign: 'left' }}>
              Last searched: {lastSearchTime}
            </div>
          )}
        </div>
        <div className="bw-results-controls">
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
              {renderBadge(book.ebook_wait)}
            </div>
            <div className="bw-avail">
              <span className="bw-avail-label">Audio</span>
              {renderBadge(book.audiobook_wait)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
