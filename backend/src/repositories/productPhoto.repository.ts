import { BaseRepository } from './base'
import { IProductPhotoRepository } from './interfaces'
import { ProductPhoto } from '../types/database'

export class ProductPhotoRepository extends BaseRepository implements IProductPhotoRepository {
  async create(data: Omit<ProductPhoto, 'id' | 'created_at'>): Promise<ProductPhoto> {
    const query = `
      INSERT INTO product_photos (product_id, filename, original_name, mime_type, size, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `
    
    const values = [
      data.product_id,
      data.filename,
      data.original_name,
      data.mime_type,
      data.size,
      data.sort_order || 0
    ]

    const result = await this.query(query, values)
    return result[0]
  }

  async findPhotoById(id: string): Promise<ProductPhoto | null> {
    const query = 'SELECT * FROM product_photos WHERE id = $1'
    return this.queryOne<ProductPhoto>(query, [id])
  }

  async findByIds(ids: string[]): Promise<ProductPhoto[]> {
    if (ids.length === 0) return []
    
    const query = `
      SELECT * FROM product_photos 
      WHERE id = ANY($1)
      ORDER BY sort_order ASC, created_at ASC
    `
    return this.query<ProductPhoto>(query, [ids])
  }

  async findByProduct(productId: string): Promise<ProductPhoto[]> {
    const query = `
      SELECT * FROM product_photos 
      WHERE product_id = $1 
      ORDER BY sort_order ASC, created_at ASC
    `
    return this.query<ProductPhoto>(query, [productId])
  }

  async assignToProduct(photoIds: string[], productId: string): Promise<void> {
    if (photoIds.length === 0) return

    const query = `
      UPDATE product_photos 
      SET product_id = $1 
      WHERE id = ANY($2) AND product_id IS NULL
    `
    await this.query(query, [productId, photoIds])
  }

  async unassignFromProduct(photoIds: string[]): Promise<void> {
    if (photoIds.length === 0) return

    const query = `
      UPDATE product_photos 
      SET product_id = NULL 
      WHERE id = ANY($1)
    `
    await this.query(query, [photoIds])
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM product_photos WHERE id = $1'
    const result = await this.query(query, [id])
    return result.length > 0
  }

  async updateSortOrder(photoId: string, sortOrder: number): Promise<void> {
    const query = `
      UPDATE product_photos 
      SET sort_order = $1 
      WHERE id = $2
    `
    await this.query(query, [sortOrder, photoId])
  }

  async getUnassignedPhotos(olderThanHours: number = 24): Promise<ProductPhoto[]> {
    const query = `
      SELECT * FROM product_photos 
      WHERE product_id IS NULL 
        AND created_at < NOW() - INTERVAL '${olderThanHours} hours'
      ORDER BY created_at ASC
    `
    return this.query<ProductPhoto>(query)
  }

  async cleanupUnassignedPhotos(olderThanHours: number = 24): Promise<number> {
    const query = `
      DELETE FROM product_photos 
      WHERE product_id IS NULL 
        AND created_at < NOW() - INTERVAL '${olderThanHours} hours'
    `
    const result = await this.query(query)
    return result.length
  }

  // Additional helper methods for media management
  async createBulk(photos: Omit<ProductPhoto, 'id' | 'created_at'>[]): Promise<ProductPhoto[]> {
    if (photos.length === 0) return []

    const values: any[] = []
    const placeholders: string[] = []
    
    photos.forEach((photo, index) => {
      const baseIndex = index * 6
      placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`)
      values.push(
        photo.product_id,
        photo.filename,
        photo.original_name,
        photo.mime_type,
        photo.size,
        photo.sort_order || 0
      )
    })

    const query = `
      INSERT INTO product_photos (product_id, filename, original_name, mime_type, size, sort_order)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `

    return this.query<ProductPhoto>(query, values)
  }

  async findUnassignedByFilenames(filenames: string[]): Promise<ProductPhoto[]> {
    if (filenames.length === 0) return []

    const query = `
      SELECT * FROM product_photos 
      WHERE filename = ANY($1) AND product_id IS NULL
      ORDER BY created_at ASC
    `
    return this.query<ProductPhoto>(query, [filenames])
  }
}