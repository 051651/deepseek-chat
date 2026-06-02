'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { Copy, Check, User, Bot } from 'lucide-react'
import type { Message } from '@/types/chat'
import { ThinkingProcess } from './thinking-process'

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1a2e] text-xs text-[var(--ds-text-secondary)] rounded-t-lg border-b border-[var(--ds-border)]">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 8px 8px',
          fontSize: '0.85rem',
          background: '#0d0d1a',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const content = message.content
  const hasReasoning = !!message.reasoning

  if (!content && !hasReasoning) return null

  return (
    <div className={`message-enter flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-[var(--ds-accent)]'
            : 'bg-[var(--ds-bg-tertiary)] border border-[var(--ds-border)]'
        }`}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-[var(--ds-accent)]" />
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Thinking process for Pro model */}
        {hasReasoning && message.reasoning && (
          <div className="mb-2 w-full">
            <ThinkingProcess
              content={message.reasoning}
              isStreaming={isStreaming && !content}
            />
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-[var(--ds-accent)] text-white rounded-br-md'
              : 'bg-[var(--ds-assistant-bubble)] border border-[var(--ds-border)] text-[var(--ds-text)] rounded-bl-md'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </p>
          ) : (
            <div className="chat-message text-sm leading-relaxed">
              {content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const code = String(children).replace(/\n$/, '')
                      if (code.includes('\n') || match) {
                        return (
                          <CodeBlock
                            language={match?.[1] || ''}
                            code={code}
                          />
                        )
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                    pre({ children }) {
                      return <>{children}</>
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : isStreaming ? (
                <span className="inline-flex items-center gap-1">
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-[var(--ds-text-muted)] inline-block" />
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-[var(--ds-text-muted)] inline-block" />
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-[var(--ds-text-muted)] inline-block" />
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
