'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * 场景文字浮现
 *
 * 视觉：不是逐字打字机，而是"墨迹从纸背渗上来"。
 *   - 把文本按标点切成短句组块（模拟叙述节奏）
 *   - 每组 stagger 出现：filter blur(6px)→0 + opacity 0→1 + y 8→0
 *   - 全文 1.5-2 秒完成，比逐字打字快很多，用户能提前读到岔路口
 *
 * 尊重 prefers-reduced-motion（直接显示全文）
 * 名字保持 TypewriterText 是为了不改上层调用
 */

/**
 * 把一段中文文本按标点拆成"呼吸组块"
 * 中文标点后就是天然的换气点
 */
function splitIntoChunks(text: string): string[] {
  const parts: string[] = []
  let current = ''
  for (const ch of text) {
    current += ch
    // 遇到句末/短句标点就切一组
    if (/[。！？；]/.test(ch)) {
      parts.push(current)
      current = ''
    } else if (/[，、]/.test(ch) && current.length > 6) {
      // 逗号只在组块已经比较长时切，避免碎得太厉害
      parts.push(current)
      current = ''
    }
  }
  if (current) parts.push(current)
  return parts.length > 0 ? parts : [text]
}

export function TypewriterText({
  text,
  className,
  onDone,
}: {
  text: string
  className?: string
  /** 兼容旧 API：不使用 */
  charDelay?: number
  punctuationDelay?: number
  onDone?: () => void
}) {
  const reduce = useReducedMotion()
  const chunks = useMemo(() => splitIntoChunks(text), [text])
  const [key, setKey] = useState(0)

  // text 变了 → 重新播放（key 递增让 motion 重新挂载）
  useEffect(() => {
    setKey((k) => k + 1)
  }, [text])

  // 触发 onDone 大致在最后一个块出现完
  useEffect(() => {
    if (!onDone) return
    const total = reduce ? 0 : (chunks.length - 1) * 140 + 500
    const t = setTimeout(() => onDone?.(), total)
    return () => clearTimeout(t)
  }, [text, chunks.length, reduce, onDone])

  if (reduce) {
    return <span className={className}>{text}</span>
  }

  return (
    <span key={key} className={className}>
      {chunks.map((chunk, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.5,
            delay: i * 0.14,
            ease: [0.22, 0.61, 0.36, 1],
          }}
          className="inline"
        >
          {chunk}
        </motion.span>
      ))}
    </span>
  )
}
