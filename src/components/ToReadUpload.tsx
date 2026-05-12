import { useState, type ChangeEvent } from 'react';
import Papa from 'papaparse';
import type { CSVFormat, Book } from '../types';

interface ToReadUploadProps {
  onSuccess: (books: Book[], fileName: string, format: CSVFormat) => void;
  isCollapsed: boolean;
  onExpand: () => void;
  fileName: string;
}

export function ToReadUpload({ onSuccess, isCollapsed, onExpand, fileName }: ToReadUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<CSVFormat>('Unknown');

  const detectFormat = (headers: string[]) => {
    const isStoryGraph = ['Title', 'Authors', 'Read Status'].every(h => headers.includes(h));
    const isGoodreads = ['Title', 'Author', 'Exclusive Shelf'].every(h => headers.includes(h));

    if (isStoryGraph) return 'StoryGraph';
    if (isGoodreads) return 'Goodreads';
    return 'Unknown';
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const detectedFormat = detectFormat(headers);
          setFormat(detectedFormat);

          if (detectedFormat !== 'Unknown') {
            const rows = results.data as Record<string, string>[];
            const filteredBooks: Book[] = [];

            if (detectedFormat === 'Goodreads') {
              rows.forEach(row => {
                if (row['Exclusive Shelf'] === 'to-read') {
                  const rawTitle = row['Title'] || '';
                  filteredBooks.push({
                    title: rawTitle.replace(/\s*\(.*\)$/, ''),
                    author: row['Author']
                  });
                }
              });
            } else if (detectedFormat === 'StoryGraph') {
              rows.forEach(row => {
                if (row['Read Status'] === 'to-read') {
                  filteredBooks.push({
                    title: row['Title'],
                    author: row['Authors']
                  });
                }
              });
            }
            onSuccess(filteredBooks, selectedFile.name, detectedFormat);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Failed to parse CSV file.');
          setFormat('Unknown');
        }
      });
    }
  };

  if (isCollapsed) {
    return (
      <div className="collapsed-header">
        <p>Showing results for: <strong>{fileName}</strong></p>
        <button 
          onClick={onExpand}
          className="expand-button"
          aria-label="Expand upload form"
        >
          ↓
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="upload-form">
        <div className="input-group">
          <label htmlFor="csv-upload">Select CSV File:</label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>
      </div>
      {file && format === 'Unknown' && (
        <div className="file-info">
          <p>Selected: <strong>{file.name}</strong></p>
          <p>Detected Format: <span className={`format-badge ${format.toLowerCase()}`}>{format}</span></p>
          <p className="error-text">
            Error: The exported library must be from either StoryGraph or Goodreads.
          </p>
        </div>
      )}
    </>
  );
}
