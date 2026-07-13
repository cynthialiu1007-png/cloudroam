'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * 倒计时组件
 *
 * 输入：deadline (ISO 时间字符串，可能在过去、当前、未来)
 * 显示：mm:ss 格式，最后 5 秒触发 urgent 脉动
 * 触发：deadline 到达时，仅第一次触发 onExpire 回调
 *
 * 客户端每 250ms 重新计算，避免 setInterval 漂移
 */
export function Countdown({
  deadline,
  onExpire,
}: {
  deadline: string
  onExpire?: () => void
}) {
  const [now, setNow] = useState(() => Date.now())
  const firedRef = useRef(false)

  const deadlineMs = useMemo(() => new Date(deadline).getTime(), [deadline])

  useEffect(() => {
    firedRef.current = false
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [deadline])

  const secondsLeft = Math.max(0, Math.ceil((deadlineMs - now) / 1000))
  const urgent = secondsLeft <= 5 && secondsLeft > 0

  useEffect(() => {
    if (secondsLeft === 0 && !firedRef.current) {
      firedRef.current = true
      onExpire?.()
    }
  }, [secondsLeft, onExpire])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <span
      className={`timecode text-lg md:text-xl ${urgent ? 'animate-pulse-brass' : ''}`}
      aria-live="polite"
    >
      {mm}:{ss}
    </span>
  )
}

/**
 * 30 秒进度条（配合 Countdown 使用）
 * 尾端有一枚 4px brass 光斑，最后 5 秒轻微脉动
 */
export function CountdownProgress({
  startAt,
  deadline,
}: {
  startAt: string // 场景 created_at
  deadline: string // voting_ends_at
}) {
  const [now, setNow] = useState(() => Date.now())
  const startMs = useMemo(() => new Date(startAt).getTime(), [startAt])
  const deadlineMs = useMemo(() => new Date(deadline).getTime(), [deadline])
  const totalMs = Math.max(1, deadlineMs - startMs)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  const elapsed = Math.max(0, Math.min(totalMs, now - startMs))
  const pct = (elapsed / totalMs) * 100
  const secondsLeft = Math.max(0, Math.ceil((deadlineMs - now) / 1000))
  const urgent = secondsLeft <= 5 && secondsLeft > 0

  return (
    <div className="relative h-full w-full bg-ivory-faint/40">
      <div
        className="h-full bg-brass transition-all duration-1000 ease-linear"
        style={{ width: `${pct}%` }}
      />
      {/* 尾端光斑 */}
      {pct > 0 && pct < 100 && (
        <span
          className={`pointer-events-none absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass shadow-[0_0_8px_2px_rgba(212,185,108,0.65)] transition-all duration-1000 ease-linear ${
            urgent ? 'animate-pulse' : ''
          }`}
          style={{ left: `${pct}%` }}
        />
      )}
    </div>
  )
}
