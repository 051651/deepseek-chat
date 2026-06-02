export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  reasoning?: string // Pro 模型的思考过程
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  model: ModelType
  createdAt: number
  updatedAt: number
  webSearchEnabled: boolean
}

export type ModelType = 'flash' | 'pro'
export type ViewMode = 'chat' | 'deepseek'
