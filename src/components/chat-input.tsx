'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { ModelSelector } from './model-selector'
import type { ModelType } from '@/types/chat'

interface ChatInputProps {
  onSend: (content: string) => void
  model: ModelType
  onModelChange: (model: ModelType) => void
  isLoading: boolean
}

export function ChatInput({
  onSend,
  model,
  onModelChange,
  isLoading,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-[var(--ds-border)] bg-[var(--ds-bg)]">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Toolbar */}
        <div className="flex items-center mb-2">
          <ModelSelector value={model} onChange={onModelChange} />
        </div>

        {/* Input area */}
        <div className="flex items-end gap-2 bg-[var(--ds-bg-tertiary)] rounded-2xl border border-[var(--ds-border)] focus-within:border-[var(--ds-accent)] transition-colors duration-200 px-4 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-[var(--ds-text)] placeholder-[var(--ds-text-muted)] resize-none outline-none max-h-[200px] py-1"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--ds-accent)] text-white flex items-center justify-center hover:bg-[var(--ds-accent-hover)] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowUp size={16} />
            )}
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-[var(--ds-text-muted)] text-center mt-2">
          DeepSeek 可能会产生不准确的信息，请自行核实。
        </p>
      </div>
    </div>
  )
}
