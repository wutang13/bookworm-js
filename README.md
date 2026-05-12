# Bookworm

Bookworm searches for available books across multiple libraries by importing your "to-read" lists from StoryGraph or Goodreads.


## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/bookworm-js.git
   cd bookworm-js
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Usage

1. **Find Your Library:** Use the search bar to find and add your local libraries (powered by OverDrive).
2. **Upload Your List:** Export your "to-read" list as a CSV from StoryGraph or Goodreads and upload it. See [Goodreads Help](https://help.goodreads.com/s/article/How-do-I-import-or-export-my-books-1553870934590) or [Storygraph](https://app.thestorygraph.com/user-export) for more information.
3. **Check Availability:** Click "Search Libraries for Availability" to see which of your libraries have the books you're looking for and what the wait times are.

## Built With

- **React** with **TypeScript**
- **Vite** for lightning-fast builds
- **Fuzzball** for smart book title matching
- **PapaParse** for CSV processing
- **OverDrive API** for real-time library data

## License

This project is licensed under the MIT License - see the LICENSE file for details.
