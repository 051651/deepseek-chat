'use client'

import { useState } from 'react'
import { ExternalLink, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

interface DeepSeekEmbedProps {
  onBack: () => void
}

export function DeepSeekEmbed({ onBack }: DeepSeekEmbedProps) {
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)

  const handleIframeLoad = () => {
    setLoading(false)
  }

  const handleIframeError = () => {
    setLoadError(true)
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full bg-[var(--ds-bg)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--ds-border)] bg-[var(--ds-bg-secondary)]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)] transition-colors"
        >
          <ArrowLeft size={16} />
          返回聊天
        </button>
        <div className="flex-1" />
        <a
          href="https://chat.deepseek.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] transition-colors"
        >
          <ExternalLink size={14} />
          在新标签页打开
        </a>
      </div>

      {/* Iframe / Fallback */}
      <div className="flex-1 relative">
        {loading && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--ds-bg)]">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={24} className="text-[var(--ds-text-muted)] animate-spin" />
              <p className="text-sm text-[var(--ds-text-secondary)]">正在加载 DeepSeek 官网...</p>
            </div>
          </div>
        )}

        {loadError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--ds-bg)]">
            <div className="flex flex-col items-center gap-4 max-w-md text-center px-8">
              <AlertTriangle size={40} className="text-[var(--ds-warning)]" />
              <h3 className="text-lg font-medium text-[var(--ds-text)]">无法嵌入显示</h3>
              <p className="text-sm text-[var(--ds-text-secondary)] leading-relaxed">
                DeepSeek 官网出于安全原因，不允许在外部网站中嵌入显示。
                <br />
                请点击下方按钮在新标签页中访问。
              </p>
              <a
                href="https://chat.deepseek.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--ds-accent)] text-white text-sm font-medium hover:bg-[var(--ds-accent-hover)] transition-colors"
              >
                <ExternalLink size={16} />
                打开 DeepSeek 官网
              </a>
            </div>
          </div>
        ) : (
          <iframe
            id="deepseek-iframe"
            src="https://chat.deepseek.com"
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="DeepSeek 官网"
            // allow-scripts 允许 iframe 内的 JS 运行；不带 allow-same-origin
            // 避免 sandbox 被绕过的安全风险
            sandbox="allow-scripts allow-forms allow-popups"
          />
        )}
      </div>
    </div>
  )
}
