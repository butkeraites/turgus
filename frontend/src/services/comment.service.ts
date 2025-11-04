// Comment service for API interactions

import { 
  CommentWithAuthor, 
  CreateCommentRequest, 
  UpdateCommentRequest, 
  ModerateCommentRequest 
} from '../types/comment'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

class CommentService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth_token')
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getProductComments(productId: string): Promise<CommentWithAuthor[]> {
    const response = await this.request<{
      success: boolean
      data: CommentWithAuthor[]
    }>(`/products/${productId}/comments`)
    
    return response.data
  }

  async createComment(
    productId: string, 
    commentData: CreateCommentRequest
  ): Promise<CommentWithAuthor> {
    const response = await this.request<{
      success: boolean
      data: CommentWithAuthor
    }>(`/products/${productId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    })
    
    return response.data
  }

  async updateComment(
    commentId: string, 
    commentData: UpdateCommentRequest
  ): Promise<CommentWithAuthor> {
    const response = await this.request<{
      success: boolean
      data: CommentWithAuthor
    }>(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(commentData),
    })
    
    return response.data
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.request(`/comments/${commentId}`, {
      method: 'DELETE',
    })
  }

  async moderateComment(
    commentId: string, 
    moderationData: ModerateCommentRequest
  ): Promise<CommentWithAuthor> {
    const response = await this.request<{
      success: boolean
      data: CommentWithAuthor
    }>(`/comments/${commentId}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify(moderationData),
    })
    
    return response.data
  }
}

export const commentService = new CommentService()