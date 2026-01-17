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

  // Auto-detected fields (from camera filename parsing)
  recordingTime?: string;  // Insta360
  lens?: string;           // Insta360
  clipNumber?: number;     // Insta360/Canon

  // Extensible
  customFields: CustomField[];
}

export interface VideoFile {
  id: any;
  filename: string;
  size: number;  // Keep for display purposes only, won't be exported to JSON
  metadata: VideoMetadata;
}

export interface Catalog {
  generatedAt: string;
  cameraModel: string;
  directoryPath: string;
  totalVideos: number;
  videos: any[];
}

export interface Notification {
  message: string;
  type: 'success' | 'error';
}

export interface BatchMetadata {
  location: string;
  tags: string[];
  notes: string;
  customFields: CustomField[];
}
