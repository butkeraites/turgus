import { repositories } from '../repositories'
import { createStorage } from '../utils/storage'
import { imageProcessor } from '../utils/imageProcessor'
import { ProductPhoto } from '../types/database'

export interface UploadedFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
}

export interface MediaUploadResult {
  success: boolean
  files: UploadedFile[]
  errors: string[]
}

export class MediaService {
  private storage = createStorage()

  async uploadFiles(files: Express.Multer.File[]): Promise<MediaUploadResult> {
    const result: MediaUploadResult = {
      success: true,
      files: [],
      errors: []
    }

    // Ensure upload directory exists
    await this.storage.ensureUploadDir()

    for (const file of files) {
      try {
        // Validate file
        this.storage.validateFile(file)

        // Process and optimize the image
        const processedImages = await imageProcessor.processImage(
          file.buffer,
          file.originalname,
          {
            quality: 85,
            progressive: true,
            generateWebP: true
          }
        )

        // Save the main image first to get a proper file ID
        const mainImage = processedImages.find(img => img.filename.includes('_original.jpg'))
        if (!mainImage) {
          throw new Error('Failed to process main image')
        }

        // Save the main image using the storage service to get a proper filename
        const storedFile = await this.storage.saveFile(
          mainImage.buffer,
          file.originalname,
          file.mimetype
        )

        // Generate base filename for variants (without extension)
        const baseFilename = storedFile.filename.replace(/\.[^/.]+$/, '')
        
        // Save all other processed variants with consistent naming
        for (const processedImage of processedImages) {
          if (processedImage !== mainImage) {
            try {
              // Create variant filename based on the stored file's name
              let variantFilename: string
              if (processedImage.filename.includes('_thumb')) {
                variantFilename = `${baseFilename}_thumb.${processedImage.format === 'webp' ? 'webp' : 'jpg'}`
              } else if (processedImage.filename.includes('_small')) {
                variantFilename = `${baseFilename}_small.${processedImage.format === 'webp' ? 'webp' : 'jpg'}`
              } else if (processedImage.filename.includes('_medium')) {
                variantFilename = `${baseFilename}_medium.${processedImage.format === 'webp' ? 'webp' : 'jpg'}`
              } else if (processedImage.filename.includes('_large')) {
                variantFilename = `${baseFilename}_large.${processedImage.format === 'webp' ? 'webp' : 'jpg'}`
              } else if (processedImage.filename.includes('_original') && processedImage.format === 'webp') {
                variantFilename = `${baseFilename}_original.webp`
              } else {
                continue // Skip unknown variants
              }

              const filePath = await this.storage.getFilePath(variantFilename)
              const fs = await import('fs/promises')
              await fs.writeFile(filePath, processedImage.buffer)
            } catch (error) {
              console.error('Error saving variant:', processedImage.filename, error)
              // Don't fail the whole upload for variant errors
            }
          }
        }

        // Save to database (unassigned to any product initially)
        const photoRecord = await repositories.productPhoto.create({
          product_id: undefined, // Will be assigned later when creating a product
          filename: storedFile.filename,
          original_name: storedFile.originalName,
          mime_type: storedFile.mimeType,
          size: storedFile.size,
          sort_order: 0
        })

        result.files.push({
          id: photoRecord.id,
          filename: storedFile.filename,
          originalName: storedFile.originalName,
          mimeType: storedFile.mimeType,
          size: storedFile.size,
          url: `/api/media/${photoRecord.id}`
        })

      } catch (error) {
        console.error('Upload error for file:', file.originalname, error)
        result.success = false
        result.errors.push(`Failed to upload ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  async getFile(photoId: string, size?: string, format?: 'webp' | 'jpeg'): Promise<{
    buffer: Buffer
    mimeType: string
    filename: string
  } | null> {
    try {
      // Get photo record from database
      const photo = await repositories.productPhoto.findPhotoById(photoId)
      if (!photo) {
        return null
      }

      // Determine the filename based on size and format preferences
      let targetFilename = photo.filename
      
      if (size || format) {
        const baseName = photo.filename.replace(/\.[^/.]+$/, '').replace('_original', '')
        const extension = format === 'webp' ? 'webp' : 'jpg'
        
        if (size) {
          targetFilename = `${baseName}_${size}.${extension}`
        } else if (format === 'webp') {
          targetFilename = `${baseName}_original.webp`
        }
      }

      // Try to get the requested variant, fallback to original if not found
      let filePath: string
      try {
        filePath = await this.storage.getFilePath(targetFilename)
      } catch {
        // Fallback to original file
        filePath = await this.storage.getFilePath(photo.filename)
        targetFilename = photo.filename
      }

      // Read file from storage
      const fs = await import('fs/promises')
      const buffer = await fs.readFile(filePath)

      // Determine MIME type
      let mimeType = photo.mime_type
      if (targetFilename.endsWith('.webp')) {
        mimeType = 'image/webp'
      } else if (targetFilename.endsWith('.jpg') || targetFilename.endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      }

      return {
        buffer,
        mimeType,
        filename: targetFilename
      }

    } catch (error) {
      console.error('Error getting file:', error)
      return null
    }
  }

  async deleteFile(photoId: string): Promise<boolean> {
    try {
      // Get photo record
      const photo = await repositories.productPhoto.findPhotoById(photoId)
      if (!photo) {
        return false
      }

      // Delete all variants from storage
      const baseName = photo.filename.replace(/\.[^/.]+$/, '').replace('_original', '')
      const variants = [
        photo.filename, // original
        `${baseName}_original.webp`,
        `${baseName}_thumb.jpg`,
        `${baseName}_thumb.webp`,
        `${baseName}_small.jpg`,
        `${baseName}_small.webp`,
        `${baseName}_medium.jpg`,
        `${baseName}_medium.webp`,
        `${baseName}_large.jpg`,
        `${baseName}_large.webp`
      ]

      // Delete files from storage (ignore errors for missing files)
      await Promise.allSettled(
        variants.map(filename => this.storage.deleteFile(filename))
      )

      // Delete from database
      return await repositories.productPhoto.delete(photoId)

    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  async assignPhotosToProduct(photoIds: string[], productId: string): Promise<void> {
    await repositories.productPhoto.assignToProduct(photoIds, productId)
  }

  async getProductPhotos(productId: string): Promise<ProductPhoto[]> {
    return repositories.productPhoto.findByProduct(productId)
  }

  async getUnassignedPhotos(): Promise<ProductPhoto[]> {
    // Get all unassigned photos (no time filter)
    return repositories.productPhoto.getUnassignedPhotos()
  }
  
  async getAllPhotos(): Promise<Array<ProductPhoto & { is_assigned: boolean; product_title?: string }>> {
    return repositories.productPhoto.getAllPhotos()
  }

  async cleanupOldUnassignedPhotos(olderThanHours: number = 720): Promise<number> {
    // Get photos to delete
    const photosToDelete = await repositories.productPhoto.getUnassignedPhotos(olderThanHours)
    
    // Delete files from storage
    for (const photo of photosToDelete) {
      await this.deleteFile(photo.id)
    }

    // Clean up database records
    return repositories.productPhoto.cleanupUnassignedPhotos(olderThanHours)
  }

  async getPhotoById(photoId: string): Promise<ProductPhoto | null> {
    return repositories.productPhoto.findPhotoById(photoId)
  }

  async getResponsiveImageInfo(photoId: string, baseUrl: string): Promise<{
    src: string
    srcset: string
    sizes: string
    webpSrcset: string
    metadata?: any
  }> {
    const photo = await repositories.productPhoto.findPhotoById(photoId)
    if (!photo) {
      throw new Error('Photo not found')
    }

    const info = imageProcessor.generateResponsiveImageInfo(photoId, baseUrl)
    return {
      ...info,
      webpSrcset: info.webpSrcset || ''
    }
  }
}

export const mediaService = new MediaService()