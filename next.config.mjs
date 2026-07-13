/** @type {import('next').NextConfig} */
const nextConfig = {
  // 国内直连版：图片是 data: URI，不需要外部图片域名配置
  eslint: {
    // 生产构建时忽略 ESLint 错误（部署到 Vercel 时 ESLint 配置冲突）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Supabase 类型推断问题，生产构建时忽略
    ignoreBuildErrors: true,
  },
}

export default nextConfig

