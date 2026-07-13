'use client'

import type { PresenceUser } from '@/hooks/useRoom'
import { PerforatedRing } from '@/components/Icons'

/**
 * 头像堆叠：显示房间当前在场用户
 * 最多显示 5 个，超出显示 +N
 * 当前用户外围套一层邮票齿边环
 */
export function PresenceStack({ users, me }: { users: PresenceUser[]; me: string }) {
  const shown = users.slice(0, 5)
  const overflow = users.length - shown.length

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        {shown.map((u) => {
          const isMe = u.id === me
          return (
            <div
              key={u.id}
              title={u.nickname + (isMe ? '（你）' : '')}
              className="relative -ml-1.5 inline-flex h-7 w-7 items-center justify-center first:ml-0"
            >
              {/* 齿边环（仅当前用户） */}
              {isMe && (
                <PerforatedRing
                  size={34}
                  teeth={14}
                  color="#D4B96C"
                  strokeWidth={1}
                  className="absolute -inset-[3.5px]"
                />
              )}
              {/* 头像本体 */}
              <span
                className="relative block h-7 w-7 rounded-full border-2 border-midnight"
                style={{ background: u.color, boxShadow: `0 0 0 1px rgba(237, 229, 211, 0.18)` }}
              />
            </div>
          )
        })}
      </div>
      {overflow > 0 && (
        <span className="font-mono text-caption text-ivory-dim">
          +{overflow}
        </span>
      )}
      <span className="hidden font-mono text-caption tracking-wider2 text-ivory-dim md:inline">
        {users.length} 人在路上
      </span>
    </div>
  )
}
