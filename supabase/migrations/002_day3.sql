-- ============================================================
-- 云游 CloudRoam · Day 3 迁移
-- 目标：支持"结束旅行"和"旅行存档"
-- ============================================================

-- 1. 给 rooms 加"结束时间"字段
--    NULL = 进行中；有值 = 已结束
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_by TEXT;  -- 结束者 user_ephemeral_id（可选，只做记录）

-- 2. 索引：加速"进行中的房间"查询（首页 Live now）
--    只对未结束的房间建索引，节省空间
DROP INDEX IF EXISTS idx_rooms_active;
CREATE INDEX idx_rooms_active ON public.rooms(last_activity_at DESC)
  WHERE ended_at IS NULL;

-- 3. 索引：加速"存档回放"查询（按 room_id 拉所有 scenes）
--   已经有 idx_scenes_room 就行，这里补一个视图方便前端拿"完整旅程"
CREATE OR REPLACE VIEW public.journey_view AS
SELECT
  r.id AS room_id,
  r.title,
  r.starting_city,
  r.created_at AS started_at,
  r.ended_at,
  r.last_activity_at,
  (SELECT COUNT(*) FROM public.scenes s WHERE s.room_id = r.id) AS scene_count,
  (SELECT COUNT(DISTINCT v.user_ephemeral_id) FROM public.votes v
    JOIN public.scenes s ON s.id = v.scene_id WHERE s.room_id = r.id) AS traveler_count
FROM public.rooms r;

-- 视图对匿名用户开放读取
GRANT SELECT ON public.journey_view TO anon, authenticated;

-- 4. RLS：允许匿名用户更新 rooms.ended_at 和 ended_by
--   （已有 rooms 的 UPDATE 策略允许匿名 update，这里不需要新加）

-- 5. Realtime：确保 rooms 表变化会推给客户端（这样房间被别人结束时，你能立即感知）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  END IF;
END $$;

-- ============================================================
-- 验证：应返回 0 行错误
-- ============================================================
SELECT 'Day 3 migration completed' AS status;
