'use client'

import { LandingOverlay } from '@/components/lobby/LandingOverlay'
import { CreateRoomForm } from '@/components/lobby/CreateRoomForm'
import { LobbyRightPane } from '@/components/lobby/LobbyRightPane'
import { PostageStamp } from '@/components/PostageStamp'
import { BreathingDot, ChineseNum, FloatY } from '@/components/Icons'
import { TypewriterTitle } from '@/components/lobby/TypewriterTitle'

/**
 * 首页客户端包装器
 *
 * 包含 Landing Overlay + 首页主体内容。
 * Overlay 显示先导动画，点击 CTA 后 fade out 露出首页。
 */
export function HomePageClient({ initialRooms }: { initialRooms: any[] }) {
  return (
    <LandingOverlay>
      <main className="relative min-h-screen overflow-hidden">
        {/* 顶部角标 */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
          <div className="pointer-events-auto flex items-center gap-3">
            <span className="font-mono text-caption uppercase tracking-widest2 text-ivory-dim">
              云游 · CloudRoam
            </span>
            <span className="text-brass/60">·</span>
            <span className="font-mono text-caption tracking-wider2 text-ivory-dim">
              手账正开着
            </span>
            <span className="text-brass/60">·</span>
            <span className="inline-flex items-center gap-2 font-mono text-caption tracking-wider2 text-ivory">
              <BreathingDot size={7} />
              <span>有人在路上</span>
            </span>
          </div>
          <FloatY amp={2} duration={6} className="pointer-events-none">
            <PostageStamp variant="roam" size={72} animateStamp={false} />
          </FloatY>
        </header>

        {/* 主体：两栏 */}
        <div className="relative z-0 grid min-h-screen grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
          {/* 左栏：启程 */}
          <section className="flex flex-col justify-center px-6 py-24 md:px-16 md:py-32 lg:pl-24 lg:pr-16">
            <FloatY amp={1.5} duration={6} delay={0.5}>
              <p className="font-mono text-caption uppercase tracking-widest2 text-brass mb-8">Departure</p>
            </FloatY>

            <FloatY amp={1.5} duration={8}>
              <h1 className="mb-10 font-serif font-display text-display-hero text-ivory">
                说一个地名。
                <br />
                <span className="text-mist italic">
                  <TypewriterTitle text="和路上偶遇的人" />
                </span>
                <br />
                走一段不会重来的路。
              </h1>
            </FloatY>

            <CreateRoomForm />

            <div className="mt-16 flex items-center gap-4 text-ivory-dim">
              <span className="h-px w-10 bg-ivory-faint" />
              <span className="font-mono uppercase text-caption tracking-wider2">how it works</span>
            </div>

            {/* how it works */}
            <ol className="mt-6 max-w-lg space-y-6">
              <li className="grid grid-cols-[auto_1fr] items-start gap-5">
                <FloatY amp={2} duration={4.5} delay={0}>
                  <ChineseNum n={1} className="text-lg pt-1" />
                </FloatY>
                <div>
                  <p className="font-serif text-lg text-ivory">说一个想去的地名</p>
                  <p className="mt-1 font-serif text-sm text-ivory-dim">
                    京都、云南、外婆家都行——甚至"火车途中的一个小站"
                  </p>
                </div>
              </li>
              <li className="grid grid-cols-[auto_1fr] items-start gap-5">
                <FloatY amp={2} duration={4.5} delay={1.5}>
                  <ChineseNum n={2} className="text-lg pt-1" />
                </FloatY>
                <div>
                  <p className="font-serif text-lg text-ivory">场景像一封短信落下</p>
                  <p className="mt-1 font-serif text-sm text-ivory-dim">
                    读它，你会看见路上有三个岔口
                  </p>
                </div>
              </li>
              <li className="grid grid-cols-[auto_1fr] items-start gap-5">
                <FloatY amp={2} duration={4.5} delay={3}>
                  <ChineseNum n={3} className="text-lg pt-1" />
                </FloatY>
                <div>
                  <p className="font-serif text-lg text-ivory">三十秒里，投票拐弯</p>
                  <p className="mt-1 font-serif text-sm text-ivory-dim">
                    一个人也走得动，人多了更热闹
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* 右栏：Live now / My Journeys Tab */}
          <aside className="border-t border-ivory-faint bg-charcoal/40 px-6 py-16 md:px-16 md:py-24 lg:border-l lg:border-t-0 lg:pl-16 lg:pr-24">
            <LobbyRightPane initialRooms={initialRooms} />
          </aside>
        </div>
      </main>
    </LandingOverlay>
  )
}
