'use client'

import { useEffect, useRef, useState } from 'react'
import { Countdown, CountdownProgress } from './Countdown'
import { TypewriterText } from './TypewriterText'
import { PostageStamp } from '@/components/PostageStamp'
import type { Scene } from '@/types/db'

/**
 * 场景舞台
 *  - Ken Burns 缓慢缩放的氛围图
 *  - 右上角一枚"第 N 站"邮戳（signature）
 *  - 场景描述用打字机效果
 *  - 底部窄条：倒计时进度
 *
 * 到期触发：只有"第一个到期检测者"POST 到 advance API
 * 后端用 claim_scene_advance 保证幂等
 */
export function RoomStage({
  scene,
  startingCity,
}: {
  scene: Scene
  startingCity: string
}) {
  const [triggered, setTriggered] = useState(false)
  const triggerLockRef = useRef(false)

  // 场景切换时重置
  useEffect(() => {
    setTriggered(false)
    triggerLockRef.current = false
  }, [scene.id])

  async function handleExpire() {
    // 客户端本地 lock：避免同一客户端多次触发
    if (triggerLockRef.current) return
    triggerLockRef.current = true
    setTriggered(true)

    // 加一个 0-2s 的随机延迟：多客户端同时到期时，错峰调用 API 减少并发压力
    // （后端有 claim_scene_advance 兜底，这里只是优化）
    const jitter = Math.random() * 2000
    await new Promise((r) => setTimeout(r, jitter))

    try {
      await fetch(`/api/scenes/${scene.id}/advance`, { method: 'POST' })
      // 无论我们是否是获得推进权的那个客户端，都由 Realtime 推送新场景到所有人
    } catch (err) {
      console.error('advance trigger failed:', err)
      triggerLockRef.current = false
    }
  }

  // 已经宣布胜者但新场景还没到？(等待 Realtime)
  const isWaitingForNextScene = !!scene.winning_option_id
  const stationNumber = scene.order_index + 1

  return (
    <section className="relative h-[68vh] min-h-[500px] overflow-hidden">
      {/* Ken Burns 图片 */}
      {scene.image_url && (
        <div
          className="absolute inset-0 animate-kenburns bg-cover bg-center"
          style={{ backgroundImage: `url(${scene.image_url})` }}
        />
      )}

      {/* 从上到下的柔和渐变，让文字可读 */}
      <div className="absolute inset-0 bg-gradient-to-b from-midnight/60 via-midnight/10 to-midnight/85" />

      {/* 右上角：当前站邮戳 —— signature 元素。scene.id 作 key 保证换场景时重盖一次 */}
      <div className="absolute right-5 top-5 z-20 md:right-10 md:top-8">
        <PostageStamp
          key={scene.id}
          stationNumber={stationNumber}
          city={startingCity}
          size={116}
          delay={0.15}
        />
      </div>

      {/* 左上角：倒计时 or 状态 —— 加薄薄的 midnight 底板保证可读 */}
      <div className="absolute left-5 top-6 z-20 rounded-sm bg-midnight/50 px-3 py-1.5 backdrop-blur-sm md:left-12 md:top-8">
        {!isWaitingForNextScene ? (
          <Countdown deadline={scene.voting_ends_at} onExpire={handleExpire} />
        ) : (
          <span className="font-mono text-caption uppercase tracking-widest2 text-brass animate-pulse">
            {triggered ? '正在启程...' : '结果已定，稍等...'}
          </span>
        )}
      </div>

      {/* 场景文字（覆盖在图上）—— 大号 body-scene，慢节奏行距 */}
      <div className="absolute inset-x-0 bottom-14 z-10 flex justify-center px-5 md:px-12 md:bottom-16">
        <p className="scene-copy max-w-[760px]">
          <TypewriterText text={scene.description} />
        </p>
      </div>

      {/* 底部：细进度条（不再是"电影黑边"的宽条） */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-1.5 bg-midnight/60">
        <CountdownProgress startAt={scene.created_at} deadline={scene.voting_ends_at} />
      </div>
    </section>
  )
}
