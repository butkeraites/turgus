import { Request, Response } from 'express'
import { mediaService } from '../services/media.service'

export class MediaController {
  // POST /api/media/upload - Upload multiple photos
  async uploadPhotos(req: Request, res: Response): Promise<void> {
    try {
      console.log('Upload request received:', {
        files: req.files,
        body: req.body,
        headers: req.headers['content-type']
      })
      
      const files = req.files as Express.Multer.File[]
      
      if (!files || files.length === 0) {
        console.log('No files received in request')
        res.status(400).json({
          error: 'No files provided',
          message: 'Please select at least one image file to upload'
        })
        return
      }

      const result = await mediaService.uploadFiles(files)

      if (result.success && result.errors.length === 0) {
        res.status(201).json({
          message: 'Files uploaded successfully',
          files: result.files,
          count: result.files.length
        })
      } else if (result.files.length > 0) {
        // Partial success
        res.status(207).json({
          message: 'Some files uploaded successfully',
          files: result.files,
          errors: result.errors,
          count: result.files.length
        })
      } else {
        // Complete failure
        res.status(400).json({
          error: 'Upload failed',
          message: 'Failed to upload any files',
          errors: result.errors
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process file upload'
      })
    }
  }

  // GET /api/media/:id - Get optimized image
  async getImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      let { size, format } = req.query

      // Auto-detect optimal format based on Accept header
      if (!format) {
        const acceptHeader = req.headers.accept || ''
        if (acceptHeader.includes('image/webp')) {
          format = 'webp'
        } else {
          format = 'jpeg'
        }
      }

      // Auto-detect optimal size based on viewport width hint
      if (!size) {
        const viewportWidth = req.headers['viewport-width']
        if (viewportWidth) {
          const width = parseInt(viewportWidth as string)
          if (width <= 400) size = 'small'
          else if (width <= 800) size = 'medium'
          else size = 'large'
        } else {
          size = 'medium' // Default
        }
      }

      const file = await mediaService.getFile(
        id,
        size as string,
        format as 'webp' | 'jpeg'
      )

      if (!file) {
        res.status(404).json({
          error: 'File not found',
          message: 'The requested image could not be found'
        })
        return
      }

      // Generate ETag for caching
      const etag = `"${id}-${size}-${format}"`

      // Set appropriate headers
      res.set({
        'Content-Type': file.mimeType,
        'Content-Length': file.buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'ETag': etag,
        'Vary': 'Accept, Viewport-Width', // Vary on content negotiation headers
        'X-Image-Size': size as string,
        'X-Image-Format': format as string
      })

      // Check if client has cached version
      const clientETag = req.headers['if-none-match']
      if (clientETag === etag) {
        res.status(304).end()
        return
      }

      res.send(file.buffer)
    } catch (error) {
      console.error('Get image error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve image'
      })
    }
  }

  // DELETE /api/media/:id - Delete photo (seller only)
  async deletePhoto(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      const success = await mediaService.deleteFile(id)

      if (success) {
        res.json({
          message: 'Photo deleted successfully'
        })
      } else {
        res.status(404).json({
          error: 'Photo not found',
          message: 'The requested photo could not be found or has already been deleted'
        })
      }
    } catch (error) {
      console.error('Delete photo error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete photo'
      })
    }
  }

  // GET /api/media/unassigned - Get unassigned photos (seller only)
  async getUnassignedPhotos(_req: Request, res: Response): Promise<void> {
    try {
      const photos = await mediaService.getUnassignedPhotos()

      res.json({
        photos: photos.map(photo => ({
          id: photo.id,
          filename: photo.filename,
          originalName: photo.original_name,
          mimeType: photo.mime_type,
          size: photo.size,
          url: `/api/media/${photo.id}`,
          thumbnailUrl: `/api/media/${photo.id}?size=thumb`,
          createdAt: photo.created_at
        })),
        count: photos.length
      })
    } catch (error) {
      console.error('Get unassigned photos error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve unassigned photos'
      })
    }
  }

  // GET /api/media/:id/responsive - Get responsive image information
  async getResponsiveImageInfo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const photo = await mediaService.getPhotoById(id)
      if (!photo) {
        res.status(404).json({
          error: 'Photo not found',
          message: 'The requested photo could not be found'
        })
        return
      }

      const baseUrl = `${req.protocol}://${req.get('host')}/api/media`
      const responsiveInfo = await mediaService.getResponsiveImageInfo(id, baseUrl)

      res.json({
        id: photo.id,
        originalName: photo.original_name,
        ...responsiveInfo
      })
    } catch (error) {
      console.error('Get responsive image info error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get responsive image information'
      })
    }
  }

  // POST /api/media/cleanup - Cleanup old unassigned photos (seller only)
  async cleanupUnassignedPhotos(req: Request, res: Response): Promise<void> {
    try {
      const { olderThanHours = 24 } = req.body

      const deletedCount = await mediaService.cleanupOldUnassignedPhotos(olderThanHours)

      res.json({
        message: 'Cleanup completed successfully',
        deletedCount
      })
    } catch (error) {
      console.error('Cleanup error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to cleanup unassigned photos'
      })
    }
  }
}

export const mediaController = new MediaController()