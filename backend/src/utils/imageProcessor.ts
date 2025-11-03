import sharp from 'sharp'
import path from 'path'

export interface ImageSize {
  width: number
  height?: number
  suffix: string
}

export interface ProcessedImage {
  buffer: Buffer
  filename: string
  width: number
  height: number
  format: string
  size: number
  metadata?: ImageMetadata
}

export interface ImageMetadata {
  originalWidth: number
  originalHeight: number
  format: string
  colorSpace?: string
  hasAlpha?: boolean
  density?: number
  exif?: any
}

export interface ImageProcessingOptions {
  quality?: number
  progressive?: boolean
  generateWebP?: boolean
  sizes?: ImageSize[]
}

export class ImageProcessor {
  private defaultSizes: ImageSize[] = [
    { width: 150, suffix: 'thumb' },
    { width: 400, suffix: 'small' },
    { width: 800, suffix: 'medium' },
    { width: 1200, suffix: 'large' }
  ]

  async processImage(
    inputBuffer: Buffer,
    originalFilename: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const {
      quality = 85,
      progressive = true,
      generateWebP = true,
      sizes = this.defaultSizes
    } = options

    const results: ProcessedImage[] = []
    const baseName = path.parse(originalFilename).name

    // Get original image metadata
    const metadata = await this.extractMetadata(inputBuffer)
    const imageMetadata: ImageMetadata = {
      originalWidth: metadata.width || 0,
      originalHeight: metadata.height || 0,
      format: metadata.format || 'unknown',
      colorSpace: metadata.space,
      hasAlpha: metadata.hasAlpha,
      density: metadata.density,
      exif: metadata.exif
    }
    
    // Process original size (optimized)
    const originalOptimized = await this.optimizeImage(inputBuffer, {
      quality,
      progressive,
      format: 'jpeg'
    })
    
    results.push({
      buffer: originalOptimized,
      filename: `${baseName}_original.jpg`,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: 'jpeg',
      size: originalOptimized.length,
      metadata: imageMetadata
    })

    // Generate WebP version of original if requested
    if (generateWebP) {
      const webpBuffer = await sharp(inputBuffer)
        .webp({ quality })
        .toBuffer()
      
      results.push({
        buffer: webpBuffer,
        filename: `${baseName}_original.webp`,
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: 'webp',
        size: webpBuffer.length,
        metadata: imageMetadata
      })
    }

    // Generate different sizes
    for (const size of sizes) {
      // JPEG version
      const resizedJpeg = await sharp(inputBuffer)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality, progressive })
        .toBuffer()

      const resizedMetadata = await sharp(resizedJpeg).metadata()
      
      results.push({
        buffer: resizedJpeg,
        filename: `${baseName}_${size.suffix}.jpg`,
        width: resizedMetadata.width || 0,
        height: resizedMetadata.height || 0,
        format: 'jpeg',
        size: resizedJpeg.length,
        metadata: imageMetadata
      })

      // WebP version if requested
      if (generateWebP) {
        const resizedWebP = await sharp(inputBuffer)
          .resize(size.width, size.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality })
          .toBuffer()

        const webpMetadata = await sharp(resizedWebP).metadata()
        
        results.push({
          buffer: resizedWebP,
          filename: `${baseName}_${size.suffix}.webp`,
          width: webpMetadata.width || 0,
          height: webpMetadata.height || 0,
          format: 'webp',
          size: resizedWebP.length,
          metadata: imageMetadata
        })
      }
    }

    return results
  }

  async optimizeImage(
    inputBuffer: Buffer,
    options: { quality?: number; progressive?: boolean; format?: 'jpeg' | 'webp' | 'png' } = {}
  ): Promise<Buffer> {
    const { quality = 85, progressive = true, format = 'jpeg' } = options

    let processor = sharp(inputBuffer)

    switch (format) {
      case 'jpeg':
        processor = processor.jpeg({ quality, progressive })
        break
      case 'webp':
        processor = processor.webp({ quality })
        break
      case 'png':
        processor = processor.png({ quality })
        break
    }

    return processor.toBuffer()
  }

  async extractMetadata(inputBuffer: Buffer): Promise<sharp.Metadata> {
    return sharp(inputBuffer).metadata()
  }

  async generateThumbnail(
    inputBuffer: Buffer,
    width: number = 150,
    height: number = 150
  ): Promise<Buffer> {
    return sharp(inputBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer()
  }

  /**
   * Generate responsive image information for HTML srcset
   */
  generateResponsiveImageInfo(photoId: string, baseUrl: string = '/api/media'): {
    src: string
    srcset: string
    sizes: string
    webpSrcset?: string
  } {
    const sizes = this.defaultSizes
    
    // Generate JPEG srcset
    const jpegSources = sizes.map(size => 
      `${baseUrl}/${photoId}?size=${size.suffix}&format=jpeg ${size.width}w`
    )
    jpegSources.unshift(`${baseUrl}/${photoId}?format=jpeg 1200w`) // Original as largest
    
    // Generate WebP srcset
    const webpSources = sizes.map(size => 
      `${baseUrl}/${photoId}?size=${size.suffix}&format=webp ${size.width}w`
    )
    webpSources.unshift(`${baseUrl}/${photoId}?format=webp 1200w`) // Original as largest

    return {
      src: `${baseUrl}/${photoId}?size=medium&format=jpeg`, // Default fallback
      srcset: jpegSources.join(', '),
      webpSrcset: webpSources.join(', '),
      sizes: '(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px'
    }
  }

  /**
   * Get optimal image size based on viewport width
   */
  getOptimalSize(viewportWidth: number): string {
    if (viewportWidth <= 200) return 'thumb'
    if (viewportWidth <= 500) return 'small'
    if (viewportWidth <= 900) return 'medium'
    return 'large'
  }
}

export const imageProcessor = new ImageProcessor()