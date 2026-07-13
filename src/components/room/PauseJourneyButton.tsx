'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * 暂停旅行按钮
 *
 * 语义：离开当前房间回到首页，但旅行不结束。
 * 你可以在首页 "My Journeys" 里找到它继续。
 *
 * 交互：
 *   1. 点一下 → 展开提示浮层（"旅行会保留..." + 确认按钮）
 *   2. 确认 → 跳转 /
 *   3. 5s 不动 → 自动收起
 */
export function PauseJourneyButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  function startConfirmTimer() {
    setConfirming(true)
    window.setTimeout(() => setConfirming(false), 5000)
  }

  function handleConfirm() {
    router.push('/')
  }

  return (
    <div className="relative">
      <button
        onClick={() => (confirming ? handleConfirm() : startConfirmTimer())}
        className={`border px-4 py-2.5 font-mono text-xs uppercase tracking-widest2 backdrop-blur transition-colors md:px-5 md:py-3 md:text-sm ${
          confirming
            ? 'border-mist bg-mist/10 text-mist'
            : 'border-ivory-faint bg-charcoal/80 text-ivory-dim hover:border-ivory-dim hover:text-ivory'
        }`}
      >
        {confirming ? '再点一次 · 回大厅' : '⏸ 暂停一下'}
      </button>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-2 w-[220px] rounded-none border border-ivory-faint bg-midnight px-3 py-2 shadow-2xl"
          >
            <p className="scene-copy text-xs leading-relaxed text-ivory-dim">
              这段路会保留。回到首页后，在
              <span className="text-mist"> My Journeys </span>
              里能找回来继续。
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
