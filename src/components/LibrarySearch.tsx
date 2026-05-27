import { useState, useEffect } from 'react';
import type { LibraryBranch } from '../types';

interface LibrarySearchProps {
  onAddLibrary: (library: LibraryBranch) => void;
}

export function LibrarySearch({ onAddLibrary }: LibrarySearchProps) {
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryResults, setLibraryResults] = useState<LibraryBranch[]>([]);

  useEffect(() => {
    const fetchLibraries = async () => {
      if (libraryQuery.length < 3) {
        setLibraryResults([]);
        return;
      }

      try {
        const response = await fetch(`https://locate.libbyapp.com/autocomplete/${encodeURIComponent(libraryQuery)}`);
        const data = await response.json();
        
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

  const handleSelect = (lib: LibraryBranch) => {
    onAddLibrary(lib);
    setLibraryQuery('');
    setLibraryResults([]);
  };

  return (
    <div className="bw-search-container">
      <div className="bw-search-box">
        <i className="ti ti-search bw-search-icon" aria-hidden="true"></i>
        <input
          type="text"
          placeholder="Search for a library…"
          value={libraryQuery}
          onChange={(e) => setLibraryQuery(e.target.value)}
          className="bw-search-input"
        />
      </div>
      {libraryResults.length > 0 && (
        <ul className="bw-autocomplete-results">
          {libraryResults.map((lib) => (
            <li key={lib.id} onClick={() => handleSelect(lib)} className="bw-autocomplete-item">
              <strong className="bw-autocomplete-name">{lib.name}</strong>
              {lib.address && (
                <span className="bw-autocomplete-address">
                  {lib.address + ', ' + lib.city + ', ' + lib.regionCode}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
