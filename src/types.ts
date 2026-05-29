export type CSVFormat = 'StoryGraph' | 'Goodreads' | 'Unknown';

export interface Book {
  title: string;
  author: string;
  ebook_wait?: number;
  audiobook_wait?: number;
  ebook_id?: string;
  audiobook_id?: string;
  ebook_library?: string;
  audiobook_library?: string;
}

export interface LibraryBranch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  regionCode?: string;
  websiteId?: string;
  searchKey?: string;
}
