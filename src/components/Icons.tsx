'use client'

import { motion } from 'framer-motion'
import type { ReactNode, CSSProperties } from 'react'

/**
 * ============================================================
 * CloudRoam 手账气质图标集
 *
 * 原则：
 *  - 全部 hairline SVG（1px 描边、无填色）
 *  - 只用 seal / brass / ivory-dim 三个 token
 *  - 每个图标只有一件事：符号本身
 *  - 需要动的图标（呼吸红点、齿边环）用 framer-motion
 * ============================================================
 */

// -----------------------------------------------------------
// 呼吸红点 —— Header "有人在路上" 前的信号灯
// -----------------------------------------------------------
export function BreathingDot({
  size = 8,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* 外圈光晕 —— 2s 心跳 */}
      <motion.span
        animate={{
          scale: [1, 1.9, 1],
          opacity: [0.55, 0, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute inset-0 rounded-full bg-seal"
      />
      {/* 中心点 */}
      <span
        className="relative rounded-full bg-seal"
        style={{ width: size * 0.75, height: size * 0.75 }}
      />
    </span>
  )
}

// -----------------------------------------------------------
// 中文序数带方括号 〔一〕〔二〕〔三〕
// hover 时方括号轻微放大 + brass 加深
// -----------------------------------------------------------
const NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] as const

export function ChineseNum({
  n,
  className = '',
}: {
  n: number
  className?: string
}) {
  const ch = NUMS[n - 1] ?? String(n)
  return (
    <span
      className={`group inline-flex items-baseline font-serif text-brass transition-colors ${className}`}
      aria-hidden="true"
    >
      <span className="inline-block text-brass/60 transition-all duration-300 group-hover:text-brass group-hover:scale-110">
        〔
      </span>
      <span className="inline-block px-[1px] text-brass">{ch}</span>
      <span className="inline-block text-brass/60 transition-all duration-300 group-hover:text-brass group-hover:scale-110">
        〕
      </span>
    </span>
  )
}

// -----------------------------------------------------------
// 邮票齿边环 —— 用于 PresenceStack 标记当前用户
// 半径 R 处围一圈小圆凹槽（负空间）
// -----------------------------------------------------------
export function PerforatedRing({
  size = 32,
  teeth = 12,
  color = '#D4B96C',
  strokeWidth = 1,
  className = '',
}: {
  size?: number
  teeth?: number
  color?: string
  strokeWidth?: number
  className?: string
}) {
  const R = 45 // 主圆半径（viewBox 100）
  const toothR = 3.6

  const perforations = Array.from({ length: teeth }).map((_, i) => {
    const angle = (i / teeth) * Math.PI * 2
    const x = 50 + R * Math.cos(angle)
    const y = 50 + R * Math.sin(angle)
    return <circle key={i} cx={x} cy={y} r={toothR} fill="var(--midnight-bg, #0F1814)" />
  })

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity="0.7"
      />
      {perforations}
    </svg>
  )
}

// -----------------------------------------------------------
// 微型指北针 —— Tab 之间的分隔
// hairline 圆 + 指针 N
// -----------------------------------------------------------
export function TinyCompass({
  size = 14,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={`inline-block ${className}`}
      aria-hidden="true"
    >
      {/* 外圈 */}
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.55" />
      {/* N 指针（seal 红上半 + ivory 下半的效果，用两个三角） */}
      <path d="M 10 3.5 L 8 10 L 10 8.5 L 12 10 Z" fill="#C74C3D" fillOpacity="0.85" />
      <path d="M 10 16.5 L 8 10 L 10 11.5 L 12 10 Z" fill="currentColor" fillOpacity="0.4" />
      {/* 中心点 */}
      <circle cx="10" cy="10" r="0.7" fill="currentColor" fillOpacity="0.6" />
    </svg>
  )
}

// -----------------------------------------------------------
// 纸角折起 —— 空状态旁的小提示
// -----------------------------------------------------------
export function FoldedCorner({
  size = 20,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`inline-block ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeOpacity="0.5"
      aria-hidden="true"
    >
      {/* 纸的外轮廓 —— 右上角被折起 */}
      <path d="M 3 3 L 17 3 L 21 7 L 21 21 L 3 21 Z" />
      {/* 折起的角 */}
      <path d="M 17 3 L 17 7 L 21 7" strokeOpacity="0.65" />
      {/* 折面上的一根手写线（暗示"还没写"的空白纸） */}
      <path d="M 7 12 L 15 12" strokeOpacity="0.35" strokeDasharray="1 2" />
      <path d="M 7 15 L 12 15" strokeOpacity="0.28" strokeDasharray="1 2" />
    </svg>
  )
}

// -----------------------------------------------------------
// FloatY —— 让内部内容做上下漂浮呼吸
// 用于印章、大标题、eyebrow、中文序数
// -----------------------------------------------------------
export function FloatY({
  children,
  amp = 2,
  duration = 5,
  delay = 0,
  className = '',
  style,
}: {
  children: ReactNode
  amp?: number
  duration?: number
  delay?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <motion.div
      animate={{ y: [-amp, amp, -amp] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      style={{ willChange: 'transform', ...style }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
