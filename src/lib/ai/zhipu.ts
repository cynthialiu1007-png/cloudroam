/**
 * 智谱 AI GLM-4-Flash 客户端 + 场景生成
 *
 * 为什么选智谱：
 *   - 国内直连，无需科学上网
 *   - GLM-4-Flash 完全免费（每月 2000 万 tokens 免费额度）
 *   - 100% OpenAI 兼容协议
 *   - 支持 tool calling（function calling）
 *   - 中文能力优秀
 *
 * 获取 API Key：https://open.bigmodel.cn/
 * 手机号注册即可，无需信用卡。
 */

if (!process.env.ZHIPU_API_KEY) {
  throw new Error('ZHIPU_API_KEY is not set')
}

const ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
export const MODEL_ID = process.env.ZHIPU_MODEL || 'glm-4-flash'

// ============================================================
// 场景生成
// ============================================================

export type GeneratedScene = {
  description: string
  image_keyword: string
  options: Array<{ id: string; label: string }>
}

// OpenAI 兼容格式的 tool 定义
const commitSceneTool = {
  type: 'function' as const,
  function: {
    name: 'commit_scene',
    description: '将当前旅行场景以结构化格式提交给用户。',
    parameters: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: '用第二人称、富有画面感、诗意但克制的中文，描述你此刻置身的场景。80–140 字。避免"你看到""你听到"这种旁白式开头，直接进入画面。',
        },
        image_keyword: {
          type: 'string',
          description: '简短的中文氛围关键词（3-8 个字），描述这个场景的画面主色调和意境。例："夜晚的东京街道"、"清晨的雪山"、"雨中的老城"',
        },
        options: {
          type: 'array',
          description: '恰好 3 个下一步选项，动词开头，每个 6–14 个汉字，行为具体且互相有区分度。id 必须依次是 "a"、"b"、"c"。',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', enum: ['a', 'b', 'c'] },
              label: { type: 'string' },
            },
            required: ['id', 'label'],
          },
          minItems: 3,
          maxItems: 3,
        },
      },
      required: ['description', 'image_keyword', 'options'],
    },
  },
}

const SYSTEM_PROMPT = `你是「云游」的场景叙述者——一位有王家卫电影气质的旅行作家。你的文字节制、具体、有质感。

风格要点：
- 中文原生表达，不要翻译腔。
- 用具体细节承载情绪：光线、气味、声响、材质，而不是抽象形容词。
- 一句一意象，短句为主，长短交替。
- 避免"你看到""你听到"这种指令式开头。直接进入画面。
- 每个场景末尾都必须通过 commit_scene 工具提交 3 个"下一步"选项，动词开头，具体到一个动作或一个方向。选项之间要有真实的岔路感，不是同一件事的三种说法。选项 id 必须依次是 "a"、"b"、"c"。

用户不能看到你回复的纯文本，你必须调用 commit_scene 工具输出。`

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ChatResponse = {
  choices: Array<{
    message: {
      content: string | null
      tool_calls?: Array<{
        id: string
        type: string
        function: {
          name: string
          arguments: string // JSON 字符串
        }
      }>
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

async function chat(messages: ChatMessage[]): Promise<GeneratedScene> {
  const MAX_RETRIES = 2
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ZHIPU_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages,
          tools: [commitSceneTool],
          tool_choice: { type: 'function', function: { name: 'commit_scene' } },
          temperature: 0.85,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Zhipu API error ${res.status}: ${errText}`)
      }

      const data = (await res.json()) as ChatResponse

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
      if (!toolCall || toolCall.function.name !== 'commit_scene') {
        throw new Error('模型没有调用 commit_scene 工具')
      }

      let args: GeneratedScene
      try {
        args = JSON.parse(toolCall.function.arguments)
      } catch (err) {
        throw new Error(`解析 tool arguments 失败: ${err}`)
      }

      if (!Array.isArray(args.options) || args.options.length !== 3) {
        throw new Error(`需要恰好 3 个选项，实际 ${args.options?.length ?? 0}`)
      }

      // 服务端强制归正 option id 为 a/b/c
      return {
        description: args.description,
        image_keyword: args.image_keyword,
        options: args.options.map((o, i) => ({
          id: ['a', 'b', 'c'][i],
          label: o.label,
        })),
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`[Zhipu] Attempt ${attempt + 1} failed: ${lastError.message}`)

      if (attempt < MAX_RETRIES) {
        // 等待后重试（指数退避：200ms, 400ms）
        const delay = 200 * Math.pow(2, attempt)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  // 所有重试都失败了
  throw lastError || new Error('未知的 Zhipu API 错误')
}

// ============================================================
// 对外 API
// ============================================================

type GenerateFirstSceneInput = { city: string }

export async function generateFirstScene({ city }: GenerateFirstSceneInput): Promise<GeneratedScene> {
  return chat([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `开启一段以【${city}】为起点的旅行。这是第一个场景——用户刚刚"抵达"，需要建立氛围和场所感。给我这里此刻的画面。`,
    },
  ])
}

type GenerateNextSceneInput = {
  city: string
  history: Array<{ description: string; chosen_label: string }>
  chosen_label: string
}

export async function generateNextScene({
  city,
  history,
  chosen_label,
}: GenerateNextSceneInput): Promise<GeneratedScene> {
  const recent = history.slice(-4)
  const historyBrief = recent
    .map((h, i) => `[${i + 1}] ${h.description}\n    → 大家选择了：${h.chosen_label}`)
    .join('\n\n')

  return chat([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `这是一段在【${city}】展开的漫游。到目前为止走过的场景：

${historyBrief}

刚刚大家选择了「${chosen_label}」。基于这个选择，生成下一个场景——延续时间线，画面要自然过渡（不要突然跳到别的城市），也可以引入新的感官细节。`,
    },
  ])
}
