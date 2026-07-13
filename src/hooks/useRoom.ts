'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Room, Scene, Vote, SceneOption } from '@/types/db'

/**
 * 房间的实时状态
 */
export type RoomState = {
  room: Room | null         // 房间元数据（含 ended_at）
  scenes: Scene[]           // 该房间所有场景（按 order_index 排）
  latest: Scene | null      // 最新场景（未定局或最新一个）
  votes: Vote[]             // 最新场景的所有投票
  presenceCount: number     // 房间当前在线人数
  presenceUsers: PresenceUser[]  // 在线用户（含昵称+颜色）
  loading: boolean
}

export type PresenceUser = {
  id: string
  nickname: string
  color: string
}

/**
 * 计算每个选项的票数与投票者
 */
export function tallyVotes(options: SceneOption[], votes: Vote[]) {
  const tally = new Map<string, { count: number; voters: Vote[] }>()
  for (const opt of options) {
    tally.set(opt.id, { count: 0, voters: [] })
  }
  for (const v of votes) {
    const entry = tally.get(v.option_id)
    if (entry) {
      entry.count += 1
      entry.voters.push(v)
    }
  }
  return tally
}

type Identity = {
  id: string
  nickname: string
  color: string
}

/**
 * 订阅房间实时状态
 *
 * 单个 Realtime Channel `room:${roomId}` 上：
 *   - Postgres Changes on scenes  → 新场景插入 / 场景更新（宣布胜者）
 *   - Postgres Changes on votes   → 投票变化
 *   - Presence                    → 在场用户
 */
export function useRoom(roomId: string, identity: Identity | null): RoomState {
  const [room, setRoom] = useState<Room | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([])
  const [loading, setLoading] = useState(true)

  // 用 ref 记住"当前最新场景 id"，用于过滤 votes 事件
  const latestSceneIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!identity) return

    const supabase = createClient()
    let cancelled = false

    // 初始化：拉一次数据
    async function bootstrap() {
      const { data: roomRow } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (cancelled) return
      if (roomRow) setRoom(roomRow as Room)

      const { data: sceneRows } = await supabase
        .from('scenes')
        .select('*')
        .eq('room_id', roomId)
        .order('order_index', { ascending: true })

      if (cancelled) return

      const list = (sceneRows ?? []) as Scene[]
      setScenes(list)
      const latest = list[list.length - 1]
      latestSceneIdRef.current = latest?.id ?? null

      if (latest) {
        const { data: voteRows } = await supabase
          .from('votes')
          .select('*')
          .eq('scene_id', latest.id)
        if (!cancelled) setVotes((voteRows ?? []) as Vote[])
      }

      if (!cancelled) setLoading(false)
    }

    void bootstrap()

    // Realtime 订阅
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: identity.id },
      },
    })

    // Room 变化（结束旅行时 ended_at 会更新）
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => {
        setRoom(payload.new as Room)
      },
    )

    // 场景变化（新增或更新）
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'scenes', filter: `room_id=eq.${roomId}` },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new as Scene
          setScenes((prev) => {
            if (prev.some((s) => s.id === row.id)) return prev
            return [...prev, row].sort((a, b) => a.order_index - b.order_index)
          })
          // 新场景 → 切换 latestSceneId 并清空 votes
          // 稳妥起见再 refetch 一次这个新场景的 votes（虽然刚开新场景应为 0，但避免竞态）
          latestSceneIdRef.current = row.id
          setVotes([])
          void (async () => {
            const { data: voteRows } = await supabase
              .from('votes')
              .select('*')
              .eq('scene_id', row.id)
            if (!cancelled) setVotes((voteRows ?? []) as Vote[])
          })()
        } else if (payload.eventType === 'UPDATE') {
          const row = payload.new as Scene
          setScenes((prev) => prev.map((s) => (s.id === row.id ? row : s)))
        }
      },
    )

    // 投票变化
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'votes' },
      (payload) => {
        const row = (payload.new ?? payload.old) as Vote
        // 只关心当前最新场景的投票
        if (!row || row.scene_id !== latestSceneIdRef.current) return

        if (payload.eventType === 'INSERT') {
          setVotes((prev) => {
            // upsert 语义：同一用户改票时会先 DELETE 再 INSERT，或者直接 UPDATE
            const withoutSameUser = prev.filter(
              (v) => v.user_ephemeral_id !== row.user_ephemeral_id,
            )
            return [...withoutSameUser, row as Vote]
          })
        } else if (payload.eventType === 'UPDATE') {
          setVotes((prev) => prev.map((v) => (v.id === (row as Vote).id ? (row as Vote) : v)))
        } else if (payload.eventType === 'DELETE') {
          setVotes((prev) => prev.filter((v) => v.id !== (row as Vote).id))
        }
      },
    )

    // Presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceUser>()
      const users: PresenceUser[] = []
      for (const key of Object.keys(state)) {
        const entries = state[key]
        if (entries.length > 0) users.push(entries[0])
      }
      setPresenceUsers(users)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: identity.id,
          nickname: identity.nickname,
          color: identity.color,
        })
      }
    })

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [roomId, identity])

  const latest = scenes.length > 0 ? scenes[scenes.length - 1] : null

  return {
    room,
    scenes,
    latest,
    votes,
    presenceCount: presenceUsers.length,
    presenceUsers,
    loading,
  }
}
