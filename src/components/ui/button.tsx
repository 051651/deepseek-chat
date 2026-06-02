import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'icon'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ds-accent)] focus:ring-offset-2 focus:ring-offset-[var(--ds-bg)] disabled:opacity-50 disabled:pointer-events-none',
        {
          'bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)] active:scale-[0.98]':
            variant === 'primary',
          'bg-[var(--ds-bg-tertiary)] text-[var(--ds-text)] hover:bg-[var(--ds-bg-hover)] border border-[var(--ds-border)]':
            variant === 'secondary',
          'text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-bg-hover)]':
            variant === 'ghost',
          'text-[var(--ds-danger)] hover:bg-red-500/10': variant === 'danger',
        },
        {
          'h-9 px-3 text-sm gap-1.5': size === 'sm',
          'h-10 px-4 text-sm gap-2': size === 'md',
          'h-9 w-9': size === 'icon',
        },
        className
      )}
      {...props}
    />
  )
}
