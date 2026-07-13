'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * 结束旅行按钮 —— 带二次确认
 *
 * 交互：
 *   1. 点一下 → 展开确认弹层（"确认在此处停留？取消/结束"）
 *   2. 确认 → 调 API，成功后 onEnded 回调
 *   3. 5 秒不动 → 弹层自动收起
 */
export function EndJourneyButton({
  roomId,
  userId,
  disabled,
  onEnded,
}: {
  roomId: string
  userId: string
  disabled?: boolean
  onEnded?: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 5s 自动收起
  function startConfirmTimer() {
    setConfirming(true)
    window.setTimeout(() => setConfirming(false), 5000)
  }

  async function handleConfirm() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/rooms/${roomId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ephemeral_id: userId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `请求失败 (${res.status})`)
      }
      onEnded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '结束失败')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => (confirming ? handleConfirm() : startConfirmTimer())}
        disabled={disabled || pending}
        className={`border px-4 py-2.5 font-mono text-xs uppercase tracking-widest2 backdrop-blur transition-colors md:px-5 md:py-3 md:text-sm ${
          confirming
            ? 'border-brass bg-brass/10 text-brass'
            : 'border-ivory-faint bg-charcoal/80 text-ivory-dim hover:border-ivory-dim hover:text-ivory'
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        {pending ? '正在停靠...' : confirming ? '再点一次 · 结束' : '⛺ 在此停留'}
      </button>

      <AnimatePresence>
        {confirming && !pending && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-2 w-[260px] rounded-none border border-ivory-faint bg-midnight px-4 py-3 shadow-2xl"
          >
            <p className="font-serif text-sm leading-relaxed text-ivory-dim">
              旅行结束后不会再生成新场景，
              <br />
              但你可以随时回顾走过的路。
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="absolute bottom-full right-0 mb-2 whitespace-nowrap font-mono text-caption text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
