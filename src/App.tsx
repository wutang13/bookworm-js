import { useState, type ChangeEvent, type SubmitEvent } from 'react';
import Papa from 'papaparse';
import './App.css';

type CSVFormat = 'StoryGraph' | 'Goodreads' | 'Unknown';

interface Book {
  title: string;
  author: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<CSVFormat>('Unknown');
  const [books, setBooks] = useState<Book[]>([]);

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
      setBooks([]);
      
      Papa.parse(selectedFile, {
        preview: 1, // Only parse the first line to detect format
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setFormat(detectFormat(results.data[0] as string[]));
          }
        },
        error: (error) => {
          console.error('Error detecting format:', error);
          setFormat('Unknown');
        }
      });
    }
  };

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (file && format !== 'Unknown') {
      Papa.parse(file, {
        header: true, // Use headers to create objects
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as Record<string, string>[];
          const filteredBooks: Book[] = [];

          if (format === 'Goodreads') {
            rows.forEach(row => {
              if (row['Exclusive Shelf'] === 'to-read') {
                const rawTitle = row['Title'] || '';
                filteredBooks.push({
                  title: rawTitle.replace(/\s*\(.*\)$/, ''),
                  author: row['Author']
                });
              }
            });
          } else if (format === 'StoryGraph') {
            rows.forEach(row => {
              if (row['Read Status'] === 'to-read') {
                filteredBooks.push({
                  title: row['Title'],
                  author: row['Authors']
                });
              }
            });
          }
          setBooks(filteredBooks);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Failed to parse CSV file.');
        }
      });
    } else if (file) {
      alert('The exported library must be from either StoryGraph or Goodreads.');
    } else {
      alert('Please select a CSV file first.');
    }
  };

  return (
    <main className="container">
      <h1>Bookworm</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="input-group">
          <label htmlFor="csv-upload">Select CSV File:</label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>
        <button 
          type="submit" 
          className="submit-button"
          disabled={!file || format === 'Unknown'}
        >
          Submit CSV
        </button>
      </form>
      {file && (
        <div className="file-info">
          <p>Selected: <strong>{file.name}</strong></p>
          <p>Detected Format: <span className={`format-badge ${format.toLowerCase()}`}>{format}</span></p>
          {format === 'Unknown' && (
            <p className="error-text">
              Error: The exported library must be from either StoryGraph or Goodreads.
            </p>
          )}
        </div>
      )}

      {books.length > 0 && (
        <div className="results">
          <h2>To Read List</h2>
          <table className="book-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, index) => (
                <tr key={index}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default App;
