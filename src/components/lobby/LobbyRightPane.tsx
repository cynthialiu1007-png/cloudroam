'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LiveRoomList } from './LiveRoomList'
import { MyJourneysList } from './MyJourneysList'
import { getMyJourneys } from '@/lib/identity'
import { TinyCompass } from '@/components/Icons'

type LiveRoom = {
  id: string
  title: string
  starting_city: string
  last_activity_at: string
  ended_at?: string | null
}

type Tab = 'live' | 'mine'

/**
 * 首页右栏：Tab 切换
 *   - Live now：进行中的房间（服务端预取 + Realtime 订阅）
 *   - My Journeys：本浏览器参与过的所有旅行（进行中 + 已归档）
 *
 * 默认打开的 Tab：
 *   - 有 localStorage 记录 → 默认打开 "My"（回访用户）
 *   - 没有记录 → 默认 "Live"（新用户）
 */
export function LobbyRightPane({ initialRooms }: { initialRooms: LiveRoom[] }) {
  const [tab, setTab] = useState<Tab>('live')
  const [mineCount, setMineCount] = useState<number>(0)

  useEffect(() => {
    const mine = getMyJourneys()
    setMineCount(mine.length)
    // 回访用户直接打开 My Journeys
    if (mine.length > 0) setTab('mine')
  }, [])

  const activeCount = initialRooms.filter((r) => !r.ended_at).length

  return (
    <div>
      {/* Tab 头 */}
      <div className="mb-8 flex items-baseline justify-between">
        <div className="flex items-baseline gap-4">
          <TabButton active={tab === 'live'} onClick={() => setTab('live')}>
            此刻在路上
          </TabButton>
          <TinyCompass size={12} className="translate-y-[1px] text-ivory-dim/60" />
          <TabButton active={tab === 'mine'} onClick={() => setTab('mine')}>
            我的手账
          </TabButton>
        </div>
        <p className="font-mono text-caption uppercase tracking-widest2 text-ivory-dim">
          {tab === 'live'
            ? `${activeCount.toString().padStart(2, '0')} 处`
            : `${mineCount.toString().padStart(2, '0')} 段`}
        </p>
      </div>

      {/* Tab 内容（渐隐渐显） */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {tab === 'live' ? (
            <LiveRoomList initial={initialRooms} />
          ) : (
            <MyJourneysList />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`relative pb-2 font-serif text-lg transition-colors md:text-xl ${
        active ? 'text-ivory' : 'text-ivory-dim hover:text-ivory'
      }`}
    >
      {children}
      {active && (
        <motion.span
          layoutId="lobby-tab-underline"
          className="absolute inset-x-0 -bottom-px h-px bg-brass"
        />
      )}
    </button>
  )
}
