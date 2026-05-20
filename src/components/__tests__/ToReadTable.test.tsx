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
});
