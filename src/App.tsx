import { useState, type ChangeEvent, type SubmitEvent } from 'react';
import './App.css';

type CSVFormat = 'StoryGraph' | 'Goodreads' | 'Unknown';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<CSVFormat>('Unknown');

  const detectFormat = (headerLine: string) => {
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const isStoryGraph = ['Title', 'Authors', 'Read Status'].every(h => headers.includes(h));
    const isGoodreads = ['Title', 'Author', 'Bookshelves'].every(h => headers.includes(h));

    if (isStoryGraph) return 'StoryGraph';
    if (isGoodreads) return 'Goodreads';
    return 'Unknown';
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const firstLine = text.split('\n')[0];
        setFormat(detectFormat(firstLine));
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (file && format !== 'Unknown') {
      console.log(`Submitting ${format} file:`, file.name);
    } else if (file) {
      alert('The exported library must be from either StoryGraph or Goodreads.');
    } else {
      alert('Please select a CSV file first.');
    }
  };

  return (
    <main className="container">
      <h1>CSV Uploader</h1>
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
    </main>
  );
}

export default App;
