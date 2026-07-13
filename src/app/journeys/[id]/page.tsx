import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { JourneyArchive } from '@/components/journey/JourneyArchive'

export const dynamic = 'force-dynamic'

/**
 * 旅行存档展示页
 *   /journeys/[id]
 *
 * 无论房间是否已经结束都可以访问：
 *   - 已结束 → 完整存档
 *   - 进行中 → 也能看已走过的场景，页首多一个"这段路还在继续"的标签
 */
export default async function JourneyPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const [{ data: room }, { data: scenes }] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', params.id).single(),
    supabase
      .from('scenes')
      .select('*')
      .eq('room_id', params.id)
      .order('order_index', { ascending: true }),
  ])

  if (!room) notFound()

  return (
    <JourneyArchive
      room={room}
      scenes={scenes ?? []}
    />
  )
}
