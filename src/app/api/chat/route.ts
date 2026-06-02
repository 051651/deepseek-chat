import { deepseek } from '@ai-sdk/deepseek'
import { streamText } from 'ai'

// Vercel Hobby 方案限制 60 秒，Pro 支持 300 秒
export const maxDuration = 60

// === 限流器 ===
// 每个 IP 每分钟最多 30 次请求
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW = 60_000
const MAX_MESSAGE_CHARS = 100_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  // 清理过期条目（每次请求顺势清理，适配 serverless）
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// 定期清理（serverless 环境下可能不生效，但不影响功能）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key)
    }
  }, 300_000)
}

export async function POST(req: Request) {
  try {
    // --- 1. 限流检查 ---
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1'
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: '请求过于频繁，请稍后再试' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // --- 2. 参数校验 ---
    const { messages, model, webSearch } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: '消息不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 消息体量校验：总内容不超过 100KB
    const totalChars = messages.reduce(
      (sum: number, m: { content?: string }) => sum + (String(m.content || '').length),
      0
    )
    if (totalChars > MAX_MESSAGE_CHARS) {
      return new Response(
        JSON.stringify({ error: '消息内容过长，请精简后重试' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // --- 3. 调用 DeepSeek ---
    const modelId = model === 'pro' ? 'deepseek-reasoner' : 'deepseek-chat'

    const result = streamText({
      model: deepseek(modelId),
      messages: messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
      providerOptions: webSearch
        ? { deepseek: { enable_search: true } }
        : undefined,
    })

    // --- 4. 自定义流格式 ---
    // 使用 newline-delimited JSON：
    //   {"t":"0","c":"text"}    — 正文内容
    //   {"t":"2","c":"reason"}  — 思考过程（Pro 模型）
    //   {"t":"3","c":"error"}   — 错误信息
    //   {"t":"d"}               — 流结束
    const encoder = new TextEncoder()
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of result.fullStream) {
            const eventType = (event as { type: string }).type

            if (eventType === 'text-delta') {
              const chunk = event as unknown as { text: string }
              if (chunk.text) {
                controller.enqueue(
                  encoder.encode(JSON.stringify({ t: '0', c: chunk.text }) + '\n')
                )
              }
            } else if (eventType === 'reasoning-delta') {
              const chunk = event as unknown as { text: string }
              if (chunk.text) {
                controller.enqueue(
                  encoder.encode(JSON.stringify({ t: '2', c: chunk.text }) + '\n')
                )
              }
            } else if (eventType === 'error') {
              const chunk = event as unknown as { error: { message?: string } }
              const msg = chunk.error?.message || '未知错误'
              controller.enqueue(
                encoder.encode(JSON.stringify({ t: '3', c: msg }) + '\n')
              )
            }
            // 其他事件类型（source, tool-call 等）静默忽略
          }
          controller.enqueue(encoder.encode(JSON.stringify({ t: 'd' }) + '\n'))
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown error'
          controller.enqueue(encoder.encode(JSON.stringify({ t: '3', c: msg }) + '\n'))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    const message =
      error instanceof Error ? error.message : '请求失败，请稍后重试'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
