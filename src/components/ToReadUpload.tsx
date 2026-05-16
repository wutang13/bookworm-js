import { useState, type ChangeEvent } from 'react';
import Papa from 'papaparse';
import type { CSVFormat, Book } from '../types';

interface ToReadUploadProps {
  onSuccess: (books: Book[], fileName: string, format: CSVFormat) => void;
  isCollapsed: boolean;
  onExpand: () => void;
  fileName: string;
  bookCount: number;
}

export function ToReadUpload({ onSuccess, isCollapsed, onExpand, fileName, bookCount }: ToReadUploadProps) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <i className="ti ti-check" style={{ color: 'var(--success)', fontSize: '16px' }} aria-hidden="true"></i>
        <span style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--success)', fontFamily: "'Lora', serif" }}>
          {fileName} — {bookCount} books
        </span>
        <button 
          onClick={onExpand} 
          className="bw-remove" 
          title="Upload new file"
          style={{ marginLeft: 'auto', fontSize: '14px' }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bw-upload-zone">
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
        <div className="bw-upload-icon">
          <i className="ti ti-file-text" aria-hidden="true"></i>
        </div>
        <p className="bw-upload-text">Drop your exported reading list here, or click to browse</p>
        <p className="bw-upload-formats">StoryGraph · Goodreads</p>
      </div>
      {file && format === 'Unknown' && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <p style={{ color: 'var(--error)', fontSize: '12px', fontStyle: 'italic' }}>
            Error: The exported library must be from either StoryGraph or Goodreads.
          </p>
        </div>
      )}
    </>
  );
}
