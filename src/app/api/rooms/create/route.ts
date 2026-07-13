import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateFirstScene } from '@/lib/ai/zhipu'
import { generateAmbientSvg } from '@/lib/ai/ambient'

/**
 * POST /api/rooms/create
 * body: { city: string }
 *
 * 创建房间 + 生成首个场景 + 搜首张氛围图
 */

const VOTING_WINDOW_SECONDS = 30

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const city = typeof body.city === 'string' ? body.city.trim() : ''

    if (!city || city.length > 40) {
      return NextResponse.json({ error: '请输入 1–40 字的目的地' }, { status: 400 })
    }

    // 1. 让智谱 AI 生成第一个场景
    const scene = await generateFirstScene({ city })

    // 2. 根据关键词生成 SVG 氛围图（零外部依赖）
    const imageUrl = generateAmbientSvg(scene.image_keyword)

    // 3. 写入数据库
    const supabase = createServerClient()

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({
        title: `${city}漫游`,
        starting_city: city,
      })
      .select('*')
      .single()

    if (roomErr || !room) {
      console.error('Failed to create room:', roomErr)
      return NextResponse.json({ error: '创建房间失败' }, { status: 500 })
    }

    const votingEndsAt = new Date(Date.now() + VOTING_WINDOW_SECONDS * 1000).toISOString()

    const { error: sceneErr } = await supabase.from('scenes').insert({
      room_id: room.id,
      order_index: 0,
      description: scene.description,
      image_url: imageUrl,
      image_keyword: scene.image_keyword,
      options: scene.options,
      voting_ends_at: votingEndsAt,
    })

    if (sceneErr) {
      console.error('Failed to create scene:', sceneErr)
      // 回滚房间
      await supabase.from('rooms').delete().eq('id', room.id)
      return NextResponse.json({ error: '生成场景失败' }, { status: 500 })
    }

    return NextResponse.json({ room_id: room.id })
  } catch (err) {
    console.error('Unhandled error in /api/rooms/create:', err)
    return NextResponse.json({ error: '服务器开小差了，稍后再试' }, { status: 500 })
  }
}
