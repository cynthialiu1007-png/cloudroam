'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PostageStamp } from '@/components/PostageStamp'
import type { Scene, Room } from '@/types/db'

/**
 * 旅程结束的告别画面
 *
 * Signature：一枚"完"字大印章（seal 红），替代原来的"Fin"英文字。
 * 底下两行小字：踏过 N 站 · 做过 M 选择。
 */
export function JourneyEnded({
  room,
  scenes,
  startingCity,
}: {
  room: Room
  scenes: Scene[]
  startingCity: string
}) {
  const completedScenes = scenes.filter((s) => s.winning_option_id != null)
  const totalScenes = scenes.length
  const endedAt = room.ended_at ? new Date(room.ended_at) : new Date()

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-6 py-16 md:min-h-[70vh]">
      {/* 顶部一条金色细线 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
        className="absolute inset-x-0 top-0 h-px origin-center bg-gradient-to-r from-transparent via-brass/60 to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.65, 0, 0.35, 1] }}
        className="mx-auto flex max-w-[560px] flex-col items-center text-center"
      >
        {/* "终"字大印章 —— signature，用内建盖章动画 */}
        <div className="mb-10">
          <PostageStamp variant="fin" size={188} rotate={3} delay={0.5} />
        </div>

        <h1 className="font-serif font-display text-display-lg leading-[1.1] tracking-tight text-ivory">
          从 <span className="italic text-mist">{startingCity}</span>
          <br />
          走过的这一段停了下来。
        </h1>

        <div className="my-12 flex items-center justify-center gap-10 md:my-14 md:gap-12">
          <Stat value={totalScenes} label="踏过的站" />
          <div className="h-10 w-px bg-ivory-faint" />
          <Stat value={completedScenes.length} label="做过的选择" />
        </div>

        <p className="font-serif text-lg leading-[1.85] text-ivory/70 md:text-xl">
          没有终点，只有此刻回望。
          <br />
          走过的都留在手账里了。
        </p>

        <p className="mt-6 font-mono text-caption tracking-wider2 text-ivory-dim/70">
          {formatFilmTimestamp(endedAt)}
        </p>

        {/* 行动按钮组 */}
        <div className="mt-12 flex flex-col items-center justify-center gap-3 md:mt-14 md:flex-row md:gap-4">
          <Link
            href={`/journeys/${room.id}`}
            className="border border-brass bg-brass/10 px-8 py-4 font-mono text-sm uppercase tracking-widest2 text-brass transition-colors hover:bg-brass hover:text-midnight"
          >
            翻看手账 →
          </Link>
          <Link
            href="/"
            className="border border-ivory-faint px-8 py-4 font-mono text-sm uppercase tracking-widest2 text-ivory-dim transition-colors hover:border-ivory-dim hover:text-ivory"
          >
            回到大厅
          </Link>
        </div>
      </motion.div>

      {/* 底部一条金色细线 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
        className="absolute inset-x-0 bottom-0 h-px origin-center bg-gradient-to-r from-transparent via-brass/60 to-transparent"
      />
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-mono text-3xl font-light tabular-nums text-brass md:text-5xl">
        {String(value).padStart(2, '0')}
      </p>
      <p className="mt-2 font-mono text-caption uppercase tracking-widest2 text-ivory-dim">{label}</p>
    </div>
  )
}

/**
 * 明信片时间戳: YYYY.MM.DD · HH:MM
 */
function formatFilmTimestamp(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day} · ${hh}:${mm}`
}
