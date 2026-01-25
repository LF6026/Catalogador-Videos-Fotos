export interface CustomField {
  key: string;
  value: string;
}

export interface VideoMetadata {
  // Core fields (always visible/important)
  title: string;
  date: string;
  location: string;
  tags: string[];
  notes: string;
  favorite: boolean;  // Quick access to best videos

  // Auto-detected fields (from camera filename parsing)
  recordingTime?: string;  // Insta360
  lens?: string;           // Insta360
  clipNumber?: number;     // Insta360/Canon

  // Logic & Visuals
  cameraModel?: string;    // Correct place for camera model
  thumbnail?: string;      // Base64 thumbnail

  // Extensible
  customFields: CustomField[];
}

export interface VideoFile {
  id: string;  // Changed from 'any' to 'string' for type safety
  filename: string;
  size: number;  // Keep for display purposes only, won't be exported to JSON
  metadata: VideoMetadata;
}

export interface Catalog {
  generatedAt: string;
  cameraModel: string;
  totalVideos: number;
  videos: VideoExport[];
}

// Type for exported video data (without internal fields)
export interface VideoExport {
  filename: string;
  title: string;
  date: string;
  location: string;
  tags: string[];
  notes: string;
  favorite?: boolean;
  recordingTime?: string;
  lens?: string;
  clipNumber?: number;
  cameraModel?: string;
  customFields?: CustomField[];
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface BatchMetadata {
  location: string;
  tags: string[];
  notes: string;
  customFields: CustomField[];
}

// Sort options
export type SortField = 'date' | 'filename' | 'title' | 'missing-title' | 'favorites';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Statistics
export interface CatalogStats {
  total: number;
  withTitle: number;
  withLocation: number;
  withTags: number;
  favorites: number;
  byCamera: Record<string, number>;
}

// App Mode
export type AppMode = 'catalog' | 'search';

// Search Mode Types
export interface IndexedVideo {
  id: string;
  filename: string;
  metadata: VideoMetadata;
  // Source information
  sourcePath: string;      // Full path: "2024/Viagem-Praia"
  sourceFile: string;      // JSON filename: "catalog-2024-01-15.json"
}

export interface SearchStats {
  totalVideos: number;
  totalCatalogs: number;
  folders: string[];
  cameras: string[];
  dateRange: { min: string; max: string } | null;
}
