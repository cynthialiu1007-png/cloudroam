import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生成 6 位随机 ID（用于房间/用户等临时标识的简短形式）
 */
export function randomShortId(): string {
  return Math.random().toString(36).slice(2, 8)
}
