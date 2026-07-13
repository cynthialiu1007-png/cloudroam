'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRoom } from '@/hooks/useRoom'
import { useIdentity } from '@/hooks/useIdentity'
import { addMyJourney } from '@/lib/identity'
import { RoomStage } from './RoomStage'
import { ChoicesList } from './ChoicesList'
import { JournalDrawer } from './JournalDrawer'
import { PresenceStack } from './PresenceStack'
import { EndJourneyButton } from './EndJourneyButton'
import { PauseJourneyButton } from './PauseJourneyButton'
import { JourneyEnded } from './JourneyEnded'

/**
 * 房间页的客户端根组件
 * 组装了所有子组件 + 全局状态
 */
export function RoomExperience({
  roomId,
  startingCity,
}: {
  roomId: string
  startingCity: string
}) {
  const identity = useIdentity()
  const room = useRoom(roomId, identity)
  const [journalOpen, setJournalOpen] = useState(false)

  // 参与过的房间记入 localStorage（进入后立刻记，方便"My Journeys"回顾）
  useEffect(() => {
    if (identity && roomId) {
      addMyJourney(roomId, startingCity)
    }
  }, [identity, roomId, startingCity])

  if (!identity || room.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="eyebrow animate-pulse text-ivory-dim">正在启程...</p>
      </main>
    )
  }

  if (!room.latest) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="scene-copy text-lg text-ivory-dim">这段旅行还没开始。</p>
      </main>
    )
  }

  const finishedScenes = room.scenes.filter((s) => s.winning_option_id != null)
  const isEnded = !!room.room?.ended_at

  return (
    <main className="min-h-screen">
      {/* 顶栏 */}
      <header className="relative z-30 flex items-center justify-between border-b border-ivory-faint bg-midnight px-5 py-3 md:px-12 md:py-4">
        <Link
          href="/"
          className="eyebrow text-ivory-dim transition-colors hover:text-brass"
        >
          ← 云游 · CloudRoam
        </Link>
        <div className="flex items-center gap-4">
          <span className="eyebrow hidden text-mist sm:inline">
            {isEnded ? (
              <>已结束 · {startingCity}</>
            ) : (
              <>
                Scene {String(room.latest.order_index + 1).padStart(2, '0')} · {startingCity}
              </>
            )}
          </span>
          <PresenceStack users={room.presenceUsers} me={identity.id} />
        </div>
      </header>

      {/* 内容区：结束态显示 JourneyEnded，否则显示 RoomStage + ChoicesList */}
      <AnimatePresence mode="wait">
        {isEnded ? (
          <motion.div
            key="ended"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <JourneyEnded
              room={room.room!}
              scenes={room.scenes}
              startingCity={startingCity}
            />
          </motion.div>
        ) : (
          <motion.div
            key={room.latest.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
          >
            <RoomStage scene={room.latest} startingCity={startingCity} />
            <ChoicesList scene={room.latest} votes={room.votes} identity={identity} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部工具条：日记 + 暂停 + 结束 */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col-reverse items-end gap-2 md:bottom-6 md:right-6 md:flex-row md:items-center">
        <button
          onClick={() => setJournalOpen(true)}
          className="border border-ivory-faint bg-charcoal/80 px-4 py-2.5 font-mono text-xs uppercase tracking-widest2 text-ivory-dim backdrop-blur transition-colors hover:border-brass hover:text-brass md:px-5 md:py-3 md:text-sm"
        >
          📔 旅行日记 · {finishedScenes.length}
        </button>
        {!isEnded && (
          <>
            <PauseJourneyButton />
            <EndJourneyButton roomId={roomId} userId={identity.id} />
          </>
        )}
      </div>

      {/* 旅行日记侧栏 */}
      <JournalDrawer
        open={journalOpen}
        onClose={() => setJournalOpen(false)}
        scenes={room.scenes}
        startingCity={startingCity}
      />
    </main>
  )
}
