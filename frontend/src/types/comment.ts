// Comment types for frontend

export type AuthorType = 'buyer' | 'seller'

export interface Comment {
  id: string
  product_id: string
  author_id: string
  author_type: AuthorType
  parent_comment_id?: string
  content: string
  is_moderated: boolean
  created_at: string
  updated_at: string
}

export interface CommentWithAuthor extends Comment {
  author_name: string
  replies?: CommentWithAuthor[]
}

export interface CreateCommentRequest {
  content: string
  parent_comment_id?: string
}

export interface UpdateCommentRequest {
  content: string
}

export interface ModerateCommentRequest {
  is_moderated: boolean
}

export interface CommentFormData {
  content: string
  parent_comment_id?: string
}