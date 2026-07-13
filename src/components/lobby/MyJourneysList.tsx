'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getMyJourneys, type MyJourneyEntry } from '@/lib/identity'
import { FoldedCorner } from '@/components/Icons'

/**
 * My Journeys 列表 —— 从 localStorage 拿 room_ids，
 * 然后从 Supabase 补充这些房间的当前状态（进行中 / 已结束 / 场景数）
 */

type EnrichedJourney = MyJourneyEntry & {
  ended_at: string | null
  is_active: boolean
  last_activity_at: string
  scene_count: number
  title: string
}

export function MyJourneysList() {
  const [entries, setEntries] = useState<MyJourneyEntry[] | null>(null)
  const [enriched, setEnriched] = useState<EnrichedJourney[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setEntries(getMyJourneys())
  }, [])

  useEffect(() => {
    if (!entries) return
    if (entries.length === 0) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchEnrichment(list: MyJourneyEntry[]) {
      const supabase = createClient()
      const ids = list.map((e) => e.room_id)

      // 1. 用 journey_view 拿到每个房间的元数据（含 scene_count）
      const { data: rows } = await supabase
        .from('journey_view')
        .select('room_id, title, starting_city, ended_at, last_activity_at, scene_count')
        .in('room_id', ids)

      if (cancelled) return

      // 2. 需要 is_active 的话再拉一次 rooms 表（journey_view 里没这个字段）
      const { data: activeRows } = await supabase
        .from('rooms')
        .select('id, is_active')
        .in('id', ids)

      if (cancelled) return

      const activeMap = new Map<string, boolean>()
      for (const r of activeRows ?? []) activeMap.set(r.id, r.is_active)

      // 3. 组装
      const byId = new Map<string, EnrichedJourney>()
      for (const local of list) {
        const remote = (rows ?? []).find((r) => r.room_id === local.room_id)
        if (!remote) continue // 数据库里没这个房间了（可能被清了）
        byId.set(local.room_id, {
          ...local,
          title: remote.title ?? local.starting_city,
          ended_at: remote.ended_at,
          last_activity_at: remote.last_activity_at,
          scene_count: Number(remote.scene_count ?? 0),
          is_active: activeMap.get(local.room_id) ?? true,
        })
      }

      // 4. 按 last_activity_at 倒序（新的在前）
      const merged = list
        .map((e) => byId.get(e.room_id))
        .filter((x): x is EnrichedJourney => !!x)
        .sort(
          (a, b) =>
            new Date(b.last_activity_at).getTime() -
            new Date(a.last_activity_at).getTime(),
        )

      setEnriched(merged)
      setLoading(false)
    }

    void fetchEnrichment(entries)

    return () => {
      cancelled = true
    }
  }, [entries])

  if (loading) {
    return (
      <p className="scene-copy animate-pulse text-sm text-ivory-dim">正在翻阅日记...</p>
    )
  }

  if (enriched.length === 0) {
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
              你还没走过任何一段路。
            </p>
            <p className="mt-2 font-serif text-base text-ivory-dim/70">
              从左边启程——走过的会自己回到这一页。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ul>
      {enriched.map((j, idx) => {
        const ended = !!j.ended_at
        return (
          <li key={j.room_id}>
            <Link
              href={ended ? `/journeys/${j.room_id}` : `/rooms/${j.room_id}`}
              className="group flex items-center justify-between gap-4 border-b border-ivory-faint py-5 transition-colors"
            >
              <div className="flex min-w-0 items-baseline gap-5">
                <span className="w-8 shrink-0 font-mono text-sm text-ivory-dim/60 tabular-nums">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="font-serif text-lg text-ivory transition-colors group-hover:text-brass md:text-xl">
                    {j.starting_city}
                  </p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-caption tracking-wider2 text-ivory-dim">
                    <span>踏过 {j.scene_count} 场景</span>
                    <span>·</span>
                    <span>
                      {ended ? (
                        <span className="text-brass/80">已归档</span>
                      ) : (
                        <span className="text-mist">进行中</span>
                      )}
                    </span>
                  </p>
                </div>
              </div>
              <span className="font-mono text-caption uppercase tracking-widest2 text-ivory-dim transition-colors group-hover:text-brass">
                {ended ? '回看 →' : '接着走 →'}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
