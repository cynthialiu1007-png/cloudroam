/**
 * @deprecated Cloudroam 现在使用 SVG 生成氛围图（零外部依赖）
 * 请从 '@/lib/ai/ambient' 引入 generateAmbientSvg
 */
export function searchAmbientImage(): never {
  throw new Error('unsplash.ts is deprecated. Use generateAmbientSvg from @/lib/ai/ambient instead.')
}
