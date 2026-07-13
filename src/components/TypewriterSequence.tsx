'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Line {
  text: string
  delay?: number
}

/**
 * 打字机累积序列 —— 多句依次显示，全部保留
 *
 * 每句独立打字机效果，完成后保留在页面上，光标移到下一句。
 * 完成后触发 onComplete。
 *
 * 视觉：每句 fade-in + y 浮出，累积成完整段落
 */
export function TypewriterSequence({
  lines,
  charInterval = 65,
  linePause = 500,
  onComplete,
}: {
  lines: Line[]
  charInterval?: number
  linePause?: number
  onComplete?: () => void
}) {
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChars, setCurrentChars] = useState(0)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (currentLine >= lines.length) {
      if (!isDone) {
        setIsDone(true)
        onComplete?.()
      }
      return
    }

    const line = lines[currentLine]
    const startDelay = currentChars === 0 ? (line.delay ?? linePause) : 0

    const timer = setTimeout(() => {
      if (currentChars < line.text.length) {
        setCurrentChars(currentChars + 1)
      } else {
        // 本行完成，等待 linePause 后进入下一行
        setTimeout(() => {
          setCurrentLine(currentLine + 1)
          setCurrentChars(0)
        }, linePause)
      }
    }, startDelay + (currentChars > 0 ? charInterval : 0))

    return () => clearTimeout(timer)
  }, [currentLine, currentChars, lines, charInterval, linePause, isDone, onComplete])

  return (
    <div className="space-y-3 md:space-y-4">
      {lines.map((line, idx) => {
        if (idx > currentLine) return null

        const isCurrent = idx === currentLine
        const displayText = isCurrent ? line.text.slice(0, currentChars) : line.text
        const showCursor = isCurrent && currentChars < line.text.length

        return (
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-serif text-xl leading-[1.9] text-warm-ivory md:text-2xl md:leading-[1.85]"
          >
            {displayText}
            {showCursor && (
              <span className="ml-[2px] inline-block h-5 w-[2px] animate-pulse bg-brass/70 align-middle" />
            )}
          </motion.p>
        )
      })}
    </div>
  )
}
