import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // 云游品牌色板 · 深森林绿系
        // 从先导页鲜绿视频过渡到深森林绿主页，视觉自然连贯
        midnight: '#0F1814',      // 保留（老代码兼容），改为极深森林绿
        'deep-forest': '#0F1814', // 主背景 —— 深森林绿（像午夜的森林）
        moss: '#1B2A22',          // 卡片/次背景 —— 苔藓绿
        'moss-hi': '#243528',     // 卡片高亮态
        sage: '#8FB8A0',          // 辅助文字 —— 鼠尾草绿（替代 mist）
        'warm-ivory': '#F5F1E8',  // 主文字 —— 暖米白（比原 ivory 更暖）
        ivory: '#F5F1E8',         // 兼容旧代码
        mist: '#8FB8A0',          // 兼容旧代码（映射到 sage）
        brass: '#D4B96C',         // 保留 —— 阳光金
        'brass-warm': '#E6C877',  // 明亮金（hover 态）
        charcoal: '#1B2A22',      // 卡片表面（映射到 moss）
        // Signature：印章红（保留，克制使用）
        seal:     '#C74C3D',
        'seal-ink': '#8B2E24',
        // 语义色
        'ivory-dim': 'rgba(245, 241, 232, 0.58)',
        'ivory-faint': 'rgba(245, 241, 232, 0.16)',
        'mist-dim': 'rgba(143, 184, 160, 0.38)',
        'sage-dim': 'rgba(143, 184, 160, 0.38)',
        'seal-soft': 'rgba(199, 76, 61, 0.72)',
        'brass-soft': 'rgba(212, 185, 108, 0.42)',
      },
      fontFamily: {
        // 三个层级各司其职
        serif: ['var(--font-noto-serif)', 'Songti SC', 'serif'],
        sans: ['var(--font-noto-sans)', 'PingFang SC', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        wider2: '0.15em',
        widest2: '0.28em',
      },
      fontSize: {
        // 语义字号 —— 主要用于关键位置的对比张力
        // 场景文字用 body-scene；标题用 display；小写标签用 caption
        'display-hero': ['clamp(2.75rem, 6vw, 4.75rem)', { lineHeight: '1.08', letterSpacing: '-0.015em' }],
        'display-lg':   ['clamp(2rem, 4vw, 3rem)',     { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'body-scene':   ['clamp(1.125rem, 1.6vw, 1.5rem)', { lineHeight: '2.0', letterSpacing: '0.01em' }],
        'body-lead':    ['1.0625rem',                   { lineHeight: '1.85' }],
        caption:        ['0.75rem',                     { lineHeight: '1.5', letterSpacing: '0.05em' }],
      },
      fontWeight: {
        // 语义字重：极细 display / 常规 body
        display: '300',   // 用于超大标题
        body: '400',
        strong: '500',
      },
      keyframes: {
        'pulse-brass': {
          '0%, 100%': { opacity: '1', textShadow: '0 0 0 rgba(212, 185, 108, 0)' },
          '50%': { opacity: '0.7', textShadow: '0 0 24px rgba(212, 185, 108, 0.6)' },
        },
        'kenburns': {
          '0%': { transform: 'scale(1.08) translate(0, 0)' },
          '100%': { transform: 'scale(1.15) translate(-1.5%, -1%)' },
        },
        'letterbox-in': {
          '0%': { height: '50%' },
          '100%': { height: 'var(--letterbox-height)' },
        },
      },
      animation: {
        'pulse-brass': 'pulse-brass 1s ease-in-out infinite',
        'kenburns': 'kenburns 30s ease-out infinite alternate',
        'letterbox-in': 'letterbox-in 900ms cubic-bezier(0.65, 0, 0.35, 1) forwards',
      },
    },
  },
  plugins: [],
}

export default config
