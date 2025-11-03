import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface StorageConfig {
  uploadDir: string
  maxFileSize: number
  allowedMimeTypes: string[]
}

export interface StoredFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
}

export class LocalStorage {
  private config: StorageConfig

  constructor(config: StorageConfig) {
    this.config = config
  }

  async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.config.uploadDir)
    } catch {
      await fs.mkdir(this.config.uploadDir, { recursive: true })
    }
  }

  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile> {
    await this.ensureUploadDir()

    const fileId = uuidv4()
    const extension = path.extname(originalName)
    const filename = `${fileId}${extension}`
    const filePath = path.join(this.config.uploadDir, filename)

    await fs.writeFile(filePath, buffer)

    return {
      id: fileId,
      filename,
      originalName,
      mimeType,
      size: buffer.length,
      path: filePath
    }
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.config.uploadDir, filename)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // File might not exist, which is fine for deletion
      console.warn(`Failed to delete file ${filename}:`, error)
    }
  }

  async getFilePath(filename: string): Promise<string> {
    return path.join(this.config.uploadDir, filename)
  }

  validateFile(file: Express.Multer.File): void {
    if (file.size > this.config.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`)
    }

    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`)
    }
  }
}

// Factory function to create storage instance based on environment
export function createStorage(): LocalStorage {
  const config: StorageConfig = {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '300000000'), // 300MB default
    allowedMimeTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',')
  }

  return new LocalStorage(config)
}