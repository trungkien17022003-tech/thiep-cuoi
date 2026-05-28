/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertSolar2Lunar } from 'vietnamese-lunar-calendar/build/solar-lunar/convert-lunar';
import { convertLunar2Solar } from 'vietnamese-lunar-calendar/build/solar-lunar/convert-solar';

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
}

export function solarToLunar(dd: number, mm: number, yy: number): LunarDate {
  // Always use UTC+7 timeZone for Vietnamese calendar
  const res = convertSolar2Lunar(dd, mm, yy, 7);
  return {
    day: res.date,
    month: res.month,
    year: res.year,
    leap: res.isLeap,
  };
}

export function lunarToSolarBF(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap: boolean
): Date | null {
  try {
    const leapVal = lunarLeap ? 1 : 0;
    const res = convertLunar2Solar(lunarDay, lunarMonth, lunarYear, leapVal, 7) as any;
    if (!res) return null;
    if (res instanceof Date) return res;
    if (Array.isArray(res) && res.length >= 3) {
      return new Date(res[0], res[1] - 1, res[2]);
    }
    return new Date(res);
  } catch (e) {
    console.error('lunarToSolarBF error:', e);
    return null;
  }
}

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export function canChiYear(y: number): string {
  return CAN[(y + 6) % 10] + ' ' + CHI[(y + 8) % 12];
}

export function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

export function formatSolarVN(d: Date): string {
  return `${THU[d.getDay()]}, ngày ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatLunarVN(L: LunarDate, timeOfDay?: string): string {
  const prefix = timeOfDay ? `(Tức ${timeOfDay} ngày ` : `(Tức ngày `;
  return prefix + L.day + ' tháng ' + L.month + (L.leap ? ' nhuận' : '') + ' năm ' + canChiYear(L.year) + ')';
}

// Helper to extract values from string "Thứ Bảy, ngày 06/06/2026"
export function parseSolarString(dateStr: string): { day: number; month: number; year: number } | null {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return {
    day: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    year: parseInt(match[3], 10),
  };
}

export function sortWeddingEvents<T extends { date: string; time: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const parseA = parseSolarString(a.date);
    const parseB = parseSolarString(b.date);

    let timeA = 0;
    let timeB = 0;

    if (parseA) {
      timeA = new Date(parseA.year, parseA.month - 1, parseA.day).getTime();
    }
    if (parseB) {
      timeB = new Date(parseB.year, parseB.month - 1, parseB.day).getTime();
    }

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // Fall back to comparing times HH:MM
    const [hA, mA] = (a.time || '00:00').split(':').map((s) => parseInt(s, 10) || 0);
    const [hB, mB] = (b.time || '00:00').split(':').map((s) => parseInt(s, 10) || 0);
    if (hA !== hB) return hA - hB;
    return mA - mB;
  });
}

