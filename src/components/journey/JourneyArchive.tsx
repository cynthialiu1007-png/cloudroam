'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PostageStamp } from '@/components/PostageStamp'
import type { Room, Scene, SceneOption } from '@/types/db'

/**
 * 旅行存档展示
 *
 * 视觉概念：一本旅行手账 / 明信片簿
 *   - Signature：每一站以一枚邮戳（PostageStamp）作为锚点，替代干瘪的 "Scene 01" 标签
 *   - 中央双圈邮戳内是中文序数（一、二、三…）+ 起点城市 + 日期
 *   - 时间线仍是纵向金线，但从"胶片格"改为"邮戳串"
 *   - 结尾以"完"字大章收束
 *
 * 设计克制：seal 红只出现在邮戳；正文保持 ivory/mist；brass 用作分割强调
 */
export function JourneyArchive({
  room,
  scenes,
}: {
  room: Room
  scenes: Scene[]
}) {
  const isEnded = !!room.ended_at
  const startedAt = new Date(room.created_at)
  const endedAt = room.ended_at ? new Date(room.ended_at) : null

  return (
    <main className="min-h-screen bg-midnight">
      {/* 顶栏 */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ivory-faint bg-midnight/90 px-5 py-4 backdrop-blur md:px-12">
        <Link
          href="/"
          className="font-mono text-caption uppercase tracking-widest2 text-ivory-dim transition-colors hover:text-brass"
        >
          ← 云游 · CloudRoam
        </Link>
        <span className="font-mono text-caption uppercase tracking-widest2 text-mist">
          {isEnded ? '手账 · 已合上' : '手账 · 还在写'}
        </span>
      </header>

      {/* 页面头 —— 用作品页的封面感 */}
      <section className="border-b border-ivory-faint px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-[840px] gap-10 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6 font-mono text-caption uppercase tracking-widest2 text-brass"
            >
              手账 · No.{room.id.slice(0, 6).toUpperCase()}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif font-display text-display-lg leading-[1.1] text-ivory"
            >
              从 <span className="italic text-mist">{room.starting_city}</span>
              <br />
              走过的这一段
            </motion.h1>

            {/* 元数据横条 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 grid gap-6 border-t border-ivory-faint pt-6 sm:grid-cols-3"
            >
              <Meta label="启程于" value={formatFilmTimestamp(startedAt)} />
              <Meta
                label={isEnded ? '合上于' : '最后一笔'}
                value={formatFilmTimestamp(endedAt ?? new Date(room.last_activity_at))}
              />
              <Meta
                label="走过"
                value={`${String(scenes.length).padStart(2, '0')} 站`}
                accent={!isEnded}
              />
            </motion.div>
          </div>

          {/* 手账封面章 */}
          <div className="hidden md:block">
            <PostageStamp
              variant="roam"
              size={168}
              rotate={-6}
              delay={0.3}
              topArc={`${room.starting_city} · ${formatShortDate(startedAt)}`}
            />
          </div>
        </div>
      </section>

      {/* 场景时间线 */}
      <section className="px-6 py-16 md:px-12 md:py-24">
        <div className="relative mx-auto max-w-[840px]">
          {/* 纵向金线 */}
          <div className="absolute bottom-16 left-[43px] top-14 hidden w-px bg-gradient-to-b from-brass/50 via-brass/20 to-brass/0 md:block" />

          <ol className="space-y-14 md:space-y-16">
            {scenes.map((scene, idx) => (
              <SceneRow
                key={scene.id}
                scene={scene}
                index={idx}
                totalCount={scenes.length}
                startingCity={room.starting_city}
                sceneDate={new Date(scene.created_at)}
              />
            ))}
          </ol>

          {/* 结尾大章：仅当已结束时展示 */}
          {isEnded && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: '-20%' }}
              className="mt-24 flex flex-col items-center gap-4 border-t border-ivory-faint pt-16 text-center"
            >
              <PostageStamp variant="fin" size={168} rotate={4} animateStamp={false} />
              <p className="mt-2 font-mono text-caption uppercase tracking-widest2 text-ivory-dim">
                此程终于 · {formatFilmTimestamp(endedAt!)}
              </p>
            </motion.div>
          )}

          {/* 未结束提示 */}
          {!isEnded && (
            <div className="mt-16 flex justify-center border-t border-ivory-faint pt-12">
              <Link
                href={`/rooms/${room.id}`}
                className="border border-mist bg-mist/10 px-8 py-4 font-mono text-sm uppercase tracking-widest2 text-mist transition-colors hover:bg-mist hover:text-midnight"
              >
                回到这段旅行 →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 底栏 */}
      <footer className="border-t border-ivory-faint px-6 py-8 text-center md:px-12">
        <Link
          href="/"
          className="font-mono text-caption uppercase tracking-widest2 text-ivory-dim transition-colors hover:text-brass"
        >
          出发新一程 ↗
        </Link>
      </footer>
    </main>
  )
}

// ============================================================
// 单个场景
// ============================================================

function SceneRow({
  scene,
  index,
  totalCount,
  startingCity,
  sceneDate,
}: {
  scene: Scene
  index: number
  totalCount: number
  startingCity: string
  sceneDate: Date
}) {
  const winnerId = scene.winning_option_id
  const winner = winnerId ? scene.options.find((o) => o.id === winnerId) : null
  const notYetDecided = !winnerId
  const stationNumber = index + 1

  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="relative"
    >
      <div className="flex gap-5 md:gap-8">
        {/* 左：邮戳 —— 静态显示，随 SceneRow 一起 fade+slide 进入 */}
        <div className="shrink-0">
          <PostageStamp
            stationNumber={stationNumber}
            city={startingCity}
            date={formatShortDate(sceneDate)}
            size={88}
            animateStamp={false}
          />
        </div>

        {/* 右：场景内容 */}
        <div className="min-w-0 flex-1">
          {/* 页眉：站数 / 城市 / 关键词 */}
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-caption uppercase tracking-widest2 text-ivory-dim">
              第 {String(stationNumber).padStart(2, '0')} / {String(totalCount).padStart(2, '0')} 站
            </span>
            {scene.image_keyword && (
              <>
                <span className="text-brass/40">·</span>
                <span className="font-serif text-sm italic text-mist">
                  {scene.image_keyword}
                </span>
              </>
            )}
          </div>

          {/* 场景卡片 */}
          <div className="border border-ivory-faint bg-charcoal/30">
            {/* 图片条 */}
            {scene.image_url && (
              <div
                className="h-16 border-b border-ivory-faint bg-cover bg-center"
                style={{ backgroundImage: `url(${scene.image_url})` }}
              />
            )}

            <div className="px-5 py-6 md:px-7 md:py-7">
              {/* 场景文字 */}
              <p className="font-serif text-base leading-[1.9] text-ivory md:text-lg md:leading-[2]">
                {scene.description}
              </p>

              {/* 选项 */}
              <div className="mt-6 border-t border-ivory-faint pt-5">
                {notYetDecided ? (
                  <p className="font-mono text-caption uppercase tracking-widest2 text-mist">
                    · 还在做选择 ·
                  </p>
                ) : (
                  <>
                    <p className="mb-3 font-mono text-caption uppercase tracking-widest2 text-ivory-dim">
                      岔路
                    </p>
                    <div className="space-y-2.5">
                      {scene.options.map((opt) => (
                        <OptionRow
                          key={opt.id}
                          option={opt}
                          isWinner={opt.id === winnerId}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  )
}

function OptionRow({
  option,
  isWinner,
}: {
  option: SceneOption
  isWinner: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 font-serif text-sm md:text-base ${
        isWinner ? 'text-brass' : 'text-ivory-dim/60 line-through decoration-ivory-dim/30'
      }`}
    >
      <span
        className={`font-mono text-caption uppercase tracking-widest2 ${
          isWinner ? 'text-brass' : 'text-ivory-dim/40'
        }`}
      >
        {option.id.toUpperCase()}
      </span>
      <span className={isWinner ? 'font-medium' : ''}>{option.label}</span>
      {isWinner && (
        <span className="ml-auto font-mono text-caption uppercase tracking-widest2 text-brass">
          → 选了这条
        </span>
      )}
    </div>
  )
}

// ============================================================
// 元数据单元
// ============================================================

function Meta({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-caption uppercase tracking-widest2 text-ivory-dim">
        {label}
      </p>
      <p
        className={`font-serif text-base ${
          accent ? 'text-brass' : 'text-ivory'
        }`}
      >
        {value}
      </p>
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

/**
 * 邮戳用短日期: YYYY.MM
 */
function formatShortDate(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}
