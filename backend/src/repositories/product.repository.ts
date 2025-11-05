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
        const values = data.category_ids.map((_, index) => `($1, ${index + 2})`).join(', ')
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
  const params: any[] = [id]
  let buyerIdx: number | null = null
  if (buyerId) {
    params.push(buyerId)
    buyerIdx = params.length // 2
  }

  const isViewedSelect = buyerIdx
    ? `, EXISTS(
         SELECT 1 FROM product_views pv_check
         WHERE pv_check.product_id = p.id
           AND pv_check.viewer_id = $${buyerIdx}::uuid
       ) AS is_viewed`
    : ''

  const query = `
    SELECT 
      p.*,
      sa.id AS seller_id,
      sa.username AS seller_username,
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
      ) AS photos,
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
      ) AS categories
      ${isViewedSelect}
    FROM products p
    JOIN seller_accounts sa ON p.seller_id = sa.id
    LEFT JOIN product_photos pp ON p.id = pp.product_id
    LEFT JOIN product_categories pc ON p.id = pc.product_id
    LEFT JOIN categories c ON pc.category_id = c.id
    WHERE p.id = $1
    GROUP BY p.id, sa.id, sa.username
  `

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
    seller: { id: result.seller_id, username: result.seller_username },
    ...(buyerId ? { is_viewed: result.is_viewed } : {})
  }
}


async update(id: string, data: UpdateProduct): Promise<Product | null> {
  return this.transaction(async (client) => {
    const updateFields: string[] = []
    const params: any[] = []
    let i = 1

    if (data.title !== undefined) {
      updateFields.push(`title = $${i++}`)
      params.push(data.title)
    }
    if (data.description !== undefined) {
      updateFields.push(`description = $${i++}`)
      params.push(data.description)
    }
    if (data.price !== undefined) {
      updateFields.push(`price = $${i++}`)
      params.push(data.price)
    }

    if (updateFields.length === 0) return this.findById(id)

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    const whereIdx = i
    params.push(id)

    const query = `
      UPDATE products
      SET ${updateFields.join(', ')}
      WHERE id = $${whereIdx}
      RETURNING *
    `
    const result = await client.query(query, params)
    const product = (result.rows[0] || null) as Product | null

    if (data.category_ids !== undefined && product) {
      await this.removeCategories(id)
      if (data.category_ids.length > 0) {
        await this.addCategories(id, data.category_ids)
      }
    }

    if (data.photo_ids !== undefined && product) {
      await client.query(`UPDATE product_photos SET product_id = NULL WHERE product_id = $1`, [id])
      if (data.photo_ids.length > 0) {
        await client.query(
          `UPDATE product_photos SET product_id = $1 WHERE id = ANY($2::uuid[]) AND product_id IS NULL`,
          [id, data.photo_ids]
        )
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
    console.log('findWithFilters called with:', { filters, buyerId });
    
    // Build WHERE conditions
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    // No longer using buyerId parameter for views

    // For buyers, always exclude draft products
    if (buyerId) {
      conditions.push(`p.status != 'draft'`);
    }
    
    // Category filter
    if (filters.category_ids && filters.category_ids.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM product_categories pc 
        WHERE pc.product_id = p.id AND pc.category_id = ANY($${paramIndex})
      )`)
      params.push(filters.category_ids)
      paramIndex++
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      conditions.push(`p.status = ANY($${paramIndex}::product_status[])`)
      params.push(filters.status)
      paramIndex++
    }
    
    // Price filters
    if (filters.min_price !== undefined) {
      conditions.push(`p.price >= $${paramIndex}`)
      params.push(filters.min_price)
      paramIndex++
    }
    
    if (filters.max_price !== undefined) {
      conditions.push(`p.price <= $${paramIndex}`)
      params.push(filters.max_price)
      paramIndex++
    }
    
    // Search filter
    if (filters.search) {
      conditions.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex + 1})`)
      params.push(`%${filters.search}%`, `%${filters.search}%`)
      paramIndex += 2
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

      FROM products p
      LEFT JOIN product_photos pp ON p.id = pp.product_id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      ${whereClause}
      GROUP BY p.id
      ${orderClause}
    `
    
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) 
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
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

    }))
    
    return {
      ...result,
      data: transformedData
    }
  }

async addCategories(productId: string, categoryIds: string[]): Promise<void> {
  if (!categoryIds.length) return
  await this.query(
    `INSERT INTO product_categories (product_id, category_id)
     SELECT $1, UNNEST($2::uuid[])
     ON CONFLICT (product_id, category_id) DO NOTHING`,
    [productId, categoryIds]
  )
}


  async removeCategories(productId: string, categoryIds?: string[]): Promise<void> {
    if (categoryIds && categoryIds.length > 0) {
      const query = `DELETE FROM product_categories WHERE product_id = $1 AND category_id = ANY($2::uuid[])`
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
    // View tracking disabled - method does nothing
    return Promise.resolve()
  }
}