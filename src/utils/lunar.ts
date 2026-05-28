/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Vietnamese Lunar Calendar Conversion Algorithm
// Adapted from Ho Ngoc Duc's calculation engine (UTC+7 timezone)

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
}

const _lunarCache: Record<string, LunarDate> = {};

function _jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function _jdToDate(jd: number): [number, number, number] {
  let a = 0;
  let b = 0;
  let c = 0;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor(146097 * b / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return [day, month, year];
}

function _newMoonDay(k: number, timeZone: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr) - 0.0004 * Math.sin(3 * dr * Mpr);
  C1 += 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin((M + Mpr) * dr);
  C1 -= 0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
  C1 -= 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
  C1 += 0.0010 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((M + 2 * Mpr) * dr);
  let deltat = 0;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  return Math.floor(Jd1 + C1 - deltat + 0.5 + timeZone / 24);
}

function _sunLongitude(jdn: number, timeZone: number): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L -= 2 * Math.PI * Math.floor(L / (2 * Math.PI));
  return Math.floor(L / Math.PI * 6);
}

function _getLunarMonth11(yy: number, timeZone: number): number {
  let k = Math.floor((yy - 2000) * 12.3685 + 0.5);
  let nm = _newMoonDay(k, timeZone);
  let sunLon = _sunLongitude(nm, timeZone);
  if (sunLon >= 9) k--;
  nm = _newMoonDay(k, timeZone);
  sunLon = _sunLongitude(nm, timeZone);
  let monthStart = nm;
  while (sunLon !== 9) {
    k++;
    nm = _newMoonDay(k, timeZone);
    sunLon = _sunLongitude(nm, timeZone);
    monthStart = nm;
  }
  return monthStart;
}

function _leapMonthOffset(a11: number, timeZone: number): number {
  const k = Math.round((a11 - 2415021.076998695) / 29.530588853);
  let last = 0;
  let i = 1;
  let arc = _sunLongitude(_newMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = _sunLongitude(_newMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

// Convert Solar to Lunar (dd: day, mm: month, yy: year)
export function solarToLunar(dd: number, mm: number, yy: number): LunarDate {
  const key = `${dd}-${mm}-${yy}`;
  if (_lunarCache[key]) return _lunarCache[key];

  const timeZone = 7; // Vietnam Standard Time
  const dayNumber = _jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = _newMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = _newMoonDay(k, timeZone);
  }
  let a11 = _getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear = yy;

  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = _getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = _getLunarMonth11(yy + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.round((monthStart - a11) / 29.530588853);
  let lunarLeap = false;
  let lunarMonth = diff + 11;

  if (b11 - a11 > 365) {
    const leapMonthDiff = _leapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = true;
      }
    }
  }

  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear--;

  const result: LunarDate = { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
  _lunarCache[key] = result;
  return result;
}

// Robust scan search to convert Lunar back to Solar (brute-force scan ±100 days)
export function lunarToSolarBF(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap: boolean
): Date | null {
  // Approximate solar Date
  const approx = new Date(lunarYear, lunarMonth - 1, lunarDay);
  if (isNaN(approx.getTime())) return null;

  for (let delta = -100; delta <= 100; delta++) {
    const scanDate = new Date(approx.getTime() + delta * 24 * 60 * 60 * 1000);
    const L = solarToLunar(scanDate.getDate(), scanDate.getMonth() + 1, scanDate.getFullYear());
    if (
      L.day === lunarDay &&
      L.month === lunarMonth &&
      L.year === lunarYear &&
      L.leap === lunarLeap
    ) {
      return scanDate;
    }
  }
  return null;
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
