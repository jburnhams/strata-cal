import { FontStyle, TextPosition } from "./types";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DEFAULT_COLORS = [
  '#1e40af', // Jan - Blue
  '#be123c', // Feb - Pink/Red
  '#15803d', // Mar - Green
  '#a21caf', // Apr - Purple
  '#047857', // May - Emerald
  '#ca8a04', // Jun - Yellow/Gold
  '#c2410c', // Jul - Orange
  '#b91c1c', // Aug - Red
  '#854d0e', // Sep - Brown
  '#ea580c', // Oct - Orange
  '#374151', // Nov - Grey
  '#1d4ed8', // Dec - Blue
];

export const INITIAL_MONTHS_STATE = MONTH_NAMES.map((name, index) => ({
  monthIndex: index,
  name,
  // High quality random seed images
  image: `https://picsum.photos/seed/${name}2024/1600/1200`,
  accentColor: DEFAULT_COLORS[index],
  textPosition: TextPosition.BottomRight,
  // Cycle through font styles for variety (Only fancy ones)
  fontStyle: [FontStyle.Display, FontStyle.Serif, FontStyle.Handwriting][index % 3],
  isAnalyzing: false,
  isDefault: true,
}));

// UK Public Holidays & Major Christian Holidays Logic (Simplified for 2024-2026)
// In a production app, use a robust library like 'date-holidays'
export const getHolidaysForYear = (year: number) => {
  const holidays: { date: string; name: string; type: 'public' | 'christian' }[] = [
    { date: `${year}-01-01`, name: "New Year's Day", type: 'public' },
    { date: `${year}-12-25`, name: "Christmas Day", type: 'christian' },
    { date: `${year}-12-26`, name: "Boxing Day", type: 'public' },
    { date: `${year}-11-01`, name: "All Saints' Day", type: 'christian' },
    { date: `${year}-02-14`, name: "St Valentine's Day", type: 'christian' },
    { date: `${year}-03-17`, name: "St Patrick's Day", type: 'christian' },
  ];

  // Simple Easter Calculation (Meeus/Jones/Butcher's Algorithm)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  const easterDate = new Date(year, month - 1, day);
  
  // Helper to format
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  }

  const goodFriday = addDays(easterDate, -2);
  const easterMonday = addDays(easterDate, 1);
  const ashWednesday = addDays(easterDate, -46);
  const ascensionDay = addDays(easterDate, 39);
  const pentecost = addDays(easterDate, 49);

  holidays.push({ date: fmt(easterDate), name: "Easter Sunday", type: 'christian' });
  holidays.push({ date: fmt(goodFriday), name: "Good Friday", type: 'public' });
  holidays.push({ date: fmt(easterMonday), name: "Easter Monday", type: 'public' });
  holidays.push({ date: fmt(ashWednesday), name: "Ash Wednesday", type: 'christian' });
  holidays.push({ date: fmt(ascensionDay), name: "Ascension Day", type: 'christian' });
  holidays.push({ date: fmt(pentecost), name: "Pentecost", type: 'christian' });

  // Early May Bank Holiday (First Monday in May)
  let date = new Date(year, 4, 1);
  while (date.getDay() !== 1) date.setDate(date.getDate() + 1);
  holidays.push({ date: fmt(date), name: "Early May Bank Holiday", type: 'public' });

  // Spring Bank Holiday (Last Monday in May)
  date = new Date(year, 4, 31);
  while (date.getDay() !== 1) date.setDate(date.getDate() - 1);
  holidays.push({ date: fmt(date), name: "Spring Bank Holiday", type: 'public' });

  // Summer Bank Holiday (Last Monday in August)
  date = new Date(year, 7, 31);
  while (date.getDay() !== 1) date.setDate(date.getDate() - 1);
  holidays.push({ date: fmt(date), name: "Summer Bank Holiday", type: 'public' });

  return holidays;
}