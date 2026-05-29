import { render, screen, fireEvent } from '@testing-library/react';
import { ToReadTable } from '../ToReadTable';
import { describe, it, expect, vi } from 'vitest';
import type { Book } from '../../types';

describe('ToReadTable', () => {
  const mockBooks: Book[] = [
    { title: 'B Book', author: 'Author Z', ebook_wait: 10, audiobook_wait: 5 },
    { title: 'A Book', author: 'Author Y', ebook_wait: 5, audiobook_wait: 10 },
  ];

  it('renders books correctly', () => {
    render(<ToReadTable books={mockBooks} onClear={vi.fn()} />);
    expect(screen.getByText('A Book')).toBeInTheDocument();
    expect(screen.getByText('B Book')).toBeInTheDocument();
  });

  it('sorts books by title', () => {
    const { container } = render(<ToReadTable books={mockBooks} onClear={vi.fn()} />);
    
    const sortTitleBtn = screen.getByRole('button', { name: /Title/i });
    fireEvent.click(sortTitleBtn);

    const bookTitles = container.querySelectorAll('.bw-book-title');
    expect(bookTitles[0].textContent).toBe('A Book');
    expect(bookTitles[1].textContent).toBe('B Book');
  });

  it('sorts books by ebook wait time', () => {
    const { container } = render(<ToReadTable books={mockBooks} onClear={vi.fn()} />);
    
    const sortEbookBtn = screen.getByRole('button', { name: /Ebook/i });
    fireEvent.click(sortEbookBtn);

    const bookTitles = container.querySelectorAll('.bw-book-title');
    expect(bookTitles[0].textContent).toBe('A Book'); // 5 days
    expect(bookTitles[1].textContent).toBe('B Book'); // 10 days
  });

  it('renders clickable badges when wait times and Libby info are defined', () => {
    const booksWithLibby: Book[] = [
      {
        title: 'Clickable Book',
        author: 'Author Libby',
        ebook_wait: 5,
        ebook_id: '12345',
        ebook_library: 'mylib',
        audiobook_wait: 0,
        audiobook_id: '67890',
        audiobook_library: 'mylib',
      }
    ];

    render(<ToReadTable books={booksWithLibby} onClear={vi.fn()} />);

    // Ebook wait badge: "5 days" clickable
    const ebookLink = screen.getByRole('link', { name: /5 days/i });
    expect(ebookLink).toBeInTheDocument();
    expect(ebookLink).toHaveAttribute('href', 'https://libbyapp.com/search/mylib/search/query-1/page-1/12345');

    // Audiobook wait badge: "Ready" clickable
    const audiobookLink = screen.getByRole('link', { name: /Ready/i });
    expect(audiobookLink).toBeInTheDocument();
    expect(audiobookLink).toHaveAttribute('href', 'https://libbyapp.com/search/mylib/search/query-1/page-1/67890');
  });

  it('renders non-clickable badges when wait time is undefined or N/A (9999)', () => {
    const booksWithNa: Book[] = [
      {
        title: 'NA Book',
        author: 'Author NA',
        ebook_wait: 9999,
        ebook_id: '12345',
        ebook_library: 'mylib',
        audiobook_wait: undefined,
        audiobook_id: '67890',
        audiobook_library: 'mylib',
      }
    ];

    render(<ToReadTable books={booksWithNa} onClear={vi.fn()} />);

    // None of the badges should be wrapped in links because wait time is N/A or undefined
    const links = screen.queryAllByRole('link');
    expect(links.length).toBe(0);

    const naBadges = screen.getAllByText('N/A');
    expect(naBadges.length).toBe(2);
  });
});
