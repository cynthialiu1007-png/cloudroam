/**
 * 匿名用户临时身份
 * 存在 localStorage 的 UUID + 昵称，用于投票时识别用户
 */

const STORAGE_KEY = 'cloudroam:identity'

const NICKNAME_PARTS_A = [
  '漫游', '夜行', '拾光', '朝雾', '流云', '寻径', '低吟', '安渡', '慢船', '踱步',
  '游丝', '拾贝', '望远', '折枝', '扑萤', '拂柳', '打盹', '独步', '守夜', '沉舟',
]

const NICKNAME_PARTS_B = [
  '的旅人', '的过客', '的行人', '的候鸟', '的猫', '的信使', '的听风者', '的拾荒者',
  '的失眠客', '的赶路人', '的夜读者', '的迷路者', '的画影人', '的守灯人', '的观星客',
]

// 6 种品牌色相关的用户标识色（与 Tailwind mist / brass 系一致）
const AVATAR_COLORS = [
  '#7BA7BC', // mist
  '#D4B96C', // brass
  '#B08968', // 陶土
  '#8FA88B', // 苔绿
  '#C48B9F', // 玫瑰灰
  '#9A8FB8', // 薰紫
]

export type Identity = {
  id: string
  nickname: string
  color: string
}

function generateIdentity(): Identity {
  const a = NICKNAME_PARTS_A[Math.floor(Math.random() * NICKNAME_PARTS_A.length)]
  const b = NICKNAME_PARTS_B[Math.floor(Math.random() * NICKNAME_PARTS_B.length)]
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
  return {
    id: crypto.randomUUID(),
    nickname: `${a}${b}`,
    color,
  }
}

/**
 * 获取或创建当前浏览器的匿名身份
 * 仅在浏览器端调用
 */
export function getOrCreateIdentity(): Identity {
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateIdentity must be called in the browser')
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Identity
      if (parsed.id && parsed.nickname && parsed.color) return parsed
    } catch {
      // 解析失败则重新生成
    }
  }

  const fresh = generateIdentity()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
  return fresh
}

/**
 * 重置身份（"换一个昵称"用）
 */
export function resetIdentity(): Identity {
  const fresh = generateIdentity()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
  return fresh
}

// ============================================================
// 我参与过的旅行（localStorage 索引，用于首页 "My Journeys" Tab）
// ============================================================

const MY_JOURNEYS_KEY = 'cloudroam:myJourneys'
const MY_JOURNEYS_LIMIT = 50 // 保留最近 50 个

type MyJourneyEntry = {
  room_id: string
  starting_city: string
  first_seen_at: string // ISO
}

/**
 * 记录当前用户参与过的房间。多次调用同一 room_id 只保留第一次。
 * 只在浏览器端调用。
 */
export function addMyJourney(roomId: string, startingCity: string): void {
  if (typeof window === 'undefined') return
  try {
    const list = getMyJourneys()
    if (list.some((e) => e.room_id === roomId)) return
    const entry: MyJourneyEntry = {
      room_id: roomId,
      starting_city: startingCity,
      first_seen_at: new Date().toISOString(),
    }
    // 最新的放前面
    const next = [entry, ...list].slice(0, MY_JOURNEYS_LIMIT)
    localStorage.setItem(MY_JOURNEYS_KEY, JSON.stringify(next))
  } catch {
    // localStorage 满或不可用 → 静默失败，不影响功能
  }
}

/**
 * 读取我参与过的所有房间（按首次进入时间倒序）
 */
export function getMyJourneys(): MyJourneyEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MY_JOURNEYS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is MyJourneyEntry =>
        typeof e?.room_id === 'string' &&
        typeof e?.starting_city === 'string' &&
        typeof e?.first_seen_at === 'string',
    )
  } catch {
    return []
  }
}

export type { MyJourneyEntry }
