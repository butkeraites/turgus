import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CommentWithAuthor, CommentFormData } from '../../types/comment'
import { useAuth } from '../../contexts/AuthContext'
import { CommentForm } from './CommentForm'

interface CommentItemProps {
  comment: CommentWithAuthor
  onReply?: (parentId: string, data: CommentFormData) => Promise<void>
  onEdit?: (commentId: string, content: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  onModerate?: (commentId: string, isModerated: boolean) => Promise<void>
  canModerate?: boolean
  isLoading?: boolean
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onModerate,
  canModerate = false,
  isLoading = false
}) => {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const isAuthor = user && 
    comment.author_id === user.id && 
    comment.author_type === user.type

  const canEdit = isAuthor
  const canDelete = isAuthor || canModerate

  const handleReply = async (data: CommentFormData) => {
    if (onReply) {
      await onReply(comment.id, data)
      setIsReplying(false)
    }
  }

  const handleEdit = async (data: CommentFormData) => {
    if (onEdit) {
      await onEdit(comment.id, data.content)
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (onDelete && window.confirm(t('comments.confirmDelete'))) {
      await onDelete(comment.id)
    }
  }

  const handleModerate = async () => {
    if (onModerate) {
      await onModerate(comment.id, !comment.is_moderated)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {comment.author_name}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              comment.author_type === 'seller' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {t(`user.${comment.author_type}`)}
            </span>
            {comment.is_moderated && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                {t('comments.moderated')}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {formatDate(comment.created_at)}
            </span>
            {(canEdit || canDelete || canModerate) && (
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <CommentForm
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
            initialContent={comment.content}
            submitLabel={t('buttons.update')}
            isLoading={isLoading}
          />
        ) : (
          <div className="text-gray-800 whitespace-pre-wrap mb-3">
            {comment.content}
          </div>
        )}

        {/* Actions Menu */}
        {showActions && (
          <div className="flex gap-2 mb-3">
            {canEdit && (
              <button
                onClick={() => {
                  setIsEditing(true)
                  setShowActions(false)
                }}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {t('buttons.edit')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {t('buttons.delete')}
              </button>
            )}
            {canModerate && (
              <button
                onClick={handleModerate}
                disabled={isLoading}
                className="text-sm text-orange-600 hover:text-orange-800 disabled:opacity-50"
              >
                {comment.is_moderated ? t('comments.unmoderate') : t('comments.moderate')}
              </button>
            )}
          </div>
        )}

        {/* Reply Button */}
        {!isEditing && user && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsReplying(!isReplying)}
              disabled={isLoading}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              {t('comments.reply')}
            </button>
          </div>
        )}
      </div>

      {/* Reply Form */}
      {isReplying && (
        <CommentForm
          onSubmit={handleReply}
          onCancel={() => setIsReplying(false)}
          placeholder={t('comments.replyPlaceholder')}
          submitLabel={t('comments.reply')}
          isReply={true}
          isLoading={isLoading}
        />
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onModerate={onModerate}
              canModerate={canModerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  )
}