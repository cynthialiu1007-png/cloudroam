-- ============================================================
-- 云游 CloudRoam · 数据库 Schema
-- 3 张表：rooms / scenes / votes
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- rooms（房间）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  starting_city TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,  -- 房间是否还活跃（用于 Lobby 过滤）
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_rooms_active ON public.rooms(is_active, last_activity_at DESC) WHERE is_active = TRUE;

-- ============================================================
-- scenes（场景 = 旅行日记里的一帧）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  image_keyword TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{id, label}, ...]
  winning_option_id TEXT,                        -- null = 还在投票
  voting_ends_at TIMESTAMPTZ NOT NULL,
  advanced_at TIMESTAMPTZ,                       -- 已推进到下一场景的时间戳（并发保护标记）
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (room_id, order_index)
);

CREATE INDEX idx_scenes_room ON public.scenes(room_id, order_index);
CREATE INDEX idx_scenes_pending ON public.scenes(voting_ends_at) WHERE winning_option_id IS NULL;

-- ============================================================
-- votes（投票）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  user_ephemeral_id TEXT NOT NULL,      -- 浏览器 localStorage 生成的临时 ID
  user_nickname TEXT NOT NULL,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (scene_id, user_ephemeral_id)  -- 一人一票，可通过 UPSERT 改票
);

CREATE INDEX idx_votes_scene ON public.votes(scene_id);

-- ============================================================
-- RLS 策略：允许匿名读写（这是纯匿名 Demo）
-- ============================================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms: anon read"    ON public.rooms  FOR SELECT USING (TRUE);
CREATE POLICY "Rooms: anon insert"  ON public.rooms  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Rooms: anon update"  ON public.rooms  FOR UPDATE USING (TRUE);

CREATE POLICY "Scenes: anon read"   ON public.scenes FOR SELECT USING (TRUE);
CREATE POLICY "Scenes: anon insert" ON public.scenes FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Scenes: anon update" ON public.scenes FOR UPDATE USING (TRUE);

CREATE POLICY "Votes: anon read"    ON public.votes  FOR SELECT USING (TRUE);
CREATE POLICY "Votes: anon upsert"  ON public.votes  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- Realtime 发布
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scenes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- ============================================================
-- 并发保护函数：原子推进场景
-- 用 UPDATE ... WHERE advanced_at IS NULL 实现"只有第一个调用者能成功"
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_scene_advance(target_scene_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  claimed BOOLEAN := FALSE;
BEGIN
  UPDATE public.scenes
     SET advanced_at = NOW()
   WHERE id = target_scene_id
     AND advanced_at IS NULL
     AND winning_option_id IS NULL
     AND voting_ends_at <= NOW();

  GET DIAGNOSTICS claimed = ROW_COUNT;
  RETURN claimed;
END;
$$ LANGUAGE plpgsql;
