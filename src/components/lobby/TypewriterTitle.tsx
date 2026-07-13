'use client'

import { useEffect, useState } from 'react'

/**
 * 打字机标题 —— 真实打字机节奏
 *
 * 设计原则：
 * 1. 字符瞬间出现（无浮现/淡入）—— 这才是打字机的"敲击感"
 * 2. 240ms/字符 —— 舒适的中文打字节奏
 * 3. 光标：打字中常亮跟随；完成后闪烁 3.5s 消失
 * 4. 闪烁用 CSS steps(1) 硬切换，模拟真实打字机光标
 */
export function TypewriterTitle({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)
  const chars = text.split('')

  // 打字逻辑 —— 每 240ms 出一个字
  useEffect(() => {
    if (currentIndex < chars.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
      }, 240)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, chars.length])

  // 完成检测 —— 独立 effect 避免与打字逻辑的清理函数纠缠
  useEffect(() => {
    if (currentIndex >= chars.length && !isComplete) {
      setIsComplete(true)
    }
  }, [currentIndex, chars.length, isComplete])

  // 光标 3.5s 后消失 —— 独立 effect，只依赖 isComplete
  useEffect(() => {
    if (!isComplete) return
    const hideTimer = setTimeout(() => {
      setCursorVisible(false)
    }, 3500)
    return () => clearTimeout(hideTimer)
  }, [isComplete])

  return (
    <>
      <span className={`relative inline-block ${className}`}>
        {/* 字符瞬间出现，无过渡 —— 打字机的敲击感 */}
        {chars.slice(0, currentIndex).join('')}

        {/* 光标 —— 打字中常亮，完成后硬闪烁 */}
        {cursorVisible && (
          <span
            aria-hidden="true"
            className="ml-[2px] inline-block h-[0.82em] w-[3px] translate-y-[-0.05em] bg-mist align-baseline"
            style={{
              animation: isComplete ? 'tw-blink 0.9s steps(1, end) infinite' : 'none',
            }}
          />
        )}
      </span>
      <style jsx global>{`
        @keyframes tw-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </>
  )
}
