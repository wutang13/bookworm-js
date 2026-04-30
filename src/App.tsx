import { useState, useEffect, type ChangeEvent } from 'react';
import Papa from 'papaparse';
import './App.css';

type CSVFormat = 'StoryGraph' | 'Goodreads' | 'Unknown';

interface Book {
  title: string;
  author: string;
}

interface LibraryBranch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  regionCode?: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<CSVFormat>('Unknown');
  const [books, setBooks] = useState<Book[]>([]);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  // Library search state
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryResults, setLibraryResults] = useState<LibraryBranch[]>([]);
  const [selectedLibraries, setSelectedLibraries] = useState<LibraryBranch[]>([]);

  useEffect(() => {
    const fetchLibraries = async () => {
      if (libraryQuery.length < 3) {
        setLibraryResults([]);
        return;
      }

      try {
        const response = await fetch(`https://locate.libbyapp.com/autocomplete/${encodeURIComponent(libraryQuery)}`);
        const data = await response.json();
        // The API returns an array of results. We take the top 3.
        // Adjusting based on common autocomplete API structures (assuming [{id, name, ...}, ...])
        const results = (data.branches as LibraryBranch[]).slice(0, 3);
        setLibraryResults(results);
      } catch (error) {
        console.error('Error fetching libraries:', error);
      }
    };

    const timeoutId = setTimeout(fetchLibraries, 1000); // Debounce API calls by 1 second
    return () => clearTimeout(timeoutId);
  }, [libraryQuery]);

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

  const addLibrary = (library: LibraryBranch) => {
    if (!selectedLibraries.find(l => l.id === library.id)) {
      setSelectedLibraries([...selectedLibraries, library]);
    }
    setLibraryQuery('');
    setLibraryResults([]);
  };

  const removeLibrary = (id: string) => {
    setSelectedLibraries(selectedLibraries.filter(l => l.id !== id));
  };

  return (
    <main className="container">
      <h1>Bookworm</h1>

      <section className="library-search-section">
        <h2>Find Your Library</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for your library (e.g. San Francisco Public Library)"
            value={libraryQuery}
            onChange={(e) => setLibraryQuery(e.target.value)}
            className="search-input"
          />
          {libraryResults.length > 0 && (
            <ul className="autocomplete-results">
              {libraryResults.map((lib) => (
                <li key={lib.id} onClick={() => addLibrary(lib)}>
                  <strong>{lib.name}</strong>
                  {lib.address && <span className="lib-address">{lib.address + ', ' + lib.city + ', ' + lib.regionCode}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedLibraries.length > 0 && (
          <div className="selected-libraries">
            <h3>My Libraries</h3>
            <ul>
              {selectedLibraries.map((lib) => (
                <li key={lib.id} className="library-chip">
                  {lib.name}
                  <button onClick={() => removeLibrary(lib.id)} className="remove-lib">×</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

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
