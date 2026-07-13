'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TypewriterSequence } from '@/components/TypewriterSequence'

/**
 * Landing Overlay —— 先导页覆盖层
 *
 * 覆盖在首页上方，显示视频背景 + 打字机文案 + CTA 按钮。
 * 点击 CTA 后整层 fade out，露出下方首页。
 */
export function LandingOverlay({ children }: { children: React.ReactNode }) {
  const [showCTA, setShowCTA] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const lines = [
    { text: '一扇窗，爬满了春天的藤蔓。', delay: 800 },
    { text: '阳光穿透树叶，洒下一地碎金。' },
    { text: '你站在窗前，听见风从远方来。' },
    { text: '「接下来，想去哪儿？」', delay: 900 },
    { text: '路口有三条路——' },
    { text: '左边是雨声，右边是茶馆，正前方是未知。' },
    { text: '三十秒，和陌生人一起投票。', delay: 900 },
    { text: '每一票，都改变了风景。' },
    { text: '这就是云游。', delay: 900 },
    { text: '没有账号，没有目的地。' },
    { text: '只有此刻，和路上的人。' },
  ]

  if (isExiting) {
    return <>{children}</>
  }

  return (
    <div className="relative min-h-screen">
      {/* Landing Overlay */}
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-deep-forest"
          >
            {/* 视频背景 */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src="/videos/landing-bg.mp4" type="video/mp4" />
            </video>

            {/* 径向渐变 overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse at center,
                    rgba(15, 24, 20, 0.42) 0%,
                    rgba(15, 24, 20, 0.28) 45%,
                    rgba(15, 24, 20, 0.35) 100%)
                `,
              }}
            />

            {/* 内容层 */}
            <div className="relative z-10 flex flex-col items-center px-6 py-16 md:px-12">
              <div className="w-full max-w-2xl">
                <TypewriterSequence
                  lines={lines}
                  charInterval={70}
                  linePause={420}
                  onComplete={() => setShowCTA(true)}
                />
              </div>

              {/* CTA 按钮 */}
              {showCTA && (
                <motion.button
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1.0, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                  onClick={() => setIsExiting(true)}
                  className="group mt-14 overflow-hidden rounded-full border border-brass/50 bg-brass/[0.06] px-11 py-4 font-serif text-base tracking-[0.15em] text-brass backdrop-blur-sm transition-all duration-500 ease-out hover:border-brass hover:bg-brass/15 hover:scale-[1.03] md:text-lg md:px-14 md:py-[18px]"
                >
                  <span className="relative z-10 inline-flex items-center gap-3">
                    推开这扇窗
                    <motion.span
                      className="inline-block"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      →
                    </motion.span>
                  </span>
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brass/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 首页内容 */}
      {children}
    </div>
  )
}
