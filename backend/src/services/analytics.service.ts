import { Pool } from 'pg'

export interface DashboardMetrics {
  totalUsers: number
  totalProducts: number
  totalViews: number
  onlineUsers: number
  recentSales: number
  totalRevenue: number
  topProducts: Array<{
    id: string
    title: string
    views: number
    wantListAdds: number
  }>
}

export interface SalesReport {
  buyerId: string
  buyerName: string
  buyerEmail: string
  totalOrders: number
  totalAmount: number
  lastOrderDate: string
  orders: Array<{
    id: string
    completedAt: string
    amount: number
    itemCount: number
    products: Array<{
      id: string
      title: string
      price: number
    }>
  }>
}

export class AnalyticsService {
  constructor(private pool: Pool) {}

  /**
   * Track product view
   */
  async trackProductView(
    productId: string, 
    viewerId?: string, 
    sessionId?: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Insert view record
      await client.query(`
        INSERT INTO product_views (product_id, viewer_id, session_id, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
      `, [productId, viewerId || null, sessionId, ipAddress, userAgent])
      
      // Update product metrics
      await client.query(`
        INSERT INTO product_metrics (product_id, total_views, unique_views)
        VALUES ($1, 1, 1)
        ON CONFLICT (product_id) 
        DO UPDATE SET 
          total_views = product_metrics.total_views + 1,
          unique_views = CASE 
            WHEN NOT EXISTS (
              SELECT 1 FROM product_views 
              WHERE product_id = $1 
              AND (viewer_id = $2 OR session_id = $3)
              AND viewed_at < CURRENT_TIMESTAMP - INTERVAL '1 hour'
            ) THEN product_metrics.unique_views + 1
            ELSE product_metrics.unique_views
          END,
          last_updated = CURRENT_TIMESTAMP
      `, [productId, viewerId || null, sessionId])
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update online session
   */
  async updateOnlineSession(
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    if (!sessionId) return

    await this.pool.query(`
      INSERT INTO online_sessions (user_id, session_id, ip_address, user_agent, last_activity)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (session_id)
      DO UPDATE SET 
        last_activity = CURRENT_TIMESTAMP,
        is_active = true
    `, [userId || null, sessionId, ipAddress, userAgent])
  }

  /**
   * Track want list add
   */
  async trackWantListAdd(productId: string, userId: string): Promise<void> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Update product metrics - increment want list adds
      // Use ON CONFLICT with the unique constraint on product_id
      await client.query(`
        INSERT INTO product_metrics (product_id, want_list_adds)
        VALUES ($1, 1)
        ON CONFLICT (product_id) 
        DO UPDATE SET 
          want_list_adds = COALESCE(product_metrics.want_list_adds, 0) + 1,
          last_updated = CURRENT_TIMESTAMP
      `, [productId])
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error tracking want list add:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Record sale completion
   */
  async recordSale(
    sellerId: string,
    buyerId: string,
    wantListId: string,
    totalAmount: number,
    itemCount: number
  ): Promise<void> {
    await this.pool.query(`
      INSERT INTO sales_analytics (seller_id, buyer_id, want_list_id, total_amount, item_count)
      VALUES ($1, $2, $3, $4, $5)
    `, [sellerId, buyerId, wantListId, totalAmount, itemCount])
  }

  /**
   * Get dashboard metrics for seller
   */
  async getDashboardMetrics(sellerId: string): Promise<DashboardMetrics> {
    try {
      // Total users (buyers who viewed seller's products + anonymous sessions)
      const usersResult = await this.pool.query(`
        SELECT COUNT(DISTINCT COALESCE(pv.viewer_id::text, pv.session_id)) as total_users
        FROM product_views pv
        JOIN products p ON pv.product_id = p.id
        WHERE p.seller_id = $1
      `, [sellerId])

      // Total products
      const productsResult = await this.pool.query(`
        SELECT COUNT(*) as total_products
        FROM products
        WHERE seller_id = $1
      `, [sellerId])

      // Total views (from product_views table directly if metrics table is empty)
      const viewsResult = await this.pool.query(`
        SELECT COUNT(*) as total_views
        FROM product_views pv
        JOIN products p ON pv.product_id = p.id
        WHERE p.seller_id = $1
      `, [sellerId])

      // Online users (last 15 minutes) - simplified query
      const onlineResult = await this.pool.query(`
        SELECT COUNT(DISTINCT session_id) as online_users
        FROM online_sessions
        WHERE last_activity > CURRENT_TIMESTAMP - INTERVAL '15 minutes'
        AND is_active = true
      `, [])

      // Recent sales (last 30 days)
      const salesResult = await this.pool.query(`
        SELECT COUNT(*) as recent_sales, COALESCE(SUM(total_amount), 0) as total_revenue
        FROM sales_analytics
        WHERE seller_id = $1 
        AND completed_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      `, [sellerId])

      // Top products with fallback to product_views count
      const topProductsResult = await this.pool.query(`
        SELECT 
          p.id,
          p.title,
          COUNT(pv.id) as views,
          COALESCE(pm.want_list_adds, 0) as want_list_adds
        FROM products p
        LEFT JOIN product_views pv ON p.id = pv.product_id
        LEFT JOIN product_metrics pm ON p.id = pm.product_id
        WHERE p.seller_id = $1
        GROUP BY p.id, p.title, pm.want_list_adds
        ORDER BY views DESC
        LIMIT 5
      `, [sellerId])

      const metrics = {
        totalUsers: parseInt(usersResult.rows[0]?.total_users || '0'),
        totalProducts: parseInt(productsResult.rows[0]?.total_products || '0'),
        totalViews: parseInt(viewsResult.rows[0]?.total_views || '0'),
        onlineUsers: parseInt(onlineResult.rows[0]?.online_users || '0'),
        recentSales: parseInt(salesResult.rows[0]?.recent_sales || '0'),
        totalRevenue: parseFloat(salesResult.rows[0]?.total_revenue || '0'),
        topProducts: topProductsResult.rows
      }

      console.log('Analytics metrics for seller', sellerId, ':', metrics)
      return metrics

    } catch (error) {
      console.error('Error getting dashboard metrics:', error)
      // Return default values on error
      return {
        totalUsers: 0,
        totalProducts: 0,
        totalViews: 0,
        onlineUsers: 0,
        recentSales: 0,
        totalRevenue: 0,
        topProducts: []
      }
    }
  }

  /**
   * Get online users count (real-time)
   */
  async getOnlineUsersCount(sellerId: string): Promise<number> {
    try {
      // Simplified query - just count active sessions in last 15 minutes
      const result = await this.pool.query(`
        SELECT COUNT(DISTINCT session_id) as online_users
        FROM online_sessions
        WHERE last_activity > CURRENT_TIMESTAMP - INTERVAL '15 minutes'
        AND is_active = true
      `, [])

      return parseInt(result.rows[0]?.online_users || '0')
    } catch (error) {
      console.error('Error getting online users count:', error)
      return 0
    }
  }

  /**
   * Get sales report for date range
   */
  async getSalesReport(
    sellerId: string,
    startDate: string,
    endDate: string,
    buyerIds?: string[]
  ): Promise<SalesReport[]> {
    let query = `
      SELECT 
        ba.id as buyer_id,
        ba.name as buyer_name,
        ba.email as buyer_email,
        COUNT(sa.id) as total_orders,
        SUM(sa.total_amount) as total_amount,
        MAX(sa.completed_at) as last_order_date
      FROM sales_analytics sa
      JOIN buyer_accounts ba ON sa.buyer_id = ba.id
      WHERE sa.seller_id = $1
      AND sa.completed_at >= $2::timestamp
      AND sa.completed_at <= $3::timestamp
    `
    
    const params: any[] = [sellerId, startDate, endDate]
    
    if (buyerIds && buyerIds.length > 0) {
      query += ` AND sa.buyer_id = ANY($4)`
      params.push(buyerIds)
    }
    
    query += `
      GROUP BY ba.id, ba.name, ba.email
      ORDER BY total_amount DESC
    `

    const result = await this.pool.query(query, params)
    
    // Get detailed orders for each buyer
    const reports: SalesReport[] = []
    
    for (const row of result.rows) {
      const ordersResult = await this.pool.query(`
        SELECT 
          wl.id,
          sa.completed_at,
          sa.total_amount,
          sa.item_count,
          json_agg(
            json_build_object(
              'id', p.id,
              'title', p.title,
              'price', p.price
            )
          ) as products
        FROM sales_analytics sa
        JOIN want_lists wl ON sa.want_list_id = wl.id
        JOIN want_list_items wli ON wl.id = wli.want_list_id
        JOIN products p ON wli.product_id = p.id
        WHERE sa.seller_id = $1 
        AND sa.buyer_id = $2
        AND sa.completed_at >= $3::timestamp
        AND sa.completed_at <= $4::timestamp
        GROUP BY wl.id, sa.completed_at, sa.total_amount, sa.item_count
        ORDER BY sa.completed_at DESC
      `, [sellerId, row.buyer_id, startDate, endDate])

      reports.push({
        buyerId: row.buyer_id,
        buyerName: row.buyer_name,
        buyerEmail: row.buyer_email,
        totalOrders: parseInt(row.total_orders),
        totalAmount: parseFloat(row.total_amount),
        lastOrderDate: row.last_order_date,
        orders: ordersResult.rows.map(order => ({
          id: order.id,
          completedAt: order.completed_at,
          amount: parseFloat(order.total_amount),
          itemCount: parseInt(order.item_count),
          products: order.products
        }))
      })
    }

    return reports
  }

  /**
   * Clean up old sessions
   */
  async cleanupOldSessions(): Promise<void> {
    await this.pool.query(`
      UPDATE online_sessions 
      SET is_active = false
      WHERE last_activity < CURRENT_TIMESTAMP - INTERVAL '30 minutes'
    `)
  }
}