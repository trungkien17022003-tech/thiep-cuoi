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

export function cleanGoogleDriveUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed.includes('drive.google.com') && !trimmed.includes('docs.google.com')) {
    return trimmed;
  }
  let fileId = '';
  // Match /file/d/{id}/...
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  } else {
    // Match id={id}
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    }
  }

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }
  return trimmed;
}

export function cleanGoogleDriveAudioUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  
  // If the URL is already an IndexedDB marker or soundhelix preset, return as-is
  if (trimmed === 'local:uploaded' || trimmed.startsWith('https://www.soundhelix.com')) {
    return trimmed;
  }

  let fileId = '';

  // Case 1: Check if it's already a relative proxy URL from a legacy database entry
  if (trimmed.includes('/api/proxy-audio')) {
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    }
  } else if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    // Case 2: Standard Google Drive sharing URL
    const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      fileId = fileDMatch[1];
    } else {
      const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      }
    }
  }

  if (fileId) {
    const isLocalOrPre = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('.run.app')
    );
    if (isLocalOrPre) {
      return `/api/proxy-audio?id=${fileId}`;
    } else {
      return `https://ais-pre-qobzc62527pna4ezkn6tr2-708016236775.asia-southeast1.run.app/api/proxy-audio?id=${fileId}`;
    }
  }

  // If it's some standard direct online MP3 link (not Google Drive), return it if it has an absolute protocol.
  // This filters out loose text inputs (like "Fix lỗi link...") so they don't resolve to broken relative URLs.
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  return '';
}


