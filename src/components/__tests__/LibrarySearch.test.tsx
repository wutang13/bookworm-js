import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LibrarySearch } from '../LibrarySearch';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('LibrarySearch', () => {
  const mockOnAddLibrary = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn();
  });

  it('searches for libraries when query is 3+ characters', async () => {
    const mockResponse = {
      branches: [
        { 
          id: '1', 
          name: 'Seattle Public Library', 
          address: '1000 4th Ave', 
          city: 'Seattle', 
          regionCode: 'WA',
          systems: [{ websiteId: '123' }]
        }
      ]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<LibrarySearch onAddLibrary={mockOnAddLibrary} />);

    const input = screen.getByPlaceholderText(/Search for a library…/i);
    fireEvent.change(input, { target: { value: 'Seattle' } });

    await waitFor(() => {
      expect(screen.getByText('Seattle Public Library')).toBeInTheDocument();
    }, { timeout: 2000 }); // Wait for debounce

    fireEvent.click(screen.getByText('Seattle Public Library'));

    expect(mockOnAddLibrary).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      name: 'Seattle Public Library',
      websiteId: '123'
    }));
  });
});
