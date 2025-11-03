import { 
  ProductComment, 
  ProductCommentWithAuthor, 
  PaginatedResult, 
  PaginationParams 
} from '../types/database'
import { CreateComment, UpdateComment } from '../schemas/validation'
import { IProductCommentRepository } from './interfaces'
import { BaseRepository } from './base'

export class ProductCommentRepository extends BaseRepository implements IProductCommentRepository {

  async create(
    productId: string, 
    authorId: string, 
    authorType: 'buyer' | 'seller', 
    data: CreateComment
  ): Promise<ProductComment> {
    const query = `
      INSERT INTO product_comments (product_id, author_id, author_type, parent_comment_id, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    
    const values = [productId, authorId, authorType, data.parent_comment_id || null, data.content]
    const result = await this.query<ProductComment>(query, values)
    
    return result[0]
  }

  async findById(id: string): Promise<ProductComment | null> {
    const query = `
      SELECT * FROM product_comments 
      WHERE id = $1
    `
    
    return this.queryOne<ProductComment>(query, [id])
  }

  async findByProduct(productId: string): Promise<ProductCommentWithAuthor[]> {
    const query = `
      WITH RECURSIVE comment_tree AS (
        -- Base case: top-level comments
        SELECT 
          pc.*,
          CASE 
            WHEN pc.author_type = 'seller' THEN sa.username
            WHEN pc.author_type = 'buyer' THEN ba.name
          END as author_name,
          0 as depth
        FROM product_comments pc
        LEFT JOIN seller_accounts sa ON pc.author_type = 'seller' AND pc.author_id = sa.id
        LEFT JOIN buyer_accounts ba ON pc.author_type = 'buyer' AND pc.author_id = ba.id
        WHERE pc.product_id = $1 AND pc.parent_comment_id IS NULL
        
        UNION ALL
        
        -- Recursive case: replies
        SELECT 
          pc.*,
          CASE 
            WHEN pc.author_type = 'seller' THEN sa.username
            WHEN pc.author_type = 'buyer' THEN ba.name
          END as author_name,
          ct.depth + 1
        FROM product_comments pc
        LEFT JOIN seller_accounts sa ON pc.author_type = 'seller' AND pc.author_id = sa.id
        LEFT JOIN buyer_accounts ba ON pc.author_type = 'buyer' AND pc.author_id = ba.id
        INNER JOIN comment_tree ct ON pc.parent_comment_id = ct.id
        WHERE ct.depth < 5  -- Limit nesting depth
      )
      SELECT * FROM comment_tree
      ORDER BY created_at ASC
    `
    
    const result = await this.query(query, [productId])
    
    // Build the nested comment structure
    const commentsMap = new Map<string, ProductCommentWithAuthor>()
    const topLevelComments: ProductCommentWithAuthor[] = []
    
    // First pass: create all comment objects
    result.forEach(row => {
      const comment: ProductCommentWithAuthor = {
        id: row.id,
        product_id: row.product_id,
        author_id: row.author_id,
        author_type: row.author_type,
        parent_comment_id: row.parent_comment_id,
        content: row.content,
        is_moderated: row.is_moderated,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author_name: row.author_name,
        replies: []
      }
      
      commentsMap.set(comment.id, comment)
      
      if (!comment.parent_comment_id) {
        topLevelComments.push(comment)
      }
    })
    
    // Second pass: build the tree structure
    result.forEach(row => {
      if (row.parent_comment_id) {
        const parent = commentsMap.get(row.parent_comment_id)
        const child = commentsMap.get(row.id)
        if (parent && child) {
          parent.replies!.push(child)
        }
      }
    })
    
    return topLevelComments
  }

  async update(id: string, data: UpdateComment): Promise<ProductComment | null> {
    const query = `
      UPDATE product_comments 
      SET content = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `
    
    return this.queryOne<ProductComment>(query, [id, data.content])
  }

  async delete(id: string): Promise<boolean> {
    const query = `
      DELETE FROM product_comments 
      WHERE id = $1
    `
    
    const result = await this.query(query, [id])
    return result.length > 0
  }

  async moderate(id: string, isModerated: boolean): Promise<ProductComment | null> {
    const query = `
      UPDATE product_comments 
      SET is_moderated = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `
    
    return this.queryOne<ProductComment>(query, [id, isModerated])
  }

  async findByAuthor(
    authorId: string, 
    authorType: 'buyer' | 'seller', 
    pagination: PaginationParams
  ): Promise<PaginatedResult<ProductCommentWithAuthor>> {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM product_comments 
      WHERE author_id = $1 AND author_type = $2
    `
    
    const dataQuery = `
      SELECT 
        pc.*,
        CASE 
          WHEN pc.author_type = 'seller' THEN sa.username
          WHEN pc.author_type = 'buyer' THEN ba.name
        END as author_name
      FROM product_comments pc
      LEFT JOIN seller_accounts sa ON pc.author_type = 'seller' AND pc.author_id = sa.id
      LEFT JOIN buyer_accounts ba ON pc.author_type = 'buyer' AND pc.author_id = ba.id
      WHERE pc.author_id = $1 AND pc.author_type = $2
      ORDER BY pc.created_at DESC
      LIMIT $3 OFFSET $4
    `
    
    const [countResult, dataResult] = await Promise.all([
      this.query(countQuery, [authorId, authorType]),
      this.query(dataQuery, [authorId, authorType, pagination.limit, pagination.offset])
    ])
    
    const total = parseInt(countResult[0].total)
    const totalPages = Math.ceil(total / pagination.limit)
    
    const comments: ProductCommentWithAuthor[] = dataResult.map(row => ({
      id: row.id,
      product_id: row.product_id,
      author_id: row.author_id,
      author_type: row.author_type,
      parent_comment_id: row.parent_comment_id,
      content: row.content,
      is_moderated: row.is_moderated,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author_name: row.author_name,
      replies: []
    }))
    
    return {
      data: comments,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        total_pages: totalPages,
        has_next: pagination.page < totalPages,
        has_prev: pagination.page > 1
      }
    }
  }

  async getCommentCount(productId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM product_comments 
      WHERE product_id = $1
    `
    
    const result = await this.query(query, [productId])
    return parseInt(result[0].total)
  }
}