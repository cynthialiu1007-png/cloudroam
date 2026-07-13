import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateNextScene } from '@/lib/ai/zhipu'
import { generateAmbientSvg } from '@/lib/ai/ambient'

/**
 * POST /api/scenes/[id]/advance
 *
 * 客户端在倒计时归零时调用。
 *
 * 并发保护：多个客户端可能同时到期并调用这个 endpoint，
 * 用 claim_scene_advance() PostgreSQL 函数原子获取"推进权"——
 * 只有第一个到达的调用者会返回 true，其他都返回 false，直接退出。
 *
 * 拿到推进权后：
 *   1. 计算胜出选项（票数最多，同票则取第一个）
 *   2. 更新当前场景的 winning_option_id
 *   3. 调 Claude 生成下一个场景
 *   4. 插入新场景（其他客户端通过 Realtime 收到）
 */

const VOTING_WINDOW_SECONDS = 30

type Params = { params: { id: string } }

export async function POST(request: Request, { params }: Params) {
  const sceneId = params.id
  const supabase = createServerClient()

  try {
    // 1. 抢占"推进权"（原子操作）
    const { data: claimed, error: claimErr } = await supabase.rpc('claim_scene_advance', {
      target_scene_id: sceneId,
    })

    if (claimErr) {
      console.error('claim_scene_advance error:', claimErr)
      return NextResponse.json({ error: '推进失败' }, { status: 500 })
    }

    if (!claimed) {
      // 别的客户端已经在推进了，安静退出
      return NextResponse.json({ status: 'already_advancing' })
    }

    // 2. 读当前场景 + 该房间的所有历史场景
    const { data: current, error: currentErr } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', sceneId)
      .single()

    if (currentErr || !current) {
      console.error('Failed to read current scene:', currentErr)
      return NextResponse.json({ error: '找不到当前场景' }, { status: 404 })
    }

    // 2.5 检查房间是否已被结束 —— 已结束就不再生成新场景
    const { data: roomCheck } = await supabase
      .from('rooms')
      .select('ended_at')
      .eq('id', current.room_id)
      .single()

    if (roomCheck?.ended_at) {
      return NextResponse.json({ status: 'room_ended' })
    }

    // 3. 读该场景的所有投票，选出胜者
    const { data: votes } = await supabase
      .from('votes')
      .select('option_id')
      .eq('scene_id', sceneId)

    const tally = new Map<string, number>()
    for (const v of votes ?? []) {
      tally.set(v.option_id, (tally.get(v.option_id) ?? 0) + 1)
    }

    // 找出票数最多的选项——同票时按选项数组顺序取第一个（稳定）
    let winner = current.options[0]
    let winnerVotes = tally.get(winner.id) ?? 0
    for (const opt of current.options) {
      const v = tally.get(opt.id) ?? 0
      if (v > winnerVotes) {
        winner = opt
        winnerVotes = v
      }
    }

    // 4. 标记胜者
    await supabase
      .from('scenes')
      .update({ winning_option_id: winner.id })
      .eq('id', sceneId)

    // 5. 读该房间的历史（含刚刚定下的胜者），用于 Claude 上下文
    const { data: history } = await supabase
      .from('scenes')
      .select('description, options, winning_option_id, order_index')
      .eq('room_id', current.room_id)
      .order('order_index', { ascending: true })

    const historyForAI = (history ?? [])
      .filter((h) => h.winning_option_id) // 只带上已定局的场景
      .map((h) => {
        const chosen = h.options.find((o) => o.id === h.winning_option_id)
        return {
          description: h.description,
          chosen_label: chosen?.label ?? '（未知）',
        }
      })

    // 6. 拉取起始城市
    const { data: room } = await supabase
      .from('rooms')
      .select('starting_city')
      .eq('id', current.room_id)
      .single()

    const city = room?.starting_city ?? '未名之地'

    // 7. 调 Claude 生成下一个场景
    const nextScene = await generateNextScene({
      city,
      history: historyForAI,
      chosen_label: winner.label,
    })

    // 8. 生成氛围图（SVG 数据 URI，零外部依赖）
    const imageUrl = generateAmbientSvg(nextScene.image_keyword)

    // 9. 插入新场景
    const nextOrder = current.order_index + 1
    const votingEndsAt = new Date(Date.now() + VOTING_WINDOW_SECONDS * 1000).toISOString()

    const { data: inserted, error: insertErr } = await supabase
      .from('scenes')
      .insert({
        room_id: current.room_id,
        order_index: nextOrder,
        description: nextScene.description,
        image_url: imageUrl,
        image_keyword: nextScene.image_keyword,
        options: nextScene.options,
        voting_ends_at: votingEndsAt,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('Failed to insert next scene:', insertErr)
      return NextResponse.json({ error: '生成下一场景失败' }, { status: 500 })
    }

    // 10. 更新房间的 last_activity_at
    await supabase
      .from('rooms')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', current.room_id)

    return NextResponse.json({
      status: 'advanced',
      next_scene_id: inserted.id,
      winner: winner.id,
    })
  } catch (err) {
    console.error('Unhandled error in advance:', err)
    return NextResponse.json({ error: '服务器开小差了' }, { status: 500 })
  }
}
