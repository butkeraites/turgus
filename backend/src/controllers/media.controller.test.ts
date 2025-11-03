import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'
import { MediaController } from './media.controller'
import { mediaService } from '../services/media.service'

// Mock the media service
vi.mock('../services/media.service', () => ({
  mediaService: {
    uploadFiles: vi.fn(),
    getFile: vi.fn(),
    deleteFile: vi.fn(),
    getUnassignedPhotos: vi.fn(),
    cleanupOldUnassignedPhotos: vi.fn(),
    getPhotoById: vi.fn(),
    getResponsiveImageInfo: vi.fn()
  }
}))

describe('Media Controller', () => {
  let mediaController: MediaController
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    mediaController = new MediaController()
    mockRequest = {}
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis()
    }
    vi.clearAllMocks()
  })

  describe('uploadPhotos', () => {
    it('should return 400 when no files are provided', async () => {
      mockRequest.files = []

      await mediaController.uploadPhotos(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No files provided',
        message: 'Please select at least one image file to upload'
      })
    })

    it('should upload files successfully', async () => {
      const mockFiles = [
        { originalname: 'test.jpg', buffer: Buffer.from('test'), mimetype: 'image/jpeg' }
      ] as Express.Multer.File[]
      
      mockRequest.files = mockFiles

      const mockResult = {
        success: true,
        files: [{
          id: 'test-id',
          filename: 'test.jpg',
          originalName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1000,
          url: '/api/media/test-id'
        }],
        errors: []
      }

      vi.mocked(mediaService.uploadFiles).mockResolvedValue(mockResult)

      await mediaController.uploadPhotos(mockRequest as Request, mockResponse as Response)

      expect(mediaService.uploadFiles).toHaveBeenCalledWith(mockFiles)
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Files uploaded successfully',
        files: mockResult.files,
        count: 1
      })
    })
  })

  describe('getImage', () => {
    it('should return 404 when image not found', async () => {
      mockRequest.params = { id: 'non-existent' }
      mockRequest.query = {}
      mockRequest.headers = {}

      vi.mocked(mediaService.getFile).mockResolvedValue(null)

      await mediaController.getImage(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'File not found',
        message: 'The requested image could not be found'
      })
    })

    it('should serve image successfully', async () => {
      mockRequest.params = { id: 'test-id' }
      mockRequest.query = { size: 'medium', format: 'jpeg' }
      mockRequest.headers = { accept: 'image/jpeg' }

      const mockFile = {
        buffer: Buffer.from('image-data'),
        mimeType: 'image/jpeg',
        filename: 'test.jpg'
      }

      vi.mocked(mediaService.getFile).mockResolvedValue(mockFile)

      await mediaController.getImage(mockRequest as Request, mockResponse as Response)

      expect(mediaService.getFile).toHaveBeenCalledWith('test-id', 'medium', 'jpeg')
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/jpeg',
        'Content-Length': mockFile.buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': '"test-id-medium-jpeg"',
        'Vary': 'Accept, Viewport-Width',
        'X-Image-Size': 'medium',
        'X-Image-Format': 'jpeg'
      })
      expect(mockResponse.send).toHaveBeenCalledWith(mockFile.buffer)
    })
  })

  describe('deletePhoto', () => {
    it('should delete photo successfully', async () => {
      mockRequest.params = { id: 'test-id' }

      vi.mocked(mediaService.deleteFile).mockResolvedValue(true)

      await mediaController.deletePhoto(mockRequest as Request, mockResponse as Response)

      expect(mediaService.deleteFile).toHaveBeenCalledWith('test-id')
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Photo deleted successfully'
      })
    })

    it('should return 404 when photo not found', async () => {
      mockRequest.params = { id: 'non-existent' }

      vi.mocked(mediaService.deleteFile).mockResolvedValue(false)

      await mediaController.deletePhoto(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Photo not found',
        message: 'The requested photo could not be found or has already been deleted'
      })
    })
  })
})