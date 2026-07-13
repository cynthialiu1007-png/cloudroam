import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/scenes/[id]/vote
 * body: { user_ephemeral_id, user_nickname, option_id }
 *
 * 一人一票，可反复改票（upsert on unique(scene_id, user_ephemeral_id)）。
 * 投票关闭后（scene.winning_option_id != null）拒绝新投票。
 */

type Params = { params: { id: string } }

export async function POST(request: Request, { params }: Params) {
  try {
    const sceneId = params.id
    const body = await request.json()
    const { user_ephemeral_id, user_nickname, option_id } = body

    if (!user_ephemeral_id || !user_nickname || !option_id) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const supabase = createServerClient()

    // 检查场景状态：如果已经推进（winning_option_id 非 null）就拒绝
    const { data: scene, error: sceneErr } = await supabase
      .from('scenes')
      .select('winning_option_id, options, voting_ends_at')
      .eq('id', sceneId)
      .single()

    if (sceneErr || !scene) {
      return NextResponse.json({ error: '场景不存在' }, { status: 404 })
    }

    if (scene.winning_option_id) {
      return NextResponse.json({ error: '投票已结束' }, { status: 409 })
    }

    // 检查 option_id 是否是这个场景的合法选项
    const valid = scene.options.some((o) => o.id === option_id)
    if (!valid) {
      return NextResponse.json({ error: '选项不合法' }, { status: 400 })
    }

    // upsert：一人一票，同一用户改票等同于更新
    const { error: voteErr } = await supabase
      .from('votes')
      .upsert(
        {
          scene_id: sceneId,
          user_ephemeral_id,
          user_nickname,
          option_id,
        },
        { onConflict: 'scene_id,user_ephemeral_id' },
      )

    if (voteErr) {
      console.error('vote upsert error:', voteErr)
      return NextResponse.json({ error: '投票失败' }, { status: 500 })
    }

    return NextResponse.json({ status: 'voted' })
  } catch (err) {
    console.error('vote unhandled error:', err)
    return NextResponse.json({ error: '服务器开小差了' }, { status: 500 })
  }
}
