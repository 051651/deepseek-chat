'use client'

import { useState } from 'react'
import { ChevronDown, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThinkingProcessProps {
  content: string
  isStreaming?: boolean
}

export function ThinkingProcess({ content, isStreaming }: ThinkingProcessProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="mb-3 rounded-xl border border-[var(--ds-border)] overflow-hidden bg-[var(--ds-bg-secondary)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)] transition-colors"
      >
        <Brain size={14} className="text-[var(--ds-accent)]" />
        <span className="font-medium">思考过程</span>
        {isStreaming && (
          <span className="flex items-center gap-0.5 ml-1">
            <span className="thinking-dot w-1 h-1 rounded-full bg-[var(--ds-text-muted)] inline-block" />
            <span className="thinking-dot w-1 h-1 rounded-full bg-[var(--ds-text-muted)] inline-block" />
            <span className="thinking-dot w-1 h-1 rounded-full bg-[var(--ds-text-muted)] inline-block" />
          </span>
        )}
        <ChevronDown
          size={14}
          className={cn(
            'ml-auto transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </button>
      {expanded && (
        <div className="px-4 pb-3 text-sm text-[var(--ds-text-secondary)] leading-relaxed whitespace-pre-wrap border-t border-[var(--ds-border)] pt-3 mt-0">
          {content || '思考中...'}
        </div>
      )}
    </div>
  )
}
