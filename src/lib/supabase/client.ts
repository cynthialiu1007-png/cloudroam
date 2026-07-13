import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/db'

/**
 * 浏览器端 Supabase 客户端
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
