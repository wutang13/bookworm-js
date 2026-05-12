import { useState, useMemo } from 'react';
import type { Book } from '../types';

interface ToReadTableProps {
  books: Book[];
}

export function ToReadTable({ books }: ToReadTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Book | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });

  const requestSort = (key: keyof Book) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const getSortIcon = (key: keyof Book) => {
    if (sortConfig.key !== key) return '↕';
    if (sortConfig.direction === 'asc') return '↑';
    if (sortConfig.direction === 'desc') return '↓';
    return '↕';
  };

  const sortedBooks = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return books;
    }

    return [...books].sort((a, b) => {
      let aValue = a[sortConfig.key!];
      let bValue = b[sortConfig.key!];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [books, sortConfig]);

  return (
    <> {books.length > 0 ? (
      <div className="results">
        <h2>To Read List</h2>
        <table className="book-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('title')} style={{ cursor: 'pointer' }}>
                Title {getSortIcon('title')}
              </th>
              <th onClick={() => requestSort('author')} style={{ cursor: 'pointer' }}>
                Author {getSortIcon('author')}
              </th>
              <th onClick={() => requestSort('ebook_wait')} style={{ cursor: 'pointer' }}>
                Ebook Wait {getSortIcon('ebook_wait')}
              </th>
              <th onClick={() => requestSort('audiobook_wait')} style={{ cursor: 'pointer' }}>
                Audiobook Wait {getSortIcon('audiobook_wait')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBooks.map((book, index) => (
              <tr key={index}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>
                  {book.ebook_wait === undefined ? '-' : (book.ebook_wait === 9999 ? 'N/A' : (book.ebook_wait === 0 ? 'Available' : `${book.ebook_wait} days`))}
                </td>
                <td>
                  {book.audiobook_wait === undefined ? '-' : (book.audiobook_wait === 9999 ? 'N/A' : (book.audiobook_wait === 0 ? 'Available' : `${book.audiobook_wait} days`))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>) : <div className="empty-results"> No books found in provided file.</div>}
    </>
  );
}
