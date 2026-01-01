import { DayCell, Holiday } from "../types";
import { getHolidaysForYear } from "../constants";

export const generateMonthGrid = (year: number, monthIndex: number): DayCell[] => {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // UK calendars typically start on Monday. 
  // Adjust so 0 (Sunday) becomes 6, and 1 (Monday) becomes 0.
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const grid: DayCell[] = [];
  const holidayData = getHolidaysForYear(year);

  // Previous Month Padding
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();
  for (let i = 0; i < adjustedStartDay; i++) {
    const day = prevMonthDays - adjustedStartDay + i + 1;
    const date = new Date(year, monthIndex - 1, day);
    grid.push({
      date,
      isCurrentMonth: false,
      holidays: getHolidaysForDate(date, holidayData),
    });
  }

  // Current Month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, monthIndex, i);
    grid.push({
      date,
      isCurrentMonth: true,
      holidays: getHolidaysForDate(date, holidayData),
    });
  }

  // Next Month Padding (to fill 6 rows of 7 = 42 cells)
  const remainingCells = 42 - grid.length;
  for (let i = 1; i <= remainingCells; i++) {
    const date = new Date(year, monthIndex + 1, i);
    grid.push({
      date,
      isCurrentMonth: false,
      holidays: getHolidaysForDate(date, holidayData),
    });
  }

  return grid;
};

const getHolidaysForDate = (date: Date, holidays: { date: string; name: string; type: 'public' | 'christian' }[]): Holiday[] => {
  if (isNaN(date.getTime())) return [];
  const dateString = date.toISOString().split('T')[0];
  return holidays
    .filter(h => h.date === dateString)
    .map(h => ({
      date,
      name: h.name,
      type: h.type
    }));
};
