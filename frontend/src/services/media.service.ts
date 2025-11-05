import axios from 'axios';
import { UploadResponse, UploadedPhoto } from '../types/media';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class MediaService {
  async uploadPhotos(files: File[], onProgress?: (progress: number) => void): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('photos', file);
      });

      const token = localStorage.getItem('auth_token');
      const headers: any = {
        'Content-Type': 'multipart/form-data',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(`${API_BASE_URL}/media/upload`, formData, {
        headers,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return {
        message: response.data.message,
        files: response.data.files || [],
        errors: response.data.errors || [],
        count: response.data.count || 0
      };
    } catch (error: any) {
      console.error('Upload error details:', error);
      
      if (error.response) {
        // Server responded with error status
        console.error('Server error response:', error.response.data);
        throw new Error(error.response.data.message || 'Upload failed');
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network error:', error.request);
        throw new Error('Network error - please check your connection');
      } else {
        // Something else happened
        console.error('Upload error:', error.message);
        throw new Error(error.message || 'Upload failed');
      }
    }
  }

  async getUnassignedPhotos(): Promise<UploadedPhoto[]> {
    const token = localStorage.getItem('auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get(`${API_BASE_URL}/media/unassigned`, {
      headers
    });

    return response.data.photos || [];
  }

  async deletePhoto(photoId: string): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    await axios.delete(`${API_BASE_URL}/media/${photoId}`, {
      headers
    });
  }

  getPhotoUrl(photoId: string, size: 'thumb' | 'small' | 'medium' | 'large' = 'medium'): string {
    return `${API_BASE_URL}/media/${photoId}?size=${size}`;
  }

  getThumbnailUrl(photoId: string): string {
    return this.getPhotoUrl(photoId, 'thumb');
  }
}

export const mediaService = new MediaService();