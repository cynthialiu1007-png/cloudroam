import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/rooms/[id]/end
 * body: { user_ephemeral_id: string }
 *
 * 结束旅行：标记 rooms.ended_at = NOW()，rooms.ended_by = user_id
 * 幂等：如果已经结束过，直接返回成功
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const roomId = params.id
    const body = await request.json().catch(() => ({}))
    const userId = typeof body.user_ephemeral_id === 'string' ? body.user_ephemeral_id : null

    const supabase = createServerClient()

    // 1. 先读一下房间状态
    const { data: room, error: readErr } = await supabase
      .from('rooms')
      .select('id, ended_at')
      .eq('id', roomId)
      .single()

    if (readErr || !room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 })
    }

    // 2. 已经结束了，幂等返回
    if ((room as any).ended_at) {
      return NextResponse.json({ ended_at: (room as any).ended_at, already_ended: true })
    }

    // 3. 更新为已结束
    const endedAt = new Date().toISOString()
    const { error: updateErr } = await supabase
      .from('rooms')
      .update({
        ended_at: endedAt,
        ended_by: userId,
        is_active: false, // 也标记 is_active = false
      })
      .eq('id', roomId)
      .is('ended_at', null) // 双保险：只更新还没结束的

    if (updateErr) {
      console.error('Failed to end room:', updateErr)
      return NextResponse.json({ error: '结束房间失败' }, { status: 500 })
    }

    return NextResponse.json({ ended_at: endedAt, already_ended: false })
  } catch (err) {
    console.error('Unhandled error in /api/rooms/[id]/end:', err)
    return NextResponse.json({ error: '服务器开小差了' }, { status: 500 })
  }
}
