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
   * Find a want list by ID
   */
  async findById(wantListId: string): Promise<WantList | null> {
    const query = `
      SELECT * FROM want_lists 
      WHERE id = $1
    `
    const result = await this.pool.query(query, [wantListId])
    
    if (result.rows.length === 0) {
      return null
    }
    
    return result.rows[0]
  }

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
    // Simplified query to avoid complex aggregations that might cause issues
    const query = `
      SELECT DISTINCT
        wl.id,
        wl.buyer_id,
        wl.status,
        wl.created_at,
        wl.updated_at,
        ba.id as buyer_id_ref,
        ba.name as buyer_name,
        ba.telephone as buyer_telephone,
        ba.address as buyer_address
      FROM want_lists wl
      JOIN buyer_accounts ba ON wl.buyer_id = ba.id
      JOIN want_list_items wli ON wl.id = wli.want_list_id
      JOIN products p ON wli.product_id = p.id
      WHERE wl.status = 'active' AND p.seller_id = $1
      ORDER BY wl.created_at DESC
    `
    
    const result = await this.pool.query(query, [sellerId])
    
    // For each want list, get the items separately
    const wantLists: WantListWithBuyer[] = []
    
    for (const row of result.rows) {
      // Get items for this want list
      const itemsQuery = `
        SELECT 
          wli.id,
          wli.want_list_id,
          wli.product_id,
          wli.added_at,
          p.id as product_id,
          p.seller_id,
          p.title,
          p.description,
          p.price,
          p.status,
          p.created_at as product_created_at,
          p.updated_at as product_updated_at,
          p.published_at
        FROM want_list_items wli
        JOIN products p ON wli.product_id = p.id
        WHERE wli.want_list_id = $1 AND p.seller_id = $2
        ORDER BY wli.added_at DESC
      `
      
      const itemsResult = await this.pool.query(itemsQuery, [row.id, sellerId])
      
      const items = []
      let totalPrice = 0
      
      for (const itemRow of itemsResult.rows) {
        // Get photos for this product
        const photosQuery = `
          SELECT id, product_id, filename, original_name, mime_type, size, sort_order, created_at
          FROM product_photos
          WHERE product_id = $1
          ORDER BY sort_order ASC
        `
        const photosResult = await this.pool.query(photosQuery, [itemRow.product_id])
        
        // Get categories for this product
        const categoriesQuery = `
          SELECT c.id, c.name, c.name_en, c.name_pt, c.created_at
          FROM product_categories pc
          JOIN categories c ON pc.category_id = c.id
          WHERE pc.product_id = $1
        `
        const categoriesResult = await this.pool.query(categoriesQuery, [itemRow.product_id])
        
        items.push({
          id: itemRow.id,
          want_list_id: itemRow.want_list_id,
          product_id: itemRow.product_id,
          added_at: itemRow.added_at,
          product: {
            id: itemRow.product_id,
            seller_id: itemRow.seller_id,
            title: itemRow.title,
            description: itemRow.description,
            price: itemRow.price,
            status: itemRow.status,
            created_at: itemRow.product_created_at,
            updated_at: itemRow.product_updated_at,
            published_at: itemRow.published_at,
            photos: photosResult.rows,
            categories: categoriesResult.rows
          }
        })
        
        totalPrice += parseFloat(itemRow.price) || 0
      }
      
      wantLists.push({
        id: row.id,
        buyer_id: row.buyer_id,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        buyer: {
          id: row.buyer_id_ref,
          name: row.buyer_name,
          telephone: row.buyer_telephone,
          address: row.buyer_address
        },
        items: items,
        total_price: totalPrice,
        item_count: items.length
      })
    }
    
    return wantLists
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
      // Note: The trigger will automatically add to interest queue and update product status
      const insertQuery = `
        INSERT INTO want_list_items (want_list_id, product_id)
        VALUES ($1, $2)
        RETURNING *
      `
      const insertResult = await client.query(insertQuery, [wantList.id, productId])
      
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
      // Note: The trigger will automatically remove from interest queue and promote next buyer
      const deleteQuery = `
        DELETE FROM want_list_items wli
        USING want_lists wl
        WHERE wli.want_list_id = wl.id 
          AND wl.buyer_id = $1 
          AND wli.product_id = $2 
          AND wl.status = 'active'
      `
      const deleteResult = await client.query(deleteQuery, [buyerId, productId])
      
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
      // Note: The trigger will automatically remove from interest queue and promote next buyer
      const deleteQuery = `
        DELETE FROM want_list_items 
        WHERE id = $1
      `
      const deleteResult = await client.query(deleteQuery, [itemId])
      
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
      
      // Get want list details for analytics
      // Note: This assumes all products in a want list belong to the same seller
      // which is enforced by the business logic
      const getWantListQuery = `
        SELECT 
          wl.buyer_id,
          COUNT(DISTINCT wli.id) as item_count,
          SUM(p.price) as total_amount,
          MIN(p.seller_id) as seller_id
        FROM want_lists wl
        JOIN want_list_items wli ON wl.id = wli.want_list_id
        JOIN products p ON wli.product_id = p.id
        WHERE wl.id = $1
        GROUP BY wl.buyer_id
      `
      const wantListResult = await client.query(getWantListQuery, [wantListId])
      
      if (wantListResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return false
      }
      
      const wantListData = wantListResult.rows[0]
      
      console.log('Completing want list:', {
        wantListId,
        buyerId: wantListData.buyer_id,
        sellerId: wantListData.seller_id,
        itemCount: wantListData.item_count,
        totalAmount: wantListData.total_amount
      })
      
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
      
      // Record sale in analytics
      const recordSaleQuery = `
        INSERT INTO sales_analytics (seller_id, buyer_id, want_list_id, total_amount, item_count)
        VALUES ($1, $2, $3, $4, $5)
      `
      await client.query(recordSaleQuery, [
        wantListData.seller_id,
        wantListData.buyer_id,
        wantListId,
        wantListData.total_amount,
        wantListData.item_count
      ])
      
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

  /**
   * Get buyer's position in the interest queue for a specific product
   */
  async getBuyerPositionInQueue(buyerId: string, productId: string): Promise<number | null> {
    const query = `
      SELECT position
      FROM product_interests
      WHERE buyer_id = $1 AND product_id = $2
    `
    const result = await this.pool.query(query, [buyerId, productId])
    
    if (result.rows.length === 0) {
      return null
    }
    
    return result.rows[0].position
  }

  /**
   * Get the complete interest queue for a product (for sellers)
   */
  async getProductInterestQueue(productId: string): Promise<Array<{ buyer_id: string; position: number; buyer_name: string; created_at: Date }>> {
    const query = `
      SELECT 
        pi.buyer_id,
        pi.position,
        ba.name as buyer_name,
        pi.created_at
      FROM product_interests pi
      JOIN buyer_accounts ba ON pi.buyer_id = ba.id
      WHERE pi.product_id = $1
      ORDER BY pi.position ASC
    `
    const result = await this.pool.query(query, [productId])
    return result.rows
  }

  /**
   * Get all queue positions for a buyer across all products
   */
  async getBuyerQueuePositions(buyerId: string): Promise<Array<{ product_id: string; position: number; total_in_queue: number }>> {
    const query = `
      SELECT 
        pi.product_id,
        pi.position,
        (
          SELECT COUNT(*) 
          FROM product_interests 
          WHERE product_id = pi.product_id
        ) as total_in_queue
      FROM product_interests pi
      WHERE pi.buyer_id = $1
      ORDER BY pi.position ASC
    `
    const result = await this.pool.query(query, [buyerId])
    return result.rows
  }
}