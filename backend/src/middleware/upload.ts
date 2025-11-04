import multer from 'multer'
import { Request } from 'express'
import { createStorage } from '../utils/storage'

const storage = createStorage()

// Configure multer for memory storage (we'll process files in memory)
const multerStorage = multer.memoryStorage()

// File filter function
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    storage.validateFile(file)
    cb(null, true)
  } catch (error) {
    cb(error as any, false)
  }
}

// Create multer instance
export const upload = multer({
  storage: multerStorage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '300000000'), // 300MB
    files: 20 // Maximum 20 files per upload
  }
})

// Middleware for single file upload
export const uploadSingle = upload.single('image')

// Middleware for multiple file upload
export const uploadMultiple = upload.array('photos', 20)

// Error handling middleware for multer errors
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  console.log('Upload error occurred:', {
    error: error.message,
    code: error.code,
    files: req.files,
    body: req.body
  })
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          message: `File size exceeds the maximum allowed size of ${process.env.MAX_FILE_SIZE || '300MB'}`
        })
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          message: 'Maximum 20 files allowed per upload'
        })
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field',
          message: 'Unexpected file field in upload'
        })
      default:
        return res.status(400).json({
          error: 'Upload error',
          message: error.message
        })
    }
  }
  
  // Pass other errors to the next error handler
  next(error)
}