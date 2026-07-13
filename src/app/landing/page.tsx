import { redirect } from 'next/navigation'

/**
 * 先导页已合并到首页
 *
 * 访问 /landing 会自动重定向到 /
 * 首页现在包含完整的 Landing Overlay + 主页内容
 */
export default function LandingRedirect() {
  redirect('/')
}
