'use client'

import { useState, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Scene, Vote } from '@/types/db'
import type { Identity } from '@/lib/identity'
import { tallyVotes } from '@/hooks/useRoom'

/**
 * 选项列表 + 投票交互
 *
 * 每个选项显示：
 *   - 字母编号 A/B/C
 *   - 选项文字
 *   - 已投票者的彩色小圆点（每个用户的 color）
 *   - 票数
 *
 * 微交互（C2）：点击瞬间在点击点扩散一圈印章红墨迹，模拟毛笔点在宣纸上洇开
 * 胜者揭晓时：其他选项淡出，胜出选项发光
 */
export function ChoicesList({
  scene,
  votes,
  identity,
}: {
  scene: Scene
  votes: Vote[]
  identity: Identity
}) {
  const [pendingOption, setPendingOption] = useState<string | null>(null)
  const [inkSplashes, setInkSplashes] = useState<
    { id: number; optionId: string; x: number; y: number }[]
  >([])
  const nextInkIdRef = useRef(0)
  const [_pending, startTransition] = useTransition()

  const myVote = votes.find((v) => v.user_ephemeral_id === identity.id)?.option_id ?? null
  const winner = scene.winning_option_id
  const tally = tallyVotes(scene.options, votes)

  async function vote(optionId: string, event: React.MouseEvent<HTMLLIElement>) {
    if (winner) return // 已定局

    // 记录点击相对于 <li> 的坐标，用于墨迹扩散动画
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const id = nextInkIdRef.current++
    setInkSplashes((prev) => [...prev, { id, optionId, x, y }])
    // 900ms 后自动移除（比动画略长）
    setTimeout(() => {
      setInkSplashes((prev) => prev.filter((s) => s.id !== id))
    }, 900)

    setPendingOption(optionId)
    startTransition(async () => {
      try {
        await fetch(`/api/scenes/${scene.id}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_ephemeral_id: identity.id,
            user_nickname: identity.nickname,
            option_id: optionId,
          }),
        })
      } catch (err) {
        console.error('vote failed:', err)
      } finally {
        setPendingOption(null)
      }
    })
  }

  return (
    <section className="mx-auto max-w-[900px] px-5 py-12 pb-28 md:px-12 md:py-16">
      <p className="eyebrow mb-6 text-mist">
        {winner ? '路已定 · 起风' : '三个岔口 · 三十秒'}
      </p>

      <ul className="space-y-0">
        {scene.options.map((opt, i) => {
          const info = tally.get(opt.id) ?? { count: 0, voters: [] }
          const isMine = myVote === opt.id
          const isWinner = winner === opt.id
          const isFaded = !!winner && !isWinner
          const splashes = inkSplashes.filter((s) => s.optionId === opt.id)

          return (
            <motion.li
              key={opt.id}
              initial={false}
              animate={{
                opacity: isFaded ? 0.35 : 1,
              }}
              transition={{ duration: 0.4 }}
              className={[
                'relative grid cursor-pointer grid-cols-[40px_1fr_auto] items-center gap-6 overflow-hidden border-b border-ivory-faint py-6 transition-colors md:py-7',
                isMine ? 'bg-gradient-to-r from-brass/12 to-transparent' : '',
                isWinner ? 'bg-gradient-to-r from-brass/22 to-transparent' : '',
                winner ? 'cursor-default' : 'hover:bg-gradient-to-r hover:from-brass/8 hover:to-transparent',
              ].join(' ')}
              onClick={(e) => !winner && vote(opt.id, e)}
            >
              {/* 墨迹扩散层 —— 绝对定位在点击点 */}
              <AnimatePresence>
                {splashes.map((s) => (
                  <motion.span
                    key={s.id}
                    initial={{ opacity: 0.55, scale: 0 }}
                    animate={{ opacity: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.75, ease: [0.16, 0.68, 0.24, 1] }}
                    className="pointer-events-none absolute -z-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: s.x,
                      top: s.y,
                      background:
                        'radial-gradient(circle, rgba(199,76,61,0.55) 0%, rgba(199,76,61,0.28) 32%, rgba(199,76,61,0) 70%)',
                    }}
                  />
                ))}
              </AnimatePresence>

              <span className="relative z-10 font-mono text-base tracking-wider2 text-brass md:text-lg">
                {String.fromCharCode(65 + i)}
              </span>
              <span
                className={[
                  'relative z-10 font-serif text-lg leading-[1.55] md:text-xl lg:text-2xl',
                  isWinner ? 'text-brass' : 'text-ivory',
                ].join(' ')}
              >
                {opt.label}
              </span>
              <span className="relative z-10 flex items-center gap-4">
                <span className="flex items-center">
                  {info.voters.map((v) => (
                    <VoterDot key={v.id} color={colorFor(v.user_ephemeral_id, v)} title={v.user_nickname} />
                  ))}
                </span>
                <span
                  className={[
                    'font-mono text-sm tabular-nums tracking-wider2 md:text-base',
                    isMine || isWinner ? 'text-brass' : 'text-ivory-dim',
                  ].join(' ')}
                >
                  {String(info.count).padStart(2, '0')}
                </span>
              </span>
            </motion.li>
          )
        })}
      </ul>

      {myVote && !winner && (
        <p className="mt-6 font-mono text-caption uppercase tracking-widest2 text-ivory-dim">
          你选了 {optionLetter(scene, myVote)} · 可以随时改
        </p>
      )}
    </section>
  )
}

function VoterDot({ color, title }: { color: string; title: string }) {
  return (
    <span
      title={title}
      className="-ml-1 inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-midnight first:ml-0"
      style={{ background: color }}
    />
  )
}

/**
 * 从投票记录里挑出用户的颜色
 * 因为 votes 表不存 color，我们根据 user_ephemeral_id 的 hash 稳定选一个色
 * 或者如果这是当前用户，用当前用户的 identity.color
 */
const VOTER_COLORS = ['#7BA7BC', '#D4B96C', '#B08968', '#8FA88B', '#C48B9F', '#9A8FB8']

function colorFor(userId: string, _vote: Vote): string {
  // 简单哈希：确保同一用户永远同色
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff
  }
  return VOTER_COLORS[Math.abs(hash) % VOTER_COLORS.length]
}

function optionLetter(scene: Scene, optionId: string): string {
  const idx = scene.options.findIndex((o) => o.id === optionId)
  return idx >= 0 ? String.fromCharCode(65 + idx) : '?'
}
