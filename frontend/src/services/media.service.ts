import axios from 'axios';
import { UploadResponse, UploadedPhoto } from '../types/media';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class MediaService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async uploadPhotos(files: File[], onProgress?: (progress: number) => void): Promise<UploadResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('photos', file);
    });

    const response = await axios.post(`${API_BASE_URL}/api/media/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...this.getAuthHeaders(),
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  async getUnassignedPhotos(): Promise<UploadedPhoto[]> {
    const response = await axios.get(`${API_BASE_URL}/api/media/unassigned`, {
      headers: this.getAuthHeaders(),
    });

    return response.data.photos;
  }

  async deletePhoto(photoId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/media/${photoId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getPhotoUrl(photoId: string, size: 'thumb' | 'small' | 'medium' | 'large' = 'medium'): string {
    return `${API_BASE_URL}/api/media/${photoId}?size=${size}`;
  }

  getThumbnailUrl(photoId: string): string {
    return this.getPhotoUrl(photoId, 'thumb');
  }
}

export const mediaService = new MediaService();