'use client'

import { cn } from '@/lib/utils'
import type { ModelType } from '@/types/chat'
import { Zap, Brain } from 'lucide-react'

interface ModelSelectorProps {
  value: ModelType
  onChange: (model: ModelType) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-[var(--ds-bg-tertiary)] rounded-lg p-0.5 border border-[var(--ds-border)]">
      <button
        onClick={() => onChange('flash')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
          value === 'flash'
            ? 'bg-[var(--ds-bg-hover)] text-[var(--ds-text)] shadow-sm'
            : 'text-[var(--ds-text-muted)] hover:text-[var(--ds-text-secondary)]'
        )}
      >
        <Zap size={14} className={value === 'flash' ? 'text-[var(--ds-accent)]' : ''} />
        Flash
      </button>
      <button
        onClick={() => onChange('pro')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
          value === 'pro'
            ? 'bg-[var(--ds-bg-hover)] text-[var(--ds-text)] shadow-sm'
            : 'text-[var(--ds-text-muted)] hover:text-[var(--ds-text-secondary)]'
        )}
      >
        <Brain size={14} className={value === 'pro' ? 'text-[var(--ds-accent)]' : ''} />
        Pro
      </button>
    </div>
  )
}
