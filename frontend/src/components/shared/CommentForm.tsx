import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CommentFormData } from '../../types/comment'

interface CommentFormProps {
  onSubmit: (data: CommentFormData) => Promise<void>
  onCancel?: () => void
  initialContent?: string
  parentCommentId?: string
  placeholder?: string
  submitLabel?: string
  isReply?: boolean
  isLoading?: boolean
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  initialContent = '',
  parentCommentId,
  placeholder,
  submitLabel,
  isReply = false,
  isLoading = false
}) => {
  const { t } = useTranslation('common')
  const [content, setContent] = useState(initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        content: content.trim(),
        parent_comment_id: parentCommentId
      })
      setContent('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setContent(initialContent)
    onCancel?.()
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${isReply ? 'ml-8' : ''}`}>
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || t('comments.placeholder')}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={isReply ? 2 : 3}
          maxLength={1000}
          disabled={isSubmitting || isLoading}
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {content.length}/1000
        </div>
      </div>
      
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting || isLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {t('buttons.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('buttons.submitting') : (submitLabel || t('buttons.submit'))}
        </button>
      </div>
    </form>
  )
}