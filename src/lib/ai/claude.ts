/**
 * @deprecated 项目已切换到 Google Gemini
 * 请从 '@/lib/ai/gemini' 引入 generateFirstScene / generateNextScene
 * 此文件保留是为了避免误 import，运行时会抛错
 */
export function generateFirstScene(): never {
  throw new Error('claude.ts is deprecated. Import from @/lib/ai/gemini instead.')
}

export function generateNextScene(): never {
  throw new Error('claude.ts is deprecated. Import from @/lib/ai/gemini instead.')
}
