import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CommentWithAuthor, CommentFormData } from '../../types/comment'
import { useAuth } from '../../contexts/AuthContext'
import { commentService } from '../../services/comment.service'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { LoadingSpinner } from './LoadingSpinner'

interface CommentSectionProps {
  productId: string
  sellerId?: string
  className?: string
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  productId,
  sellerId,
  className = ''
}) => {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canModerate = user?.type === 'seller' && user?.id === sellerId

  useEffect(() => {
    loadComments()
  }, [productId])

  const loadComments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const commentsData = await commentService.getProductComments(productId)
      setComments(commentsData)
    } catch (error) {
      console.error('Error loading comments:', error)
      setError(t('comments.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateComment = async (data: CommentFormData) => {
    try {
      setIsSubmitting(true)
      await commentService.createComment(productId, {
        content: data.content,
        parent_comment_id: data.parent_comment_id
      })
      
      // Reload comments to get the updated tree structure
      await loadComments()
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, data: CommentFormData) => {
    try {
      setIsSubmitting(true)
      await commentService.createComment(productId, {
        content: data.content,
        parent_comment_id: parentId
      })
      
      // Reload comments to get the updated tree structure
      await loadComments()
    } catch (error) {
      console.error('Error creating reply:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      setIsSubmitting(true)
      await commentService.updateComment(commentId, { content })
      
      // Update the comment in the local state
      const updateCommentInTree = (comments: CommentWithAuthor[]): CommentWithAuthor[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, content, updated_at: new Date().toISOString() }
          }
          if (comment.replies) {
            return { ...comment, replies: updateCommentInTree(comment.replies) }
          }
          return comment
        })
      }
      
      setComments(updateCommentInTree(comments))
    } catch (error) {
      console.error('Error updating comment:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      setIsSubmitting(true)
      await commentService.deleteComment(commentId)
      
      // Remove the comment from the local state
      const removeCommentFromTree = (comments: CommentWithAuthor[]): CommentWithAuthor[] => {
        return comments.filter(comment => {
          if (comment.id === commentId) {
            return false
          }
          if (comment.replies) {
            comment.replies = removeCommentFromTree(comment.replies)
          }
          return true
        })
      }
      
      setComments(removeCommentFromTree(comments))
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModerateComment = async (commentId: string, isModerated: boolean) => {
    try {
      setIsSubmitting(true)
      await commentService.moderateComment(commentId, { is_moderated: isModerated })
      
      // Update the comment moderation status in the local state
      const updateModerationInTree = (comments: CommentWithAuthor[]): CommentWithAuthor[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, is_moderated: isModerated }
          }
          if (comment.replies) {
            return { ...comment, replies: updateModerationInTree(comment.replies) }
          }
          return comment
        })
      }
      
      setComments(updateModerationInTree(comments))
    } catch (error) {
      console.error('Error moderating comment:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('comments.title')} ({comments.length})
        </h3>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadComments}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            {t('buttons.retry')}
          </button>
        </div>
      )}

      {/* Comment Form */}
      {user ? (
        <CommentForm
          onSubmit={handleCreateComment}
          placeholder={t('comments.placeholder')}
          submitLabel={t('comments.submit')}
          isLoading={isSubmitting}
        />
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">
            {t('comments.loginRequired')}
          </p>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onModerate={handleModerateComment}
              canModerate={canModerate}
              isLoading={isSubmitting}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {t('comments.noComments')}
          </p>
        </div>
      )}
    </div>
  )
}