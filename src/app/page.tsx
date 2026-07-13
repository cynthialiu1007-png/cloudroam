import { createServerClient } from '@/lib/supabase/server'
import { HomePageClient } from './HomePageClient'

export const dynamic = 'force-dynamic'

/**
 * 首页 · Lobby
 *
 * 合并了 Landing Overlay + 首页主体内容。
 * 访问 / 时先显示先导动画（视频 + 打字机文案），点击 CTA 后进入首页。
 *
 * 布局灵感：老式火车站的到达/出发看板 + 手写旅行手账。
 */
export default async function LobbyPage() {
  const supabase = createServerClient()

  // 服务端拉一次进行中的初始数据；客户端组件后续会 Realtime 订阅
  const { data: initialRooms } = await supabase
    .from('rooms')
    .select('id, title, starting_city, last_activity_at, ended_at')
    .is('ended_at', null)
    .order('last_activity_at', { ascending: false })
    .limit(12)

  return <HomePageClient initialRooms={initialRooms ?? []} />
}
