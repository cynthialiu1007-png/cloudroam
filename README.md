# 云游 CloudRoam · Day 1–2

> 一款 AI 主持的实时协作文字旅行 Web Demo。打开链接就能玩。

## Day 1–2 交付了什么

**Day 1（骨架）**

1. Next.js 14 项目骨架 · TypeScript / Tailwind / Framer Motion
2. 视觉体系 · Cinematic Letterbox（电影字幕美学）· 暗色调 · 定制字体
3. Supabase 数据库 · 3 张表 (`rooms` / `scenes` / `votes`) + Realtime + 并发保护函数 `claim_scene_advance()`
4. 核心库封装 · 智谱 GLM-4-Flash（国内直连、完全免费、Function Calling 结构化场景）/ SVG 氛围图自动生成 / 匿名身份
5. 首页 Lobby · 启程入口 + 实时房间列表
6. API · `POST /api/rooms/create`

**Day 2（完整交互）**

7. **API** · `POST /api/scenes/[id]/advance`（推进场景 + 生成下一场景）· `POST /api/scenes/[id]/vote`（投票，upsert 语义）
8. **`useRoom` Hook** · 统一订阅 scenes / votes / presence 三种 Realtime 能力
9. **`RoomExperience`** · 房间页客户端根组件，用 AnimatePresence 处理场景切换
10. **`RoomStage`** · 电影黑边 + Ken Burns 氛围图 + 打字机场景文字 + 顶部倒计时 + 底部进度条
11. **`Countdown`** · 每 250ms 重新计算的倒计时，最后 5 秒 brass 脉动
12. **`TypewriterText`** · 中文逐字显示，标点处停顿，尊重 reduced motion
13. **`ChoicesList`** · 投票交互 · 每人一票可改 · 实时票数与彩色小圆点
14. **`PresenceStack`** · 在场用户头像堆叠，自己有 brass 金色描边
15. **`JournalDrawer`** · 旅行日记侧边抽屉（framer-motion 滑入）
16. **到期触发器** · 客户端 lock + 0-2s 随机 jitter + 服务端 `claim_scene_advance()` 原子保护，四层防重复

Day 2 结束时，你能：多个浏览器打开同一房间 → 投票实时同步 → 30 秒到期自动生成下一场景 → 场景切换有电影感过渡。

## 目录结构（Day 2 新增标 ★）

```
cloudroam/
├── supabase/migrations/001_initial.sql
└── src/
    ├── app/
    │   ├── page.tsx                              ← Lobby
    │   ├── rooms/[id]/page.tsx                   ← 房间页薄壳（Day 2 重写）
    │   └── api/
    │       ├── rooms/create/route.ts             ← Day 1
    │       ├── scenes/[id]/advance/route.ts    ★ Day 2 · 推进场景
    │       └── scenes/[id]/vote/route.ts       ★ Day 2 · 投票
    ├── components/
    │   ├── lobby/{CreateRoomForm,LiveRoomList}.tsx
    │   └── room/                              ★
    │       ├── RoomExperience.tsx           ★ 客户端根组件
    │       ├── RoomStage.tsx                ★ 舞台（图 + 打字机 + 倒计时）
    │       ├── ChoicesList.tsx              ★ 投票
    │       ├── Countdown.tsx                ★ 倒计时 + 进度条
    │       ├── TypewriterText.tsx           ★ 打字机
    │       ├── PresenceStack.tsx            ★ 在场用户
    │       └── JournalDrawer.tsx            ★ 旅行日记
    ├── hooks/                                ★
    │   ├── useRoom.ts                       ★ Realtime 订阅
    │   └── useIdentity.ts                   ★
    ├── lib/
    │   ├── identity.ts
    │   ├── supabase/{client,server}.ts
    │   └── ai/{claude,unsplash}.ts
    └── types/db.ts
```

## 目录结构

```
cloudroam/
├── package.json
├── tailwind.config.ts       ← 品牌色板 + 动画
├── tsconfig.json
├── next.config.mjs
├── postcss.config.js
├── .env.example
├── supabase/
│   └── migrations/
│       └── 001_initial.sql   ← 3张表 + RLS + Realtime
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css        ← 字体 + 组件类
    │   ├── page.tsx           ← 首页 Lobby
    │   ├── rooms/[id]/page.tsx ← 房间页占位（Day 2 重写）
    │   └── api/rooms/create/route.ts
    ├── components/
    │   └── lobby/
    │       ├── CreateRoomForm.tsx
    │       └── LiveRoomList.tsx
    ├── lib/
    │   ├── utils.ts
    │   ├── identity.ts        ← 匿名 UUID + 昵称
    │   ├── supabase/{client,server}.ts
    │   └── ai/
    │       ├── claude.ts       ← Tool Use 场景生成
    │       └── unsplash.ts
    └── types/db.ts
```

## 快速启动（本地）

### 1. 准备账号（约 10 分钟，全部免费，国内直连）

- **Supabase**: https://supabase.com/ → 创建项目（Free 版，Tokyo 区），记录 `Project URL`、`anon key`、`service_role key`
- **智谱 AI**: https://open.bigmodel.cn/ → 手机号注册，获取 API Key（完全免费，每月 2000 万 tokens）

### 2. 装依赖

```bash
cd cloudroam
pnpm install
```

### 3. 环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local，填入 4 个 Key
```

### 4. 建数据库

在 Supabase Dashboard → SQL Editor，复制 `supabase/migrations/001_initial.sql` 全部内容，粘贴执行。

**验证**：Dashboard → Table Editor 应该看到 `rooms` / `scenes` / `votes` 三张表。

### 5. 起服

```bash
pnpm dev
```

打开 http://localhost:3000

## 试玩流程

1. 首页看到"输入一个地名"和 5 个推荐（京都/冰岛/喀什/里斯本/外婆家）
2. 点任一推荐 → 等待约 3–5 秒（智谱 GLM 生成场景 + SVG 氛围图立即生成）
3. 跳转到 `/rooms/{roomId}` → 看到根据场景关键词自动生成的渐变氛围图 + 场景描述（打字机效果）+ 3 个下一步选项
4. 回到首页 → 右侧列表实时显示刚才创建的房间

## 设计决策速览

**视觉基调**：Cinematic Letterbox（避开当前 AI 设计的三个默认审美——terracotta 米色、acid-green 深黑、broadsheet 报纸风）

**色板**：
- `midnight #0F1419` 背景
- `ivory #EDE5D3` 正文
- `mist #7BA7BC` 招牌色/强调
- `brass #D4B96C` 编号/倒计时
- `charcoal #26272C` 卡片

**字体**：Noto Serif SC（场景/标题）+ Noto Sans SC（UI）+ JetBrains Mono（倒计时数字，Day 2 使用）

**核心决策**：
- 智谱 GLM-4-Flash + Function Calling `commit_scene` 保证结构化输出（服务端还会强制 id 为 a/b/c）
- 氛围图用 SVG 渐变自动生成（12 种色调 + 4 种粒子效果 + 关键词匹配），零外部依赖、国内直连、瞬间加载
- 匿名身份用 `crypto.randomUUID()` + 中式浪漫昵称（如"漫游的猫"、"守夜的信使"）
- 并发保护：`claim_scene_advance()` PostgreSQL 函数，用 UPDATE 的 `ROW_COUNT` 实现"只有第一个到期检测者能推进"

## 已知限制（Day 3 修）

- 房间不会自动"下架"（`is_active` 永远为 true，长期看会累积僵尸房间）
- 没有房间归档机制（超过 N 小时无活动应该 `is_active = false`）
- 分享链接的短 URL / OG 卡片没做
- Vercel 部署配置文档待补
- 移动端某些边界情况（超小屏、iOS Safari 底栏）未细调

## Day 3 计划

- 房间自动归档（Supabase Edge Function 定时任务，或首页加载时懒清理）
- OG 图 / 社交分享卡片
- Vercel 一键部署配置 + 生产环境 checklist
- 移动端最后一轮打磨
- 端到端手动测试脚本
- 部署上线

## 成本

**完全免费跑起来。**

- 智谱 GLM-4-Flash：**$0**（每月 2000 万 tokens 免费额度，MVP 用不完）
- SVG 氛围图：**$0**（本地生成，零依赖）
- Supabase：**$0**（Free 版）

**国内直连**，无需科学上网，无需信用卡。
