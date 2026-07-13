import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

/**
 * 服务端 Supabase 客户端（Server Actions / API Routes 使用）
 * 由于本 MVP 无用户认证，用 anon key 就够了
 */
export function createServerClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
    },
  )
}

/**
 * 使用 service_role key 的服务端客户端
 * 绕过 RLS，仅用于服务端可信操作
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    },
  )
}
