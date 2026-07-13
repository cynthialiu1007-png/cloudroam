'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const SUGGESTIONS = ['云南', '京都', '首尔', '曼谷', '墨西哥城']

export function CreateRoomForm() {
  const router = useRouter()
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function submit(target: string) {
    setError(null)
    const trimmed = target.trim()
    if (!trimmed) {
      setError('先给这段旅程一个地名')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/rooms/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: trimmed }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? '出发失败了')
          return
        }
        router.push(`/rooms/${data.room_id}`)
      } catch {
        setError('网络似乎断了')
      }
    })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void submit(city)
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <input
          value={city}
          onChange={(e) => {
            setCity(e.target.value)
            if (error) setError(null)
          }}
          disabled={pending}
          placeholder="京都 · 云南 · 外婆家..."
          className="w-full flex-1 border-b-2 border-ivory-faint bg-transparent px-1 py-4 font-serif text-2xl font-light text-ivory placeholder:text-ivory-dim placeholder:font-light focus:border-brass focus:outline-none disabled:opacity-50 md:text-3xl md:py-5"
          aria-label="目的地"
          maxLength={40}
        />
        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          className="group relative overflow-hidden border-2 border-brass px-10 py-4 font-mono text-base uppercase tracking-widest2 text-brass transition-colors hover:bg-brass hover:text-midnight disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-brass md:px-14 md:py-5 md:text-base"
        >
          {pending ? (
            <span className="flex items-center gap-3">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brass group-hover:bg-midnight" />
              正在启程
            </span>
          ) : (
            '开始 →'
          )}
        </motion.button>
      </form>

      {/* 推荐地名 —— 点击后只填入输入框，需要用户点"开始"再创建 */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5 text-sm text-ivory-dim">
        <span className="font-mono uppercase text-caption tracking-wider2">or try</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            onClick={() => {
              setCity(s)
              if (error) setError(null)
            }}
            className={`border px-3.5 py-1.5 font-serif text-base transition-colors disabled:opacity-50 ${
              city === s
                ? 'border-brass text-brass'
                : 'border-ivory-faint text-ivory hover:border-brass hover:text-brass'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-red-400/90">
          {error}
        </p>
      )}
    </div>
  )
}
