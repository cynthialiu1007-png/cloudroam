'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Scene } from '@/types/db'

/**
 * 旅行日记侧边抽屉
 * 显示已定局的场景列表：编号 + 描述前 80 字 + 大家选择了什么
 */
export function JournalDrawer({
  open,
  onClose,
  scenes,
  startingCity,
}: {
  open: boolean
  onClose: () => void
  scenes: Scene[]
  startingCity: string
}) {
  const finishedScenes = scenes.filter((s) => s.winning_option_id != null)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-midnight/60"
            onClick={onClose}
          />

          {/* 抽屉 */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
            className="fixed right-0 top-0 z-50 h-screen w-[min(92vw,480px)] overflow-y-auto border-l border-ivory-faint bg-midnight/95 p-10 backdrop-blur-xl"
          >
            <header className="mb-8 flex items-baseline justify-between border-b border-ivory-faint pb-6">
              <div>
                <p className="eyebrow text-brass">Travel journal</p>
                <h2 className="mt-2 font-serif text-2xl font-light">{startingCity} · 旅行日记</h2>
              </div>
              <button
                onClick={onClose}
                className="font-mono text-caption uppercase tracking-widest2 text-ivory-dim hover:text-brass"
              >
                关闭 ✕
              </button>
            </header>

            {finishedScenes.length === 0 ? (
              <p className="font-serif text-base leading-[1.85] text-ivory-dim">
                这段旅行还没有故事——第一幕正在发生。
              </p>
            ) : (
              <ol className="space-y-0">
                {finishedScenes.map((s) => {
                  const winner = s.options.find((o) => o.id === s.winning_option_id)
                  return (
                    <li
                      key={s.id}
                      className="border-b border-ivory-faint py-6 last:border-b-0"
                    >
                      <p className="font-mono text-caption uppercase tracking-widest2 text-brass">
                        Scene {String(s.order_index + 1).padStart(2, '0')}
                      </p>
                      <p className="mt-3 font-serif text-base leading-[1.8] text-ivory">
                        {truncate(s.description, 80)}
                      </p>
                      {winner && (
                        <p className="mt-3 font-serif text-sm italic text-mist">
                          → {winner.label}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n) + '...'
}
