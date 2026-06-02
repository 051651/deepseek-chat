'use client'

import { useRef, useState } from 'react'
import { cn, formatTime } from '@/lib/utils'
import {
  MessageSquare, Plus, Trash2, ExternalLink, Sparkles,
  PanelRightOpen, PanelRightClose, Download, Upload, X,
} from 'lucide-react'
import { useChatStore } from '@/lib/chat-store'
import type { Conversation, ViewMode } from '@/types/chat'

interface SidebarProps {
  conversations: Conversation[]
  currentId: string | null
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  /** 移动端关闭回调 */
  onClose?: () => void
}

export function Sidebar({
  conversations,
  currentId,
  onNew,
  onSelect,
  onDelete,
  viewMode,
  onViewModeChange,
  onClose,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [importMsg, setImportMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 导出对话
  const handleExport = () => {
    try {
      const json = useChatStore.getState().exportData()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const now = new Date()
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      a.download = `deepseek-chat-${stamp}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setImportMsg({ type: 'err', text: '导出失败' })
      setTimeout(() => setImportMsg(null), 3000)
    }
  }

  // 导入对话
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setImportMsg({ type: 'err', text: '只支持 .json 文件' })
      setTimeout(() => setImportMsg(null), 3000)
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = reader.result as string
        const { added, skipped } = useChatStore.getState().importData(json)
        if (added > 0) {
          setImportMsg({ type: 'ok', text: `已导入 ${added} 个对话` + (skipped > 0 ? `，跳过 ${skipped} 个重复` : '') })
        } else {
          setImportMsg({ type: 'err', text: '没有可导入的对话（可能已存在）' })
        }
      } catch (err) {
        setImportMsg({ type: 'err', text: err instanceof Error ? err.message : '导入失败' })
      }
      setTimeout(() => setImportMsg(null), 4000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSelect = (id: string) => {
    onSelect(id)
    onClose?.()
  }

  const handleNew = () => {
    onNew()
    onClose?.()
  }

  // 桌面端折叠状态
  if (collapsed) {
    return (
      <div className="hidden md:flex flex-col items-center py-3 px-1 bg-[var(--ds-bg-secondary)] border-r border-[var(--ds-border)]">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-bg-hover)] transition-colors"
          title="展开侧边栏"
        >
          <PanelRightOpen size={18} />
        </button>
        <button
          onClick={handleNew}
          className="mt-4 p-2 rounded-lg text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-bg-hover)] transition-colors"
          title="新建对话"
        >
          <Plus size={18} />
        </button>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          className="p-2 rounded-lg text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-bg-hover)] transition-colors"
          title="导出备份"
        >
          <Download size={18} />
        </button>
        <button
          onClick={handleImport}
          className="mt-1 p-2 rounded-lg text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-bg-hover)] transition-colors"
          title="导入备份"
        >
          <Upload size={18} />
        </button>
        <button
          onClick={() => onViewModeChange(viewMode === 'chat' ? 'deepseek' : 'chat')}
          className={cn(
            'mt-1 p-2 rounded-lg transition-colors',
            viewMode === 'deepseek'
              ? 'text-[var(--ds-accent)] bg-[var(--ds-accent-muted)]'
              : 'text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-bg-hover)]'
          )}
          title="DeepSeek 官网"
        >
          <ExternalLink size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full md:w-64 bg-[var(--ds-bg-secondary)] border-r border-[var(--ds-border)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--ds-border)]">
        {/* 桌面端：折叠按钮；移动端：关闭按钮 */}
        <button
          onClick={() => onClose ? onClose() : setCollapsed(true)}
          className="p-1 rounded-md text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-bg-hover)] transition-colors"
          title={onClose ? '关闭菜单' : '收起侧边栏'}
        >
          {onClose ? <X size={16} /> : <PanelRightClose size={16} />}
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Sparkles size={18} className="text-[var(--ds-accent)]" />
          <span className="text-sm font-semibold text-[var(--ds-text)]">DeepSeek Chat</span>
        </div>
      </div>

      {/* New chat button */}
      <div className="px-3 py-3">
        <button
          onClick={handleNew}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--ds-text)] bg-[var(--ds-bg-tertiary)] hover:bg-[var(--ds-bg-hover)] border border-[var(--ds-border)] transition-all duration-200"
        >
          <Plus size={16} />
          新建对话
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-[var(--ds-text-muted)]">暂无对话记录</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200',
                  conv.id === currentId
                    ? 'bg-[var(--ds-bg-hover)] text-[var(--ds-text)]'
                    : 'text-[var(--ds-text-secondary)] hover:bg-[var(--ds-bg-hover)] hover:text-[var(--ds-text)]'
                )}
                onClick={() => handleSelect(conv.id)}
              >
                <MessageSquare size={14} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{conv.title}</p>
                  <p className="text-xs text-[var(--ds-text-muted)] mt-0.5">
                    {formatTime(conv.updatedAt)}
                    <span className="ml-1.5">{conv.model === 'pro' ? 'Pro' : 'Flash'}</span>
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(conv.id)
                  }}
                  className="flex-shrink-0 p-1 rounded-md text-[var(--ds-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--ds-danger)] hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import message toast */}
      {importMsg && (
        <div
          className={cn(
            'mx-3 px-3 py-2 rounded-lg text-xs',
            importMsg.type === 'ok'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          )}
        >
          {importMsg.text}
        </div>
      )}

      {/* Bottom actions */}
      <div className="px-3 py-2 border-t border-[var(--ds-border)] space-y-1">
        <div className="flex gap-1">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg text-xs text-[var(--ds-text-secondary)] hover:bg-[var(--ds-bg-hover)] hover:text-[var(--ds-text)] transition-all duration-200"
          >
            <Download size={14} />
            导出备份
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg text-xs text-[var(--ds-text-secondary)] hover:bg-[var(--ds-bg-hover)] hover:text-[var(--ds-text)] transition-all duration-200"
          >
            <Upload size={14} />
            导入恢复
          </button>
        </div>
        <button
          onClick={() => onViewModeChange(viewMode === 'chat' ? 'deepseek' : 'chat')}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
            viewMode === 'deepseek'
              ? 'bg-[var(--ds-accent-muted)] text-[var(--ds-accent)] border border-[var(--ds-accent)]'
              : 'text-[var(--ds-text-secondary)] hover:bg-[var(--ds-bg-hover)] hover:text-[var(--ds-text)] border border-transparent'
          )}
        >
          <ExternalLink size={16} />
          <span>访问 DeepSeek 官网</span>
        </button>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
