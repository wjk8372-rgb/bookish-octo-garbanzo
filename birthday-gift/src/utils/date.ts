import dayjs from 'dayjs'
import { ANNIVERSARY, BIRTHDAY, START_DATE } from '../data/moments'

// 到生日当天的认识天数（含首日，所以 +1）
// 例如 2025-11-21 到 2026-10-13 = 326 天，含首日为第 327 天
export function daysSinceStart(to: string = BIRTHDAY): number {
  return dayjs(to).diff(dayjs(START_DATE), 'day') + 1
}

// 距离一周年的天数
export function daysToAnniversary(from: string = BIRTHDAY): number {
  return dayjs(ANNIVERSARY).diff(dayjs(from), 'day')
}

export function formatDate(date: string): string {
  const d = dayjs(date)
  const hasTime = d.hour() !== 0 || d.minute() !== 0
  return hasTime ? d.format('YYYY.MM.DD HH:mm') : d.format('YYYY.MM.DD')
}

export const CONSTS = {
  START_DATE,
  BIRTHDAY,
  ANNIVERSARY,
}
