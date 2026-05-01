import { useState, useEffect, type ChangeEvent } from 'react';
import Papa from 'papaparse';
import * as fuzzball from 'fuzzball';
import './App.css';

type CSVFormat = 'StoryGraph' | 'Goodreads' | 'Unknown';

interface Book {
  title: string;
  author: string;
  ebook_wait?: number;
  audiobook_wait?: number;
}

interface LibraryBranch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  regionCode?: string;
  websiteId?: string;
  searchKey?: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<CSVFormat>('Unknown');
  const [books, setBooks] = useState<Book[]>([]);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 });

  // Library search state
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryResults, setLibraryResults] = useState<LibraryBranch[]>([]);
  const [selectedLibraries, setSelectedLibraries] = useState<LibraryBranch[]>(() => {
    const saved = localStorage.getItem('selectedLibraries');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('selectedLibraries', JSON.stringify(selectedLibraries));
  }, [selectedLibraries]);

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
        // Adjusting based on common autocomplete API structures
        interface RawBranch extends LibraryBranch {
          systems?: Array<{ websiteId: string }>;
        }
        const results = (data.branches as RawBranch[]).slice(0, 3).map((branch) => ({
          ...branch,
          websiteId: branch.systems?.[0]?.websiteId
        }));
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

  const addLibrary = async (library: LibraryBranch) => {
    if (!selectedLibraries.find(l => l.id === library.id)) {
      let searchKey = '';
      if (library.websiteId) {
        try {
          const response = await fetch(`https://thunder.api.overdrive.com/v2/libraries/?websiteIds=${library.websiteId}&x-client-id=dewey`);
          const data = await response.json();
          searchKey = data.items?.[0]?.id || '';
        } catch (error) {
          console.error('Error fetching searchKey:', error);
        }
      }
      setSelectedLibraries([...selectedLibraries, { ...library, searchKey }]);
    }
    setLibraryQuery('');
    setLibraryResults([]);
  };

  const removeLibrary = (id: string) => {
    setSelectedLibraries(selectedLibraries.filter(l => l.id !== id));
  };

  const handleSearch = async () => {
    if (selectedLibraries.length === 0 || books.length === 0) return;
    setIsSearching(true);
    setSearchProgress({ current: 0, total: books.length * selectedLibraries.length });

    const updatedBooks = books.map(book => ({
      ...book,
      ebook_wait: book.ebook_wait ?? 9999,
      audiobook_wait: book.audiobook_wait ?? 9999,
    }));

    let progressCount = 0;
    for (const library of selectedLibraries) {
      if (!library.searchKey) {
        progressCount += books.length;
        setSearchProgress(prev => ({ ...prev, current: progressCount }));
        continue;
      }

      for (let i = 0; i < updatedBooks.length; i++) {
        const book = updatedBooks[i];

        // Progress update
        progressCount++;
        setSearchProgress(prev => ({ ...prev, current: progressCount }));

        // Early exit if both formats are already available
        if (book.ebook_wait === 0 && book.audiobook_wait === 0) {
          continue;
        }

        const query = `${book.title} by ${book.author}`;
        const url = `https://thunder.api.overdrive.com/v2/libraries/${library.searchKey}/media`;
        const params = new URLSearchParams({
          query: query,
          format: "ebook-overdrive,ebook-media-do,ebook-overdrive-provisional,audiobook-overdrive,audiobook-overdrive-provisional,magazine-overdrive",
          perPage: "5",
          page: "1",
          truncateDescription: "false",
          includedFacets: "availability,mediaTypes,formats,maturityLevels,subjects,languages,boolean,addedDates,audiobookDuration,freshStart",
          "x-client-id": "dewey"
        });

        try {
          const response = await fetch(`${url}?${params.toString()}`);
          if (!response.ok) continue;
          const data = await response.json();

          for (const item of (data.items || [])) {
            if (fuzzball.ratio(book.title.toLowerCase(), (item.title || "").toLowerCase()) < 70) {
              continue;
            }

            const mediaType = item.type?.id;
            const isAvailable = item.isAvailable;
            const waitDays = isAvailable ? 0 : (item.estimatedWaitDays || 0);

            if (mediaType === 'ebook') {
              updatedBooks[i].ebook_wait = Math.min(updatedBooks[i].ebook_wait!, waitDays);
            } else if (mediaType === 'audiobook') {
              updatedBooks[i].audiobook_wait = Math.min(updatedBooks[i].audiobook_wait!, waitDays);
            }
          }
        } catch (error) {
          console.error(`Error searching ${book.title} in ${library.name}:`, error);
        }
      }
    }

    // Sort by availability descending (lowest wait time first)
    updatedBooks.sort((a, b) => {
      const minA = Math.min(a.ebook_wait ?? 9999, a.audiobook_wait ?? 9999);
      const minB = Math.min(b.ebook_wait ?? 9999, b.audiobook_wait ?? 9999);
      return minA - minB;
    });

    setBooks(updatedBooks);
    setIsSearching(false);
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

        {books.length > 0 && selectedLibraries.length > 0 && (
          <div className="search-controls">
            <button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="search-libraries-button"
            >
              {isSearching ? 'Searching Libraries...' : 'Search Libraries for Availability'}
            </button>
            {isSearching && (
              <div className="search-progress">
                Searching {searchProgress.current} of {searchProgress.total} requests...
              </div>
            )}
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
                <th>Ebook Wait</th>
                <th>Audiobook Wait</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, index) => (
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
        </div>
      )}
    </main>
  );
}

export default App;
