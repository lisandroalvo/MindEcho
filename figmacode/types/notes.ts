export interface Note {
  id: string;
  text: string;
  title?: string;
  timestamp: Date;
  folderId?: string;
  tags?: string[];
  parentNoteId?: string; // For nested notes
  isFavorite?: boolean;
  duration?: number; // Recording duration in seconds
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
  parentFolderId?: string; // For nested folders
}

export interface NoteFilter {
  searchQuery?: string;
  folderId?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  favorites?: boolean;
}

export type ViewMode = 'grid' | 'list' | 'timeline';
export type SortBy = 'date' | 'title' | 'duration';
export type SortOrder = 'asc' | 'desc';