import { BaseRepository } from './base'
import { IProductRepository } from './interfaces'
import {
  Product,
  ProductWithPhotos,
  ProductWithDetails,
  Category,
  PaginatedResult,
  PaginationParams
} from '../types/database'
import {
  CreateProduct,
  UpdateProduct,
  ProductFilters
} from '../schemas/validation'

export class ProductRepository extends BaseRepository implements IProductRepository {
  
  async create(sellerId: string, data: CreateProduct): Promise<Product> {
    return this.transaction(async (client) => {
      // Create the product
      const productQuery = `
        INSERT INTO products (seller_id, title, description, price, status)
        VALUES ($1, $2, $3, $4, 'draft')
        RETURNING *
      `
      const productResult = await client.query(productQuery, [
        sellerId,
        data.title,
        data.description,
        data.price
      ])
      
      const product = productResult.rows[0]
      
      // Add categories
      if (data.category_ids && data.category_ids.length > 0) {
        const values = data.category_ids.map((_, index) => `($1, $${index + 2})`).join(', ')
        const categoryQuery = `
          INSERT INTO product_categories (product_id, category_id)
          VALUES ${values}
          ON CONFLICT (product_id, category_id) DO NOTHING
        `
        await client.query(categoryQuery, [product.id, ...data.category_ids])
      }
      
      // Assign photos to product
      if (data.photo_ids && data.photo_ids.length > 0) {
        const updatePhotosQuery = `
          UPDATE product_photos 
          SET product_id = $1 
          WHERE id = ANY($2) AND product_id IS NULL
        `
        await client.query(updatePhotosQuery, [product.id, data.photo_ids])
      }
      
      return product
    })
  }

  async findById(id: string): Promise<Product | null> {
    return this.findRecordById<Product>('products', id)
  }

  async findByIdWithDetails(id: string, buyerId?: string): Promise<ProductWithDetails | null> {
    const query = `
      SELECT 
        p.*,
        sa.id as seller_id,
        sa.username as seller_username,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pp.id,
              'product_id', pp.product_id,
              'filename', pp.filename,
              'original_name', pp.original_name,
              'mime_type', pp.mime_type,
              'size', pp.size,
              'sort_order', pp.sort_order,
              'created_at', pp.created_at
            )
          ) FILTER (WHERE pp.id IS NOT NULL), 
          '[]'
        ) as photos,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name,
              'name_en', c.name_en,
              'name_pt', c.name_pt,
              'created_at', c.created_at
            )
          ) FILTER (WHERE c.id IS NOT NULL), 
          '[]'
        ) as categories
        ${buyerId ? ', CASE WHEN pv.id IS NOT NULL THEN true ELSE false END as is_viewed' : ''}
      FROM products p
      JOIN seller_accounts sa ON p.seller_id = sa.id
      LEFT JOIN product_photos pp ON p.id = pp.product_id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      ${buyerId ? 'LEFT JOIN product_views pv ON p.id = pv.product_id AND pv.buyer_id = $2' : ''}
      WHERE p.id = $1
      GROUP BY p.id, sa.id, sa.username${buyerId ? ', pv.id' : ''}
    `
    
    const params = buyerId ? [id, buyerId] : [id]
    const result = await this.queryOne<any>(query, params)
    
    if (!result) return null
    
    return {
      id: result.id,
      seller_id: result.seller_id,
      title: result.title,
      description: result.description,
      price: parseFloat(result.price),
      status: result.status,
      created_at: result.created_at,
      updated_at: result.updated_at,
      published_at: result.published_at,
      photos: result.photos || [],
      categories: result.categories || [],
      seller: {
        id: result.seller_id,
        username: result.seller_username
      },
      ...(buyerId && { is_viewed: result.is_viewed })
    }
  }

  async update(id: string, data: UpdateProduct): Promise<Product | null> {
    return this.transaction(async (client) => {
      // Build dynamic update query
      const updateFields: string[] = []
      const params: any[] = []
      let paramIndex = 1
      
      if (data.title !== undefined) {
        updateFields.push(`title = $${paramIndex++}`)
        params.push(data.title)
      }
      
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`)
        params.push(data.description)
      }
      
      if (data.price !== undefined) {
        updateFields.push(`price = $${paramIndex++}`)
        params.push(data.price)
      }
      
      if (updateFields.length === 0) {
        // No fields to update, just return current product
        return this.findById(id)
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
      params.push(id) // Add ID as last parameter
      
      const query = `
        UPDATE products 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `
      
      const result = await client.query(query, params)
      const product = result.rows[0] || null
      
      // Update categories if provided
      if (data.category_ids !== undefined && product) {
        await this.removeCategories(id)
        if (data.category_ids.length > 0) {
          await this.addCategories(id, data.category_ids)
        }
      }
      
      // Update photos if provided
      if (data.photo_ids !== undefined && product) {
        // First, unassign current photos
        const unassignQuery = `UPDATE product_photos SET product_id = NULL WHERE product_id = $1`
        await client.query(unassignQuery, [id])
        
        // Then assign new photos
        if (data.photo_ids.length > 0) {
          const assignQuery = `
            UPDATE product_photos 
            SET product_id = $1 
            WHERE id = ANY($2) AND product_id IS NULL
          `
          await client.query(assignQuery, [id, data.photo_ids])
        }
      }
      
      return product
    })
  }

  async delete(id: string): Promise<boolean> {
    return this.transaction(async (client) => {
      // First unassign photos (don't delete them, just unassign)
      const unassignQuery = `UPDATE product_photos SET product_id = NULL WHERE product_id = $1`
      await client.query(unassignQuery, [id])
      
      // Delete the product (categories and other relations will cascade)
      const deleteQuery = `DELETE FROM products WHERE id = $1`
      const result = await client.query(deleteQuery, [id])
      
      return (result.rowCount || 0) > 0
    })
  }

  async publish(id: string): Promise<Product | null> {
    const query = `
      UPDATE products 
      SET status = 'available', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'draft'
      RETURNING *
    `
    return this.queryOne<Product>(query, [id])
  }

  async unpublish(id: string): Promise<Product | null> {
    const query = `
      UPDATE products 
      SET status = 'draft', published_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status IN ('available', 'reserved')
      RETURNING *
    `
    return this.queryOne<Product>(query, [id])
  }

  async updateStatus(id: string, status: string): Promise<Product | null> {
    const query = `
      UPDATE products 
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `
    return this.queryOne<Product>(query, [id, status])
  }

  async findBySeller(sellerId: string, pagination: PaginationParams): Promise<PaginatedResult<ProductWithPhotos>> {
    const baseQuery = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pp.id,
              'product_id', pp.product_id,
              'filename', pp.filename,
              'original_name', pp.original_name,
              'mime_type', pp.mime_type,
              'size', pp.size,
              'sort_order', pp.sort_order,
              'created_at', pp.created_at
            )
          ) FILTER (WHERE pp.id IS NOT NULL), 
          '[]'
        ) as photos,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name,
              'name_en', c.name_en,
              'name_pt', c.name_pt,
              'created_at', c.created_at
            )
          ) FILTER (WHERE c.id IS NOT NULL), 
          '[]'
        ) as categories
      FROM products p
      LEFT JOIN product_photos pp ON p.id = pp.product_id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.seller_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `
    
    const countQuery = `SELECT COUNT(*) FROM products WHERE seller_id = $1`
    
    const result = await this.createPaginatedResult<any>(baseQuery, countQuery, [sellerId], pagination)
    
    // Transform the result to match ProductWithPhotos interface
    const transformedData = result.data.map(row => ({
      id: row.id,
      seller_id: row.seller_id,
      title: row.title,
      description: row.description,
      price: parseFloat(row.price),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      published_at: row.published_at,
      photos: row.photos || [],
      categories: row.categories || []
    }))
    
    return {
      ...result,
      data: transformedData
    }
  }

  async findWithFilters(filters: ProductFilters, buyerId?: string): Promise<PaginatedResult<ProductWithPhotos>> {
    // Build WHERE conditions
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    // Add buyerId parameter for product_views join if needed
    let buyerParamIndex = null;
    if (buyerId) {
      buyerParamIndex = paramIndex++;
      params.push(buyerId);
    }

    // For buyers, always exclude draft products
    if (buyerId) {
      conditions.push(`p.status != 'draft'`);
    }
    
    // Category filter
    if (filters.category_ids && filters.category_ids.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM product_categories pc 
        WHERE pc.product_id = p.id AND pc.category_id = ANY($${paramIndex++})
      )`)
      params.push(filters.category_ids)
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      conditions.push(`p.status = ANY($${paramIndex++})`)
      params.push(filters.status)
    }
    
    // Price filters
    if (filters.min_price !== undefined) {
      conditions.push(`p.price >= $${paramIndex++}`)
      params.push(filters.min_price)
    }
    
    if (filters.max_price !== undefined) {
      conditions.push(`p.price <= $${paramIndex++}`)
      params.push(filters.max_price)
    }
    
    // Search filter
    if (filters.search) {

      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }
    
    // Viewed filter (only if buyerId is provided) - reuse the same parameter as the JOIN
    if (buyerId && filters.viewed !== undefined) {
      if (filters.viewed) {
        conditions.push(`EXISTS (SELECT 1 FROM product_views pv2 WHERE pv2.product_id = p.id AND pv2.buyer_id = $${buyerParamIndex})`)
      } else {
        conditions.push(`NOT EXISTS (SELECT 1 FROM product_views pv2 WHERE pv2.product_id = p.id AND pv2.buyer_id = $${buyerParamIndex})`)
      }
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = this.buildOrderClause(filters.sort_by, filters.sort_order)


    const baseQuery = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pp.id,
              'product_id', pp.product_id,
              'filename', pp.filename,
              'original_name', pp.original_name,
              'mime_type', pp.mime_type,
              'size', pp.size,
              'sort_order', pp.sort_order,
              'created_at', pp.created_at
            )
          ) FILTER (WHERE pp.id IS NOT NULL), 
          '[]'
        ) as photos,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name,
              'name_en', c.name_en,
              'name_pt', c.name_pt,
              'created_at', c.created_at
            )
          ) FILTER (WHERE c.id IS NOT NULL), 
          '[]'
        ) as categories
        ${buyerId ? ', CASE WHEN pv.id IS NOT NULL THEN true ELSE false END as is_viewed' : ''}
      FROM products p
      LEFT JOIN product_photos pp ON p.id = pp.product_id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      ${buyerId ? `LEFT JOIN product_views pv ON p.id = pv.product_id AND pv.buyer_id = $${buyerParamIndex}` : ''}
      ${whereClause}
      GROUP BY p.id${buyerId ? ', pv.id' : ''}
      ${orderClause}
    `
    
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) 
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      ${buyerId ? `LEFT JOIN product_views pv ON p.id = pv.product_id AND pv.buyer_id = $${buyerParamIndex}` : ''}
      ${whereClause}
    `
    
    const pagination: PaginationParams = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit
    }
    
    const result = await this.createPaginatedResult<any>(baseQuery, countQuery, params, pagination)
    
    // Transform the result to match ProductWithPhotos interface
    const transformedData = result.data.map(row => ({
      id: row.id,
      seller_id: row.seller_id,
      title: row.title,
      description: row.description,
      price: parseFloat(row.price),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      published_at: row.published_at,
      photos: row.photos || [],
      categories: row.categories || [],
      ...(buyerId && { is_viewed: row.is_viewed })
    }))
    
    return {
      ...result,
      data: transformedData
    }
  }

  async addCategories(productId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return
    
    const values = categoryIds.map((_, index) => `($1, $${index + 2})`).join(', ')
    const query = `
      INSERT INTO product_categories (product_id, category_id)
      VALUES ${values}
      ON CONFLICT (product_id, category_id) DO NOTHING
    `
    
    await this.query(query, [productId, ...categoryIds])
  }

  async removeCategories(productId: string, categoryIds?: string[]): Promise<void> {
    if (categoryIds && categoryIds.length > 0) {
      const query = `DELETE FROM product_categories WHERE product_id = $1 AND category_id = ANY($2)`
      await this.query(query, [productId, categoryIds])
    } else {
      const query = `DELETE FROM product_categories WHERE product_id = $1`
      await this.query(query, [productId])
    }
  }

  async getCategories(productId: string): Promise<Category[]> {
    const query = `
      SELECT c.* 
      FROM categories c
      JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = $1
      ORDER BY c.name
    `
    return this.query<Category>(query, [productId])
  }

  async recordView(productId: string, buyerId: string): Promise<void> {
    const query = `
      INSERT INTO product_views (product_id, buyer_id, viewed_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (product_id, buyer_id) 
      DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
    `
    await this.query(query, [productId, buyerId])
  }
}