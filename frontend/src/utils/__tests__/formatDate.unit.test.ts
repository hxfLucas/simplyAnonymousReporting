import { formatDate } from '../formatDate';

// Use noon UTC so most practical timezones (UTC-11 to UTC+13) yield the same calendar day
const noon = (y: number, m: number, d: number): string =>
  new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString();

describe('formatDate', () => {
  describe('returns empty string for falsy inputs', () => {
    it('returns "" for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('returns "" for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('returns "" for empty string', () => {
      expect(formatDate('')).toBe('');
    });
  });

  it('returns "" for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  describe('ordinal suffixes — 1st / 2nd / 3rd / 4th', () => {
    it('formats day 1 with ordinal "1st"', () => {
      expect(formatDate(noon(2024, 3, 1))).toContain('1st');
    });

    it('formats day 2 with ordinal "2nd"', () => {
      expect(formatDate(noon(2024, 3, 2))).toContain('2nd');
    });

    it('formats day 3 with ordinal "3rd"', () => {
      expect(formatDate(noon(2024, 3, 3))).toContain('3rd');
    });

    it('formats day 4 with ordinal "4th"', () => {
      expect(formatDate(noon(2024, 3, 4))).toContain('4th');
    });
  });

  describe('teens exception — 11th, 12th, 13th always use "th"', () => {
    it('formats 11 as "11th" (not "11st")', () => {
      expect(formatDate(noon(2024, 3, 11))).toContain('11th');
    });

    it('formats 12 as "12th" (not "12nd")', () => {
      expect(formatDate(noon(2024, 3, 12))).toContain('12th');
    });

    it('formats 13 as "13th" (not "13rd")', () => {
      expect(formatDate(noon(2024, 3, 13))).toContain('13th');
    });
  });

  describe('ordinals resume correctly after teens', () => {
    it('formats 21 as "21st"', () => {
      expect(formatDate(noon(2024, 3, 21))).toContain('21st');
    });

    it('formats 22 as "22nd"', () => {
      expect(formatDate(noon(2024, 3, 22))).toContain('22nd');
    });

    it('formats 23 as "23rd"', () => {
      expect(formatDate(noon(2024, 3, 23))).toContain('23rd');
    });
  });

  it('includes the full month name in the output', () => {
    // March 2024 — month name varies by locale but must be present
    const result = formatDate(noon(2024, 3, 15));
    expect(result).toMatch(/march/i);
  });

  it('includes the year in the output', () => {
    const result = formatDate(noon(2024, 3, 15));
    expect(result).toContain('2024');
  });

  it('accepts a Date object as input', () => {
    const date = new Date(Date.UTC(2024, 2, 15, 12, 0, 0)); // March 15 2024
    const result = formatDate(date);
    expect(result).toContain('15th');
    expect(result).toContain('2024');
  });

  it('accepts a number (timestamp) as input', () => {
    const ts = Date.UTC(2024, 2, 5, 12, 0, 0); // March 5 2024
    const result = formatDate(ts);
    expect(result).toContain('5th');
    expect(result).toContain('2024');
  });
});
