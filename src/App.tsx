import { useState, useEffect, useRef } from 'react';
import * as fuzzball from 'fuzzball';
import './App.css';
import type { Book, LibraryBranch } from './types';
import { LibrarySearch } from './components/LibrarySearch';
import { SelectedLibraries } from './components/SelectedLibraries';
import { ToReadUpload } from './components/ToReadUpload';
import { ToReadTable } from './components/ToReadTable';

function App() {
  const [fileName, setFileName] = useState<string>(() => {
    return localStorage.getItem('search_fileName') || '';
  });
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('search_books');
    return saved ? JSON.parse(saved) : [];
  });
  const [isFormCollapsed, setIsFormCollapsed] = useState(() => {
    return !!localStorage.getItem('search_books');
  });
  const [isLibrariesCollapsed, setIsLibrariesCollapsed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const cancelSearchRef = useRef(false);
  const [lastSearchTime, setLastSearchTime] = useState<string | null>(() => {
    return localStorage.getItem('search_lastSearchTime');
  });

  const [selectedLibraries, setSelectedLibraries] = useState<LibraryBranch[]>(() => {
    const saved = localStorage.getItem('selectedLibraries');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('selectedLibraries', JSON.stringify(selectedLibraries));
  }, [selectedLibraries]);

  useEffect(() => {
    localStorage.setItem('search_books', JSON.stringify(books));
    if (fileName) {
      localStorage.setItem('search_fileName', fileName);
    }
  }, [books, fileName]);

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
  };

  const removeLibrary = (id: string) => {
    setSelectedLibraries(selectedLibraries.filter(l => l.id !== id));
  };

  const handleUploadSuccess = (newBooks: Book[], name: string) => {
    setBooks(newBooks);
    setFileName(name);
    setIsFormCollapsed(true);
  };

  const handleClearBooks = () => {
    setBooks(books.map(book => ({
      ...book,
      ebook_wait: undefined,
      audiobook_wait: undefined,
      ebook_id: undefined,
      audiobook_id: undefined,
      ebook_library: undefined,
      audiobook_library: undefined
    })));
    setLastSearchTime(null);
    localStorage.removeItem('search_lastSearchTime');
  };

  const handleSearch = async () => {
    if (selectedLibraries.length === 0 || books.length === 0) return;
    setIsSearching(true);
    cancelSearchRef.current = false;
    setSearchProgress({ current: 0, total: books.length * selectedLibraries.length });

    const updatedBooks: Book[] = books.map(book => ({
      ...book,
      ebook_wait: book.ebook_wait ?? 9999,
      audiobook_wait: book.audiobook_wait ?? 9999,
      ebook_id: undefined,
      audiobook_id: undefined,
      ebook_library: undefined,
      audiobook_library: undefined,
    }));

    let progressCount = 0;
    for (const library of selectedLibraries) {
      if (cancelSearchRef.current) break;

      if (!library.searchKey) {
        progressCount += books.length;
        setSearchProgress(prev => ({ ...prev, current: progressCount }));
        continue;
      }

      for (let i = 0; i < updatedBooks.length; i++) {
        if (cancelSearchRef.current) break;
        const book = updatedBooks[i];

        progressCount++;
        setSearchProgress(prev => ({ ...prev, current: progressCount }));

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

          if (cancelSearchRef.current) break;

          for (const item of (data.items || [])) {
            if (fuzzball.ratio(`${book.title} ${book.author}`, `${(item.title || "")} ${(item.firstCreatorName || "")}`) < 80) {
              continue;
            }

            const mediaType = item.type?.id;
            const isAvailable = item.isAvailable;
            const waitDays = isAvailable ? 0 : (item.estimatedWaitDays || 9999);

            if (mediaType === 'ebook') {
              if (waitDays < updatedBooks[i].ebook_wait!) {
                updatedBooks[i].ebook_wait = waitDays;
                updatedBooks[i].ebook_id = item.id;
                updatedBooks[i].ebook_library = library.searchKey;
              }
            } else if (mediaType === 'audiobook') {
              if (waitDays < updatedBooks[i].audiobook_wait!) {
                updatedBooks[i].audiobook_wait = waitDays;
                updatedBooks[i].audiobook_id = item.id;
                updatedBooks[i].audiobook_library = library.searchKey;
              }
            }
          }
        } catch (error) {
          console.error(`Error searching ${book.title} in ${library.name}:`, error);
        }
      }
    }

    updatedBooks.sort((a, b) => {
      const minA = Math.min(a.ebook_wait ?? 9999, a.audiobook_wait ?? 9999);
      const minB = Math.min(b.ebook_wait ?? 9999, b.audiobook_wait ?? 9999);
      return minA - minB;
    });

    setBooks(updatedBooks);
    setIsSearching(false);

    const timeStr = new Date().toLocaleString();
    setLastSearchTime(timeStr);
    localStorage.setItem('search_lastSearchTime', timeStr);
  };

  return (
    <div className={`bw-root ${isSidebarOpen ? 'sidebar-open' : ''}`}>

      <header className="bw-header">
        <button 
          className="bw-menu-toggle" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <i className={`ti ${isSidebarOpen ? 'ti-x' : 'ti-menu-2'}`}></i>
        </button>
        <h1 className="bw-logo">book<span>worm</span></h1>
        <p className="bw-tagline">Your library availability companion</p>
      </header>

      <div className="bw-main">
        <div 
          className={`bw-sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
        <aside className={`bw-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="bw-sidebar-header">
            <button 
              className="bw-sidebar-close" 
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <i className="ti ti-x"></i>
            </button>
          </div>
          <div>
            <p 
              className="bw-panel-label clickable" 
              onClick={() => setIsLibrariesCollapsed(!isLibrariesCollapsed)}
            >
              <i className="ti ti-building-library" aria-hidden="true"></i> 
              My Libraries {isLibrariesCollapsed && `(${selectedLibraries.length})`}
              <i 
                className={`ti ${isLibrariesCollapsed ? 'ti-chevron-right' : 'ti-chevron-down'} bw-chevron-icon`} 
              ></i>
            </p>
            {!isLibrariesCollapsed && (
              <>
                <LibrarySearch onAddLibrary={addLibrary} />
                <SelectedLibraries 
                  libraries={selectedLibraries} 
                  onRemoveLibrary={removeLibrary} 
                />
              </>
            )}
          </div>

          <div>
            <p className="bw-panel-label">
              <i className="ti ti-file-upload" aria-hidden="true"></i> To-Read List
            </p>
            <ToReadUpload 
              onSuccess={(books, name) => {
                handleUploadSuccess(books, name);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              isCollapsed={isFormCollapsed}
              onExpand={() => setIsFormCollapsed(false)}
              fileName={fileName}
              bookCount={books.length}
            />
          </div>
        </aside>

        <main className="bw-content">
          <ToReadTable books={books} onClear={handleClearBooks} lastSearchTime={lastSearchTime} />
        </main>
      </div>

      <button 
        className="bw-search-btn"
        onClick={() => {
          if (isSearching) {
            cancelSearchRef.current = true;
          } else {
            handleSearch();
          }
          if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        disabled={books.length === 0 || selectedLibraries.length === 0}
        title={
          isSearching 
            ? "Cancel search" 
            : books.length === 0 
              ? "Please upload a to-read list (StoryGraph or Goodreads CSV)" 
              : selectedLibraries.length === 0 
                ? "Please search for and add at least one library" 
                : "Search your libraries for book availability"
        }
      >
        <i className={`ti ${isSearching ? 'ti-x' : 'ti-books'}`} aria-hidden="true"></i>
        {isSearching ? 'Cancel Search' : 'Search Libraries'}
      </button>

      {isSearching && (
        <div className="bw-progress-section">
          <i className="ti ti-loader ti-spin bw-progress-spinner" aria-hidden="true"></i>
          <span className="bw-progress-text">
            Searching...
          </span>
          <div className="bw-progress-bar-outer">
            <div 
              className="bw-progress-bar-inner" 
              style={{ width: `${searchProgress.total > 0 ? (searchProgress.current / searchProgress.total) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="bw-progress-text">
            {searchProgress.total > 0 ? Math.round((searchProgress.current / searchProgress.total) * 100) : 0}%
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
