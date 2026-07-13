import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RoomExperience } from '@/components/room/RoomExperience'

export const dynamic = 'force-dynamic'

/**
 * 房间页 · Day 2 版本
 * Server Component 薄壳：只负责校验 roomId、拉起始 city，其余交给客户端 RoomExperience
 */
export default async function RoomPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('id, starting_city')
    .eq('id', params.id)
    .single()

  if (!room) notFound()

  return <RoomExperience roomId={room.id} startingCity={room.starting_city} />
}
