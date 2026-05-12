import type { LibraryBranch } from '../types';

interface SelectedLibrariesProps {
  libraries: LibraryBranch[];
  onRemoveLibrary: (id: string) => void;
}

export function SelectedLibraries({ libraries, onRemoveLibrary }: SelectedLibrariesProps) {
  if (libraries.length === 0) return null;

  return (
    <div className="selected-libraries">
      <h3>My Libraries</h3>
      <ul>
        {libraries.map((lib) => (
          <li key={lib.id} className="library-chip">
            {lib.name}
            <button 
              onClick={() => onRemoveLibrary(lib.id)} 
              className="remove-lib"
              aria-label={`Remove ${lib.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
