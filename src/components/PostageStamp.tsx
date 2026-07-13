'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * 邮戳印章 —— CloudRoam 的 signature 元素
 *
 * 视觉概念：手工盖章的双圈邮戳
 *  - 上弧文字：CLOUDROAM · 云游
 *  - 中心大字：第 X 站（中文序数）
 *  - 下弧文字：起点城市 + 日期
 *  - 印章红半透明 + 轻微旋转 + 墨迹不均匀感
 *
 * 微交互（C1）：
 *  - 出现时"盖下"动画：从上方 -12px + scale 1.18 →
 *    急速下压到位 → 触底 scale 0.94 微抖 → 回弹 1.0
 *  - animateStamp=false 时静态显示（用于滚动可能反复触发的场合）
 *
 * 用途：
 *  - 首页装饰性总章
 *  - 房间页当前场景章
 *  - 存档页每站的一枚章
 *  - 终局页的"终"字大章
 */

const CHINESE_ORDINALS = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
]

function toChineseOrdinal(n: number): string {
  return CHINESE_ORDINALS[n - 1] ?? String(n)
}

export interface PostageStampProps {
  /** 站数（1-based）。传 undefined 时会显示 variant 指定的中心字 */
  stationNumber?: number
  /** 起点城市（下弧文字左半） */
  city?: string
  /** 日期字符串（下弧文字右半），格式建议 "2026.07" */
  date?: string
  /** 特殊变体：'fin' 显示"完" / 'roam' 显示"游"（用于首页总章） */
  variant?: 'station' | 'fin' | 'roam'
  /** 尺寸（px），默认 132 */
  size?: number
  /** 旋转角度覆盖。不传则根据 city+station 哈希稳定生成 */
  rotate?: number
  /** 覆盖上弧文字 */
  topArc?: string
  /** 是否播放"盖下"动画（默认 true） */
  animateStamp?: boolean
  /** 动画延迟（秒），用于 stagger */
  delay?: number
  /** 额外的 className */
  className?: string
}

/**
 * 用字符串生成一个稳定的伪随机数（0..1）
 * 确保同一枚章每次渲染 rotate 一致
 */
function seededRandom(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  const x = Math.sin(h) * 10000
  return x - Math.floor(x)
}

export function PostageStamp({
  stationNumber,
  city,
  date,
  variant = 'station',
  size = 132,
  rotate,
  topArc = '云游 · CLOUDROAM',
  animateStamp = true,
  delay = 0,
  className = '',
}: PostageStampProps) {
  // 稳定旋转角度（-8° ~ +8°）
  const finalRotate = useMemo(() => {
    if (typeof rotate === 'number') return rotate
    const seed = `${variant}-${stationNumber ?? 0}-${city ?? ''}`
    return (seededRandom(seed) - 0.5) * 14
  }, [rotate, variant, stationNumber, city])

  // 中心字
  const centerChar =
    variant === 'fin' ? '终' :
    variant === 'roam' ? '游' :
    stationNumber ? toChineseOrdinal(stationNumber) : '？'

  // 中心字上方的标签（仅 station variant 有"第"字前缀）
  const showTopLabel = variant === 'station'
  // 底部弧线文字
  const bottomText = [city, date].filter(Boolean).join(' · ') || ''

  // "盖下"关键帧：
  //   T=0    从上方 -14px + scale 1.22 + 透明（还没接触纸）
  //   T=180ms 到位 + scale 0.94（触底压扁）
  //   T=280ms 微微上抬 scale 1.03
  //   T=380ms 定型 scale 1.0
  // rotate 由 motion 管理（避免和内联 style 的 transform 冲突）
  const stampAnimation = animateStamp
    ? {
        initial: { opacity: 0, y: -14, scale: 1.22, rotate: finalRotate * 0.5 },
        animate: {
          opacity: [0, 1, 1, 1],
          y: [-14, 0, 0, 0],
          scale: [1.22, 0.94, 1.03, 1.0],
          rotate: [finalRotate * 0.5, finalRotate, finalRotate, finalRotate],
        },
        transition: {
          duration: 0.42,
          delay,
          times: [0, 0.45, 0.72, 1],
          ease: [0.32, 0.72, 0.35, 1],
        },
      }
    : {
        initial: { rotate: finalRotate } as const,
        animate: { rotate: finalRotate },
        transition: undefined,
      }

  return (
    <motion.div
      {...stampAnimation}
      className={`pointer-events-none inline-block ${className}`}
      style={{
        width: size,
        height: size,
        transformOrigin: 'center center',
        willChange: animateStamp ? 'transform, opacity' : undefined,
      }}
      aria-hidden="true"
    >
      {/* 内层做墨色呼吸：opacity 0.9 ↔ 1.0，5s 循环 */}
      <motion.div
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: animateStamp ? 0.5 : 0,
        }}
        className="h-full w-full"
      >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        style={{
          // 手工盖章的墨迹不均匀感：对比度轻微不均 + 淡淡投影
          filter: 'contrast(1.05) drop-shadow(0 1px 0 rgba(139,46,36,0.15))',
          opacity: 0.92,
        }}
      >
        <defs>
          {/* 上弧文字路径 —— 沿顶部弧线，从左上到右上 */}
          <path
            id={`stamp-arc-top-${variant}-${stationNumber ?? 'x'}`}
            d="M 15 50 A 35 35 0 0 1 85 50"
            fill="none"
          />
          {/* 下弧文字路径 —— 沿底部弧线，从左下到右下（反向绘制让文字正立） */}
          <path
            id={`stamp-arc-bottom-${variant}-${stationNumber ?? 'x'}`}
            d="M 18 55 A 32 32 0 0 0 82 55"
            fill="none"
          />
        </defs>

        {/* 外圈 */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="#C74C3D"
          strokeWidth="1.6"
          strokeOpacity="0.85"
        />
        {/* 内圈（双圈感） */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#C74C3D"
          strokeWidth="0.7"
          strokeOpacity="0.55"
        />

        {/* 上弧文字 —— 品牌名 */}
        <text
          fill="#C74C3D"
          fillOpacity="0.88"
          style={{
            fontFamily: 'var(--font-jetbrains), ui-monospace, monospace',
            fontSize: '5.4px',
            letterSpacing: '0.25em',
          }}
        >
          <textPath
            href={`#stamp-arc-top-${variant}-${stationNumber ?? 'x'}`}
            startOffset="50%"
            textAnchor="middle"
          >
            {topArc}
          </textPath>
        </text>

        {/* 中心字上方的小标签 "第" —— 只在 station variant */}
        {showTopLabel && stationNumber && (
          <text
            x="50"
            y="42"
            textAnchor="middle"
            fill="#C74C3D"
            fillOpacity="0.75"
            style={{
              fontFamily: 'var(--font-noto-serif), serif',
              fontSize: '6px',
              letterSpacing: '0.1em',
            }}
          >
            第
          </text>
        )}

        {/* 中心大字（中文序数、"完"、"游"） */}
        <text
          x="50"
          y={showTopLabel ? 62 : 60}
          textAnchor="middle"
          fill="#C74C3D"
          fillOpacity="0.92"
          style={{
            fontFamily: 'var(--font-noto-serif), serif',
            fontWeight: 500,
            fontSize: stationNumber && stationNumber > 9 ? '18px' : (showTopLabel ? '20px' : '32px'),
          }}
        >
          {centerChar}
        </text>

        {/* "站"字 —— station variant 大字下方 */}
        {showTopLabel && stationNumber && (
          <text
            x="50"
            y="72"
            textAnchor="middle"
            fill="#C74C3D"
            fillOpacity="0.72"
            style={{
              fontFamily: 'var(--font-noto-serif), serif',
              fontSize: '5.5px',
              letterSpacing: '0.1em',
            }}
          >
            站
          </text>
        )}

        {/* fin/roam variant 下方标签 */}
        {variant === 'fin' && (
          <text
            x="50"
            y="76"
            textAnchor="middle"
            fill="#C74C3D"
            fillOpacity="0.7"
            style={{
              fontFamily: 'var(--font-noto-serif), serif',
              fontSize: '5.2px',
              letterSpacing: '0.2em',
            }}
          >
            此程已尽
          </text>
        )}
        {variant === 'roam' && (
          <text
            x="50"
            y="76"
            textAnchor="middle"
            fill="#C74C3D"
            fillOpacity="0.7"
            style={{
              fontFamily: 'var(--font-noto-serif), serif',
              fontSize: '5.2px',
              letterSpacing: '0.2em',
            }}
          >
            云间漫游
          </text>
        )}

        {/* 下弧文字（城市 + 日期） —— 仅 station */}
        {variant === 'station' && bottomText && (
          <text
            fill="#C74C3D"
            fillOpacity="0.82"
            style={{
              fontFamily: 'var(--font-jetbrains), ui-monospace, monospace',
              fontSize: '4.4px',
              letterSpacing: '0.22em',
            }}
          >
            <textPath
              href={`#stamp-arc-bottom-${variant}-${stationNumber ?? 'x'}`}
              startOffset="50%"
              textAnchor="middle"
            >
              {bottomText.toUpperCase()}
            </textPath>
          </text>
        )}

        {/* 左右小圆点（邮戳装饰） */}
        <circle cx="7" cy="50" r="0.9" fill="#C74C3D" fillOpacity="0.55" />
        <circle cx="93" cy="50" r="0.9" fill="#C74C3D" fillOpacity="0.55" />
      </svg>
      </motion.div>
    </motion.div>
  )
}
