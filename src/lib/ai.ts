import { deepseek } from '@ai-sdk/deepseek'

/**
 * DeepSeek Flash 模型 - 快速响应
 */
export const flashModel = deepseek('deepseek-chat')

/**
 * DeepSeek Pro 模型 - 深度思考，支持 reasoning
 */
export const proModel = deepseek('deepseek-reasoner')
