/**
 * SVG 渐变氛围图生成器
 *
 * 输入：场景关键词（如"夜晚的东京街道"、"清晨的雪山"）
 * 输出：一张 data URI 编码的 SVG，包含：
 *   - 一个主色调渐变（根据关键词从预设色板挑选）
 *   - 一些氛围噪点/星光/雾气叠加
 *   - 电影级的暗角效果
 *
 * 优点：
 *   - 零外部依赖（不调用任何图片 API）
 *   - 国内、海外、断网都能显示
 *   - 每次都不重样（随机噪点位置）
 *   - 加载瞬间（就是一段字符串）
 */

// 色调映射：每种意境对应一套渐变色
type Palette = {
  name: string
  keywords: string[]  // 匹配的关键词（部分匹配）
  colors: [string, string, string]  // 顶部→中部→底部
  overlay: string     // 叠加色（如雾、雪、光）
  particles: 'stars' | 'snow' | 'rain' | 'dust' | 'none'
}

const PALETTES: Palette[] = [
  {
    name: '深夜蓝',
    keywords: ['夜', '晚', '深夜', '凌晨', '黑', '暗'],
    colors: ['#0B1930', '#1F3B5C', '#0A1220'],
    overlay: 'rgba(212, 185, 108, 0.05)',
    particles: 'stars',
  },
  {
    name: '暮光紫',
    keywords: ['黄昏', '傍晚', '日落', '夕阳', '暮'],
    colors: ['#6B4E7D', '#B87F80', '#3A2340'],
    overlay: 'rgba(255, 200, 150, 0.08)',
    particles: 'dust',
  },
  {
    name: '晨雾灰',
    keywords: ['清晨', '晨', '早上', '拂晓', '破晓', '雾'],
    colors: ['#B4C4CE', '#8FA0AB', '#4A5A66'],
    overlay: 'rgba(237, 229, 211, 0.15)',
    particles: 'none',
  },
  {
    name: '正午金',
    keywords: ['正午', '中午', '午后', '晴', '阳光', '烈日'],
    colors: ['#7BA3C4', '#D4B96C', '#8B6F3E'],
    overlay: 'rgba(255, 220, 130, 0.1)',
    particles: 'dust',
  },
  {
    name: '雪日白',
    keywords: ['雪', '冬', '冰'],
    colors: ['#8FA3B0', '#C8D4DC', '#6E7F8A'],
    overlay: 'rgba(255, 255, 255, 0.12)',
    particles: 'snow',
  },
  {
    name: '雨日青',
    keywords: ['雨', '潮湿', '水'],
    colors: ['#3D5566', '#5C7788', '#28353E'],
    overlay: 'rgba(180, 200, 220, 0.1)',
    particles: 'rain',
  },
  {
    name: '樱花粉',
    keywords: ['樱', '春', '花', '粉'],
    colors: ['#C99AB2', '#E8CFD5', '#8B6478'],
    overlay: 'rgba(255, 220, 235, 0.12)',
    particles: 'dust',
  },
  {
    name: '森林绿',
    keywords: ['森林', '林', '树', '竹', '苔', '草原', '山谷'],
    colors: ['#4A6B4A', '#7FA07F', '#2C3E2C'],
    overlay: 'rgba(212, 185, 108, 0.06)',
    particles: 'dust',
  },
  {
    name: '沙漠橙',
    keywords: ['沙漠', '戈壁', '大漠', '黄沙'],
    colors: ['#D4A76A', '#B87340', '#6B3E20'],
    overlay: 'rgba(255, 200, 100, 0.1)',
    particles: 'dust',
  },
  {
    name: '海滨蓝',
    keywords: ['海', '海边', '海岸', '海滩', '港'],
    colors: ['#4A7A8C', '#7FA9BC', '#2D4B58'],
    overlay: 'rgba(237, 229, 211, 0.08)',
    particles: 'none',
  },
  {
    name: '老城暖',
    keywords: ['老城', '古镇', '巷', '胡同', '街道', '广场', '教堂'],
    colors: ['#A67B5B', '#D9B380', '#5B3E28'],
    overlay: 'rgba(255, 200, 130, 0.09)',
    particles: 'dust',
  },
  {
    name: '茶室静',
    keywords: ['茶', '室内', '木', '和室', '榻榻米', '屋'],
    colors: ['#6B5340', '#A08668', '#3A2D22'],
    overlay: 'rgba(212, 185, 108, 0.1)',
    particles: 'dust',
  },
]

// 默认：如果没匹配到任何关键词，用一个中性的电影感深蓝
const DEFAULT_PALETTE: Palette = {
  name: '默认深蓝',
  keywords: [],
  colors: ['#1A2838', '#2D4256', '#0F1419'],
  overlay: 'rgba(212, 185, 108, 0.05)',
  particles: 'dust',
}

function pickPalette(keyword: string): Palette {
  if (!keyword) return DEFAULT_PALETTE
  const kw = keyword.toLowerCase()
  // 找到匹配的调色板（可能匹配多个，选第一个匹配到的最长关键词的）
  let best: { palette: Palette; matchLen: number } | null = null
  for (const p of PALETTES) {
    for (const k of p.keywords) {
      if (kw.includes(k.toLowerCase())) {
        if (!best || k.length > best.matchLen) {
          best = { palette: p, matchLen: k.length }
        }
      }
    }
  }
  return best?.palette ?? DEFAULT_PALETTE
}

/**
 * 用一个稳定的字符串 hash 做伪随机（同关键词永远生成同一张图）
 */
function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) / 0xffffffff)
  }
}

function generateParticles(kind: Palette['particles'], rand: () => number): string {
  if (kind === 'none') return ''

  const count = kind === 'stars' ? 80 : kind === 'snow' ? 60 : kind === 'rain' ? 100 : 40
  const parts: string[] = []

  for (let i = 0; i < count; i++) {
    const x = rand() * 1600
    const y = rand() * 900

    if (kind === 'stars') {
      const r = rand() * 1.2 + 0.3
      const op = rand() * 0.5 + 0.3
      parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#EDE5D3" opacity="${op.toFixed(2)}"/>`)
    } else if (kind === 'snow') {
      const r = rand() * 2.5 + 1
      const op = rand() * 0.4 + 0.3
      parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#FFFFFF" opacity="${op.toFixed(2)}"/>`)
    } else if (kind === 'rain') {
      const len = rand() * 15 + 8
      const op = rand() * 0.25 + 0.1
      parts.push(`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - 4).toFixed(1)}" y2="${(y + len).toFixed(1)}" stroke="#B4C4CE" stroke-width="1" opacity="${op.toFixed(2)}"/>`)
    } else if (kind === 'dust') {
      const r = rand() * 3 + 1
      const op = rand() * 0.15 + 0.05
      parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#EDE5D3" opacity="${op.toFixed(2)}"/>`)
    }
  }
  return parts.join('')
}

/**
 * 生成 SVG 氛围图，返回 data: URI（可以直接用作 CSS background-image）
 */
export function generateAmbientSvg(keyword: string): string {
  const palette = pickPalette(keyword)
  const rand = seededRandom(keyword)

  const [c1, c2, c3] = palette.colors
  const particles = generateParticles(palette.particles, rand)

  // 使用简洁 SVG（不用 URL 编码 style 里的复杂属性），做电影感三段渐变 + 暗角 + 粒子
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="55%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.35" r="0.6">
      <stop offset="0%" stop-color="${palette.overlay.replace('rgba', 'rgb').replace(/,\s*[\d.]+\)/, ')')}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <rect width="1600" height="900" fill="url(#glow)"/>
  ${particles}
  <rect width="1600" height="900" fill="url(#vignette)"/>
</svg>`

  // 编码为 data URI —— 用 encodeURIComponent 而不是 base64，前者对 SVG 更小
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}
