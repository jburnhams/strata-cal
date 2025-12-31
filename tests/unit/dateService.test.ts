
import { generateMonthGrid } from '@/src/services/dateService';
import { getHolidaysForYear } from '@/src/constants';

describe('dateService', () => {
  describe('generateMonthGrid', () => {
    it('should generate a correct grid for January 2024', () => {
      // Jan 2024 starts on Monday (index 0 in our adjusted grid if UK Monday start)
      // Standard JS Date getDay: Sun=0, Mon=1.
      // Adjusted: Mon=0, Sun=6.
      // Jan 1 2024 is Monday. So it should be at index 0 of the grid.

      const grid = generateMonthGrid(2024, 0); // January is 0

      expect(grid.length).toBe(42); // 6 rows * 7 columns
      expect(grid[0].date.getDate()).toBe(1);
      expect(grid[0].isCurrentMonth).toBe(true);

      // Last day of Jan 2024 is 31st (Wednesday)
      // Index of 31st should be 30.
      expect(grid[30].date.getDate()).toBe(31);
      expect(grid[30].isCurrentMonth).toBe(true);

      // Next element should be Feb 1
      expect(grid[31].date.getDate()).toBe(1);
      expect(grid[31].isCurrentMonth).toBe(false);
    });

    it('should correctly mark holidays', () => {
      const grid = generateMonthGrid(2024, 11); // December

      // Find Christmas
      const christmas = grid.find(d => d.date.getDate() === 25 && d.isCurrentMonth);
      expect(christmas).toBeDefined();
      expect(christmas?.holidays.some(h => h.name === 'Christmas Day')).toBe(true);
    });
  });
});

describe('constants', () => {
  describe('getHolidaysForYear', () => {
    it('should return holidays for the given year', () => {
      const holidays = getHolidaysForYear(2024);
      expect(holidays.some(h => h.name === "New Year's Day" && h.date === '2024-01-01')).toBe(true);
    });
  });
});
