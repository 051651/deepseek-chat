'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore } from '@/lib/chat-store'
import { Sidebar } from '@/components/sidebar'
import { ChatMessage } from '@/components/chat-message'
import { ChatInput } from '@/components/chat-input'
import { DeepSeekEmbed } from '@/components/deepseek-embed'
import { generateId } from '@/lib/utils'
import type { Message, ModelType } from '@/types/chat'
import { MessageSquare } from 'lucide-react'

export default function Home() {
  const {
    conversations,
    currentId,
    viewMode,
    _hydrated,
    newConversation,
    switchConversation,
    deleteConversation,
    addMessage,
    appendToLastAssistantMessage,
    updateLastAssistantMessage,
    setModel,
    setViewMode,
  } = useChatStore()

  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conv = conversations.find((c) => c.id === currentId)

  // 初始化：等 localStorage 恢复完成后，没有对话就创建一个
  useEffect(() => {
    if (!_hydrated) return

    if (conversations.length === 0) {
      newConversation()
    } else if (!currentId) {
      switchConversation(conversations[0].id)
    }
  }, [_hydrated, conversations.length, currentId, newConversation, switchConversation])

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 50)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [conv?.messages, scrollToBottom])

  // 发送消息
  const handleSend = async (content: string) => {
    if (isLoading) return

    let convId = currentId
    if (!convId) {
      convId = newConversation()
    }

    const currentConv = useChatStore.getState().conversations.find((c) => c.id === convId)
    if (!currentConv) return

    // 添加用户消息
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    addMessage(convId, userMsg)

    // 创建 AI 回复占位消息
    const assistantId = generateId()
    addMessage(convId, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    })

    // 开始流式请求
    setIsLoading(true)
    const abortController = new AbortController()
    abortRef.current = abortController

    // 获取最新的消息列表用于 API 请求
    const updatedConv = useChatStore.getState().conversations.find((c) => c.id === convId)
    if (!updatedConv) {
      setIsLoading(false)
      return
    }

    const apiMessages = updatedConv.messages
      .filter((m) => m.id !== assistantId) // 排除占位消息
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: updatedConv.model,
          webSearch: updatedConv.webSearchEnabled,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.error || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      let fullReasoning = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留未完成的行

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line)
            if (data.t === '0') {
              // 文本内容
              fullContent += data.c
              appendToLastAssistantMessage(convId, data.c)
              scrollToBottom()
            } else if (data.t === '2') {
              // 推理/思考过程
              fullReasoning += data.c
              appendToLastAssistantMessage(convId, '', data.c)
            } else if (data.t === '3') {
              // 错误
              console.error('Stream error:', data.c)
              appendToLastAssistantMessage(convId, `\n\n> ⚠️ ${data.c}`)
            }
          } catch (e) {
            // 解析失败的行忽略
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 用户取消
        return
      }
      console.error('Chat error:', error)
      updateLastAssistantMessage(
        convId,
        '抱歉，请求出错了。请检查 API Key 是否正确配置，或稍后重试。'
      )
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  // 停止生成
  const handleStop = () => {
    abortRef.current?.abort()
    setIsLoading(false)
  }

  // 新建对话
  const handleNewConversation = () => {
    if (isLoading) {
      abortRef.current?.abort()
      setIsLoading(false)
    }
    newConversation()
  }

  // 切换模型
  const handleModelChange = (model: ModelType) => {
    if (currentId) {
      setModel(currentId, model)
    }
  }

  // DeepSeek 官网嵌入模式
  if (viewMode === 'deepseek') {
    return (
      <div className="flex h-full">
        <Sidebar
          conversations={conversations}
          currentId={currentId}
          onNew={handleNewConversation}
          onSelect={switchConversation}
          onDelete={deleteConversation}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <div className="flex-1">
          <DeepSeekEmbed onBack={() => setViewMode('chat')} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        onNew={handleNewConversation}
        onSelect={switchConversation}
        onDelete={deleteConversation}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {conv && conv.messages.length > 0 ? (
              <div className="space-y-6">
                {conv.messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isStreaming={isLoading && msg.id === conv.messages[conv.messages.length - 1]?.id && msg.role === 'assistant'}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* 欢迎页面 */
              <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--ds-accent-muted)] flex items-center justify-center">
                    <MessageSquare size={24} className="text-[var(--ds-accent)]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-[var(--ds-text)]">DeepSeek Chat</h1>
                    <p className="text-sm text-[var(--ds-text-secondary)]">
                      {conv?.model === 'pro' ? '深度思考模式 · Pro' : '快速响应模式 · Flash'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                  {[
                    { title: '代码编写', desc: '生成代码、调试、解释' },
                    { title: '文档分析', desc: '上传文件进行分析总结' },
                    { title: '联网搜索', desc: '开启搜索获取实时信息' },
                  ].map((item) => (
                    <button
                      key={item.title}
                      onClick={() => handleSend(`请帮我${item.desc}`)}
                      className="text-left p-4 rounded-xl bg-[var(--ds-bg-secondary)] border border-[var(--ds-border)] hover:bg-[var(--ds-bg-hover)] transition-all duration-200"
                    >
                      <p className="text-sm font-medium text-[var(--ds-text)] mb-1">{item.title}</p>
                      <p className="text-xs text-[var(--ds-text-muted)]">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 输入区域 */}
        <ChatInput
          onSend={handleSend}
          model={conv?.model || 'flash'}
          onModelChange={handleModelChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
