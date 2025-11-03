import { 
  WantList, 
  WantListItem, 
  WantListWithItems, 
  WantListWithBuyer
} from '../types/database'
import { IWantListRepository } from './interfaces'
import { BaseRepository } from './base'

export class WantListRepository extends BaseRepository implements IWantListRepository {

  /**
   * Find or create an active want list for a buyer
   */
  async findOrCreateForBuyer(buyerId: string): Promise<WantList> {
    // First try to find existing active want list
    const findQuery = `
      SELECT * FROM want_lists 
      WHERE buyer_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `
    const findResult = await this.pool.query(findQuery, [buyerId])
    
    if (findResult.rows.length > 0) {
      return findResult.rows[0]
    }
    
    // Create new want list if none exists
    const createQuery = `
      INSERT INTO want_lists (buyer_id, status)
      VALUES ($1, 'active')
      RETURNING *
    `
    const createResult = await this.pool.query(createQuery, [buyerId])
    
    if (createResult.rows.length === 0) {
      throw new Error('Failed to create want list')
    }
    
    return createResult.rows[0]
  }

  /**
   * Find buyer's want list with items and product details
   */
  async findByBuyer(buyerId: string): Promise<WantListWithItems | null> {
    const query = `
      SELECT 
        wl.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', wli.id,
              'want_list_id', wli.want_list_id,
              'product_id', wli.product_id,
              'added_at', wli.added_at,
              'product', json_build_object(
                'id', p.id,
                'seller_id', p.seller_id,
                'title', p.title,
                'description', p.description,
                'price', p.price,
                'status', p.status,
                'created_at', p.created_at,
                'updated_at', p.updated_at,
                'published_at', p.published_at,
                'photos', COALESCE(photos.photos, '[]'::json),
                'categories', COALESCE(categories.categories, '[]'::json)
              )
            ) ORDER BY wli.added_at DESC
          ) FILTER (WHERE wli.id IS NOT NULL),
          '[]'::json
        ) as items,
        COALESCE(SUM(p.price), 0) as total_price,
        COUNT(wli.id) as item_count
      FROM want_lists wl
      LEFT JOIN want_list_items wli ON wl.id = wli.want_list_id
      LEFT JOIN products p ON wli.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', pp.id,
            'product_id', pp.product_id,
            'filename', pp.filename,
            'original_name', pp.original_name,
            'mime_type', pp.mime_type,
            'size', pp.size,
            'sort_order', pp.sort_order,
            'created_at', pp.created_at
          ) ORDER BY pp.sort_order ASC
        ) as photos
        FROM product_photos pp
        WHERE pp.product_id = p.id
      ) photos ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', c.id,
            'name', c.name,
            'name_en', c.name_en,
            'name_pt', c.name_pt,
            'created_at', c.created_at
          )
        ) as categories
        FROM product_categories pc
        JOIN categories c ON pc.category_id = c.id
        WHERE pc.product_id = p.id
      ) categories ON true
      WHERE wl.buyer_id = $1 AND wl.status = 'active'
      GROUP BY wl.id, wl.buyer_id, wl.status, wl.created_at, wl.updated_at
      ORDER BY wl.created_at DESC
      LIMIT 1
    `
    
    const result = await this.pool.query(query, [buyerId])
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      id: row.id,
      buyer_id: row.buyer_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      items: row.items || [],
      total_price: parseFloat(row.total_price) || 0,
      item_count: parseInt(row.item_count) || 0
    }
  }

  /**
   * Find all want lists containing seller's products
   */
  async findBySeller(sellerId: string): Promise<WantListWithBuyer[]> {
    const query = `
      SELECT DISTINCT
        wl.*,
        json_build_object(
          'id', ba.id,
          'name', ba.name,
          'telephone', ba.telephone,
          'address', ba.address
        ) as buyer,
        COALESCE(
          json_agg(
            json_build_object(
              'id', wli.id,
              'want_list_id', wli.want_list_id,
              'product_id', wli.product_id,
              'added_at', wli.added_at,
              'product', json_build_object(
                'id', p.id,
                'seller_id', p.seller_id,
                'title', p.title,
                'description', p.description,
                'price', p.price,
                'status', p.status,
                'created_at', p.created_at,
                'updated_at', p.updated_at,
                'published_at', p.published_at,
                'photos', COALESCE(photos.photos, '[]'::json),
                'categories', COALESCE(categories.categories, '[]'::json)
              )
            ) ORDER BY wli.added_at DESC
          ) FILTER (WHERE wli.id IS NOT NULL AND p.seller_id = $1),
          '[]'::json
        ) as items,
        COALESCE(SUM(CASE WHEN p.seller_id = $1 THEN p.price ELSE 0 END), 0) as total_price,
        COUNT(CASE WHEN p.seller_id = $1 THEN wli.id END) as item_count
      FROM want_lists wl
      JOIN buyer_accounts ba ON wl.buyer_id = ba.id
      JOIN want_list_items wli ON wl.id = wli.want_list_id
      JOIN products p ON wli.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', pp.id,
            'product_id', pp.product_id,
            'filename', pp.filename,
            'original_name', pp.original_name,
            'mime_type', pp.mime_type,
            'size', pp.size,
            'sort_order', pp.sort_order,
            'created_at', pp.created_at
          ) ORDER BY pp.sort_order ASC
        ) as photos
        FROM product_photos pp
        WHERE pp.product_id = p.id
      ) photos ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', c.id,
            'name', c.name,
            'name_en', c.name_en,
            'name_pt', c.name_pt,
            'created_at', c.created_at
          )
        ) as categories
        FROM product_categories pc
        JOIN categories c ON pc.category_id = c.id
        WHERE pc.product_id = p.id
      ) categories ON true
      WHERE wl.status = 'active' AND p.seller_id = $1
      GROUP BY wl.id, wl.buyer_id, wl.status, wl.created_at, wl.updated_at, ba.id, ba.name, ba.telephone, ba.address
      HAVING COUNT(CASE WHEN p.seller_id = $1 THEN wli.id END) > 0
      ORDER BY wl.created_at DESC
    `
    
    const result = await this.pool.query(query, [sellerId])
    
    return result.rows.map(row => ({
      id: row.id,
      buyer_id: row.buyer_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      buyer: row.buyer,
      items: row.items || [],
      total_price: parseFloat(row.total_price) || 0,
      item_count: parseInt(row.item_count) || 0
    }))
  }

  /**
   * Add a product to buyer's want list
   */
  async addItem(buyerId: string, productId: string): Promise<WantListItem> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Get or create want list
      const wantList = await this.findOrCreateForBuyer(buyerId)
      
      // Check if item already exists
      const existsQuery = `
        SELECT id FROM want_list_items 
        WHERE want_list_id = $1 AND product_id = $2
      `
      const existsResult = await client.query(existsQuery, [wantList.id, productId])
      
      if (existsResult.rows.length > 0) {
        throw new Error('Product already in want list')
      }
      
      // Add item to want list
      const insertQuery = `
        INSERT INTO want_list_items (want_list_id, product_id)
        VALUES ($1, $2)
        RETURNING *
      `
      const insertResult = await client.query(insertQuery, [wantList.id, productId])
      
      // Update product status to reserved
      const updateProductQuery = `
        UPDATE products 
        SET status = 'reserved', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'available'
      `
      await client.query(updateProductQuery, [productId])
      
      await client.query('COMMIT')
      
      return insertResult.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Remove a product from buyer's want list
   */
  async removeItem(buyerId: string, productId: string): Promise<boolean> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Find the want list item
      const findQuery = `
        SELECT wli.id, wli.product_id
        FROM want_list_items wli
        JOIN want_lists wl ON wli.want_list_id = wl.id
        WHERE wl.buyer_id = $1 AND wli.product_id = $2 AND wl.status = 'active'
      `
      const findResult = await client.query(findQuery, [buyerId, productId])
      
      if (findResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return false
      }
      
      // Remove item from want list
      const deleteQuery = `
        DELETE FROM want_list_items wli
        USING want_lists wl
        WHERE wli.want_list_id = wl.id 
          AND wl.buyer_id = $1 
          AND wli.product_id = $2 
          AND wl.status = 'active'
      `
      const deleteResult = await client.query(deleteQuery, [buyerId, productId])
      
      // Update product status back to available
      const updateProductQuery = `
        UPDATE products 
        SET status = 'available', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'reserved'
      `
      await client.query(updateProductQuery, [productId])
      
      await client.query('COMMIT')
      
      return (deleteResult.rowCount || 0) > 0
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Remove a want list item by ID
   */
  async removeItemById(itemId: string): Promise<boolean> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Find the item and its product
      const findQuery = `
        SELECT wli.product_id
        FROM want_list_items wli
        WHERE wli.id = $1
      `
      const findResult = await client.query(findQuery, [itemId])
      
      if (findResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return false
      }
      
      const productId = findResult.rows[0].product_id
      
      // Remove the item
      const deleteQuery = `
        DELETE FROM want_list_items 
        WHERE id = $1
      `
      const deleteResult = await client.query(deleteQuery, [itemId])
      
      // Update product status back to available
      const updateProductQuery = `
        UPDATE products 
        SET status = 'available', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'reserved'
      `
      await client.query(updateProductQuery, [productId])
      
      await client.query('COMMIT')
      
      return (deleteResult.rowCount || 0) > 0
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Check if buyer has a specific product in their want list
   */
  async hasItem(buyerId: string, productId: string): Promise<boolean> {
    const query = `
      SELECT 1
      FROM want_list_items wli
      JOIN want_lists wl ON wli.want_list_id = wl.id
      WHERE wl.buyer_id = $1 AND wli.product_id = $2 AND wl.status = 'active'
    `
    
    const result = await this.pool.query(query, [buyerId, productId])
    return result.rows.length > 0
  }

  /**
   * Get item count for buyer's want list
   */
  async getItemCount(buyerId: string): Promise<number> {
    const query = `
      SELECT COUNT(wli.id) as count
      FROM want_list_items wli
      JOIN want_lists wl ON wli.want_list_id = wl.id
      WHERE wl.buyer_id = $1 AND wl.status = 'active'
    `
    
    const result = await this.pool.query(query, [buyerId])
    return parseInt(result.rows[0]?.count || '0')
  }

  /**
   * Get total price for buyer's want list
   */
  async getTotalPrice(buyerId: string): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(p.price), 0) as total
      FROM want_list_items wli
      JOIN want_lists wl ON wli.want_list_id = wl.id
      JOIN products p ON wli.product_id = p.id
      WHERE wl.buyer_id = $1 AND wl.status = 'active'
    `
    
    const result = await this.pool.query(query, [buyerId])
    return parseFloat(result.rows[0]?.total || '0')
  }

  /**
   * Cancel a want list (seller action)
   */
  async cancel(wantListId: string): Promise<boolean> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Get all products in the want list
      const getProductsQuery = `
        SELECT wli.product_id
        FROM want_list_items wli
        WHERE wli.want_list_id = $1
      `
      const productsResult = await client.query(getProductsQuery, [wantListId])
      
      // Update want list status
      const updateWantListQuery = `
        UPDATE want_lists 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `
      const updateResult = await client.query(updateWantListQuery, [wantListId])
      
      // Update all products back to available
      if (productsResult.rows.length > 0) {
        const productIds = productsResult.rows.map(row => row.product_id)
        const updateProductsQuery = `
          UPDATE products 
          SET status = 'available', updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1) AND status = 'reserved'
        `
        await client.query(updateProductsQuery, [productIds])
      }
      
      await client.query('COMMIT')
      
      return (updateResult.rowCount || 0) > 0
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Complete a want list (buyer action)
   */
  async complete(wantListId: string): Promise<boolean> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Get all products in the want list
      const getProductsQuery = `
        SELECT wli.product_id
        FROM want_list_items wli
        WHERE wli.want_list_id = $1
      `
      const productsResult = await client.query(getProductsQuery, [wantListId])
      
      // Update want list status
      const updateWantListQuery = `
        UPDATE want_lists 
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `
      const updateResult = await client.query(updateWantListQuery, [wantListId])
      
      // Update all products to sold
      if (productsResult.rows.length > 0) {
        const productIds = productsResult.rows.map(row => row.product_id)
        const updateProductsQuery = `
          UPDATE products 
          SET status = 'sold', updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1) AND status = 'reserved'
        `
        await client.query(updateProductsQuery, [productIds])
      }
      
      await client.query('COMMIT')
      
      return (updateResult.rowCount || 0) > 0
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Clean up empty want lists
   */
  async cleanupEmptyWantLists(): Promise<number> {
    const query = `
      UPDATE want_lists 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'active' 
        AND id NOT IN (
          SELECT DISTINCT want_list_id 
          FROM want_list_items
        )
    `
    
    const result = await this.pool.query(query)
    return result.rowCount || 0
  }
}