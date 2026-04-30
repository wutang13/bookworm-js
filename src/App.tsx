import { useState, type ChangeEvent } from 'react';
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
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

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
            setBooks(filteredBooks);
            setIsFormCollapsed(true);
          } else {
            setBooks([]);
            setIsFormCollapsed(false);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Failed to parse CSV file.');
          setFormat('Unknown');
          setBooks([]);
        }
      });
    }
  };

  return (
    <main className="container">
      <h1>Bookworm</h1>

      {!isFormCollapsed ? (
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
      ) : (
        <div className="collapsed-header">
          <p>Showing results for: <strong>{file?.name}</strong></p>
          <button 
            onClick={() => setIsFormCollapsed(false)}
            className="expand-button"
            aria-label="Expand upload form"
          >
            ↓
          </button>
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

