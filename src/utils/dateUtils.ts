import { DayOfWeek } from '../types/schedule';

/**
 * Returns the Monday of the week for a given date
 */
export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Formats a Date object to "DD/MM" (e.g. "05/10")
 */
export function formatDayMonth(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Formats a Date object to "DD/MM/YYYY" (e.g. "05/10/2026")
 */
export function formatFullDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Returns DayOfWeek ID for a given Date
 */
export function getDayOfWeekId(d: Date): DayOfWeek {
  const day = d.getDay();
  switch (day) {
    case 1: return 'T2';
    case 2: return 'T3';
    case 3: return 'T4';
    case 4: return 'T5';
    case 5: return 'T6';
    case 6: return 'T7';
    case 0: return 'CN';
    default: return 'T2';
  }
}

/**
 * Returns an array of 7 dates for the current week starting from Monday
 */
export function getWeekDates(referenceDate: Date = new Date()): { dayId: DayOfWeek; date: Date; dateStr: string; fullDateStr: string; isToday: boolean }[] {
  const monday = getMondayOfWeek(referenceDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayIds: DayOfWeek[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return dayIds.map((dayId, index) => {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + index);
    cur.setHours(0, 0, 0, 0);

    return {
      dayId,
      date: cur,
      dateStr: formatDayMonth(cur),
      fullDateStr: formatFullDate(cur),
      isToday: cur.getTime() === today.getTime(),
    };
  });
}

/**
 * Returns week range string, e.g. "05/10 – 11/10/2026"
 */
export function getWeekRangeString(referenceDate: Date = new Date()): string {
  const weekDates = getWeekDates(referenceDate);
  const start = weekDates[0];
  const end = weekDates[6];
  return `${start.dateStr} – ${end.fullDateStr}`;
}

/**
 * Returns a new date shifted by N weeks from referenceDate
 */
export function shiftWeeks(referenceDate: Date, weekOffset: number): Date {
  const result = new Date(referenceDate);
  result.setDate(result.getDate() + weekOffset * 7);
  return result;
}

/**
 * Checks if a referenceDate is in the actual current calendar week
 */
export function isCurrentCalendarWeek(referenceDate: Date): boolean {
  const monRef = getMondayOfWeek(referenceDate);
  const monNow = getMondayOfWeek(new Date());
  return monRef.getTime() === monNow.getTime();
}
