import type { Metadata } from 'next'
import { Noto_Serif_SC, Noto_Sans_SC, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const notoSerif = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-noto-serif',
  display: 'swap',
})

const notoSans = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-noto-sans',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '云游 · CloudRoam',
  description: '打开链接，跟着文字漫游世界的任何角落。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${notoSerif.variable} ${notoSans.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  )
}
