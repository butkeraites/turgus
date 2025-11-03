// Media and photo upload types

export interface UploadedPhoto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedPhoto?: UploadedPhoto;
}

export interface UploadResponse {
  message: string;
  files: UploadedPhoto[];
  errors?: Array<{
    filename: string;
    error: string;
  }>;
  count: number;
}

export interface PhotoSelectionState {
  selectedPhotos: Set<string>;
  photos: UploadedPhoto[];
}