import type { LibraryBranch } from '../types';

interface SelectedLibrariesProps {
  libraries: LibraryBranch[];
  onRemoveLibrary: (id: string) => void;
}

export function SelectedLibraries({ libraries, onRemoveLibrary }: SelectedLibrariesProps) {
  if (libraries.length === 0) return null;

  return (
    <div className="bw-library-list">
      {libraries.map((lib) => (
        <div key={lib.id} className="bw-library-tag">
          <span className="bw-library-tag-name">{lib.name}</span>
          <button 
            onClick={() => onRemoveLibrary(lib.id)} 
            className="bw-remove"
            aria-label={`Remove ${lib.name}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
