import { render, fireEvent, waitFor } from '@testing-library/react';
import { ToReadUpload } from '../ToReadUpload';
import { describe, it, expect, vi } from 'vitest';

describe('ToReadUpload', () => {
  const mockOnSuccess = vi.fn();

  it('detects StoryGraph format and parses correctly', async () => {
    render(
      <ToReadUpload 
        onSuccess={mockOnSuccess} 
        isCollapsed={false} 
        onExpand={() => {}} 
        fileName="" 
        bookCount={0} 
      />
    );

    const csvContent = 'Title,Authors,Read Status\n"Project Hail Mary","Andy Weir","to-read"\n"Dark Matter","Blake Crouch","read"';
    const file = new File([csvContent], 'storygraph.csv', { type: 'text/csv' });
    
    // Note: The input is actually hidden but the label/zone is clickable. 
    // In the component it's: <input id="csv-upload" type="file" ... />
    // But it's styled with opacity 0.
    const hiddenInput = document.getElementById('csv-upload') as HTMLInputElement;
    
    fireEvent.change(hiddenInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        [{ title: 'Project Hail Mary', author: 'Andy Weir' }],
        'storygraph.csv',
        'StoryGraph'
      );
    });
  });

  it('detects Goodreads format and parses correctly', async () => {
    render(
      <ToReadUpload 
        onSuccess={mockOnSuccess} 
        isCollapsed={false} 
        onExpand={() => {}} 
        fileName="" 
        bookCount={0} 
      />
    );

    const csvContent = 'Title,Author,Exclusive Shelf\n"The Martian","Andy Weir","to-read"\n"Foundation","Isaac Asimov","read"';
    const file = new File([csvContent], 'goodreads.csv', { type: 'text/csv' });
    
    const hiddenInput = document.getElementById('csv-upload') as HTMLInputElement;
    fireEvent.change(hiddenInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        [{ title: 'The Martian', author: 'Andy Weir' }],
        'goodreads.csv',
        'Goodreads'
      );
    });
  });
});
