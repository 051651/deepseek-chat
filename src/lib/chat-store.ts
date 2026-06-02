'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, Message, ModelType, ViewMode } from '@/types/chat'
import { generateId } from './utils'

interface ChatState {
  conversations: Conversation[]
  currentId: string | null
  viewMode: ViewMode
  _hydrated: boolean // persist 是否已从 localStorage 恢复完成

  // 会话操作
  newConversation: (model?: ModelType) => string
  switchConversation: (id: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void

  // 消息操作
  addMessage: (conversationId: string, message: Message) => void
  updateLastAssistantMessage: (conversationId: string, content: string, reasoning?: string) => void
  appendToLastAssistantMessage: (conversationId: string, chunk: string, reasoningChunk?: string) => void

  // 模型设置
  setModel: (conversationId: string, model: ModelType) => void
  setWebSearch: (conversationId: string, enabled: boolean) => void

  // 视图模式
  setViewMode: (mode: ViewMode) => void

  // 获取当前会话
  currentConversation: () => Conversation | undefined

  // 数据迁移
  exportData: () => string
  importData: (json: string) => { added: number; skipped: number }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentId: null,
      viewMode: 'chat',
      _hydrated: false,

      newConversation: (model = 'flash') => {
        const id = generateId()
        const conv: Conversation = {
          id,
          title: '新对话',
          messages: [],
          model,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          webSearchEnabled: false,
        }
        set((state) => ({
          conversations: [conv, ...state.conversations],
          currentId: id,
        }))
        return id
      },

      switchConversation: (id) => {
        set({ currentId: id })
      },

      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id)
          return {
            conversations: filtered,
            currentId: state.currentId === id
              ? (filtered[0]?.id ?? null)
              : state.currentId,
          }
        })
      },

      renameConversation: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
          ),
        }))
      },

      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: Date.now(),
                  title:
                    c.title === '新对话' && message.role === 'user'
                      ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
                      : c.title,
                }
              : c
          ),
        }))
      },

      updateLastAssistantMessage: (conversationId, content, reasoning) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m, i) =>
                    i === c.messages.length - 1 && m.role === 'assistant'
                      ? { ...m, content, reasoning: reasoning || m.reasoning }
                      : m
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        }))
      },

      appendToLastAssistantMessage: (conversationId, chunk, reasoningChunk) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m, i) =>
                    i === c.messages.length - 1 && m.role === 'assistant'
                      ? {
                          ...m,
                          content: m.content + chunk,
                          reasoning: reasoningChunk
                            ? (m.reasoning || '') + reasoningChunk
                            : m.reasoning,
                        }
                      : m
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        }))
      },

      setModel: (conversationId, model) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, model } : c
          ),
        }))
      },

      setWebSearch: (conversationId, enabled) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, webSearchEnabled: enabled } : c
          ),
        }))
      },

      setViewMode: (mode) => {
        set({ viewMode: mode })
      },

      currentConversation: () => {
        const { conversations, currentId } = get()
        return conversations.find((c) => c.id === currentId)
      },

      exportData: () => {
        const { conversations, currentId } = get()
        return JSON.stringify(
          { version: 1, exportedAt: Date.now(), conversations, currentId },
          null,
          2
        )
      },

      importData: (json: string) => {
        let added = 0
        let skipped = 0
        try {
          const data = JSON.parse(json)
          if (!data.conversations || !Array.isArray(data.conversations)) {
            throw new Error('无效的备份文件格式')
          }

          const existingIds = new Set(get().conversations.map((c) => c.id))
          const imports = data.conversations as Conversation[]

          const newConversations: Conversation[] = []
          for (const conv of imports) {
            // 跳过无效数据
            if (!conv.id || !Array.isArray(conv.messages)) {
              skipped++
              continue
            }
            // 跳过 ID 重复的对话
            if (existingIds.has(conv.id)) {
              skipped++
              continue
            }
            existingIds.add(conv.id)
            newConversations.push(conv)
            added++
          }

          if (newConversations.length > 0) {
            set((state) => ({
              conversations: [...newConversations, ...state.conversations],
            }))
          }
        } catch (e) {
          throw new Error(
            e instanceof Error ? e.message : '无法解析备份文件'
          )
        }
        return { added, skipped }
      },
    }),
    {
      name: 'web-chat-storage',
      // 等待 localStorage 恢复完成后再标记 hydration
      onRehydrateStorage: () => {
        return () => {
          useChatStore.setState({ _hydrated: true })
        }
      },
    }
  )
)
