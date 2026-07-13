'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { FoldedCorner } from '@/components/Icons'

type LiveRoom = {
  id: string
  title: string
  starting_city: string
  last_activity_at: string
  ended_at?: string | null
}

export function LiveRoomList({ initial }: { initial: LiveRoom[] }) {
  const [rooms, setRooms] = useState<LiveRoom[]>(initial.filter((r) => !r.ended_at))

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('lobby:rooms')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rooms' },
        (payload) => {
          const row = payload.new as LiveRoom
          if (row.ended_at) return
          setRooms((prev) => [row, ...prev.filter((r) => r.id !== row.id)].slice(0, 12))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms' },
        (payload) => {
          const row = payload.new as LiveRoom & { is_active: boolean }
          setRooms((prev) => {
            // 结束了 或 is_active=false → 从列表移除
            if (row.ended_at || !row.is_active) {
              return prev.filter((r) => r.id !== row.id)
            }
            const rest = prev.filter((r) => r.id !== row.id)
            return [row, ...rest].slice(0, 12)
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  if (rooms.length === 0) {
    return (
      <div className="mt-12 space-y-5">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
          className="h-px w-16 origin-left bg-mist/40"
        />
        <div className="flex items-start gap-4">
          <FoldedCorner size={26} className="mt-1 shrink-0 text-mist" />
          <div>
            <p className="font-serif text-xl text-ivory-dim md:text-2xl">
              此刻，还没有人在路上。
            </p>
            <p className="mt-2 font-serif text-base text-ivory-dim/70">
              这一页还是空白——你会是第一个落笔的人。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ul>
      <AnimatePresence initial={false}>
        {rooms.map((room, idx) => (
          <motion.li
            key={room.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Link
              href={`/rooms/${room.id}`}
              className="group flex items-center justify-between gap-4 border-b border-ivory-faint py-5 transition-colors hover:text-mist"
            >
              <div className="flex min-w-0 items-baseline gap-5">
                <span className="w-8 shrink-0 font-mono text-sm text-ivory-dim/60 tabular-nums">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="font-serif text-lg text-ivory group-hover:text-mist md:text-xl">
                    {room.starting_city}
                  </p>
                  <p className="mt-1 font-mono text-caption tracking-wider2 text-ivory-dim">
                    <TimeAgo iso={room.last_activity_at} />
                  </p>
                </div>
              </div>
              <span className="font-mono text-caption uppercase tracking-widest2 text-ivory-dim group-hover:text-mist">
                加入他们 →
              </span>
            </Link>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState(() => humanize(iso))
  useEffect(() => {
    const t = setInterval(() => setLabel(humanize(iso)), 15_000)
    return () => clearInterval(t)
  }, [iso])
  return <span>{label}</span>
}

function humanize(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const sec = Math.floor(diff / 1000)
  if (sec < 30) return '刚刚'
  if (sec < 60) return `${sec} 秒前`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  return `${Math.floor(hr / 24)} 天前`
}
