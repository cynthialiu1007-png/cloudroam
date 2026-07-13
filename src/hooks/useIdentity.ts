'use client'

import { useEffect, useState } from 'react'
import { getOrCreateIdentity, type Identity } from '@/lib/identity'

/**
 * 客户端唯一获取 identity 的入口
 * 用 hook 避免 SSR/CSR 首屏不一致
 */
export function useIdentity(): Identity | null {
  const [identity, setIdentity] = useState<Identity | null>(null)

  useEffect(() => {
    setIdentity(getOrCreateIdentity())
  }, [])

  return identity
}
