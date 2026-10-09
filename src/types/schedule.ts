export type DayOfWeek = 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN';

export interface DayInfo {
  id: DayOfWeek;
  name: string;
  fullName: string;
  shortName: string;
  dayIndex: number; // 1 for T2, 7 for CN
}

export interface SubjectColor {
  id: string; // key: student_subject
  student: string;
  subject: string;
  grade: string;
  label: string;
  bgColor: string;     // Tailwind bg class, e.g. 'bg-indigo-50'
  borderColor: string; // Tailwind border, e.g. 'border-indigo-300'
  textColor: string;   // Tailwind text, e.g. 'text-indigo-950'
  badgeBg: string;     // Tailwind badge bg, e.g. 'bg-indigo-100'
  badgeText: string;   // Tailwind badge text, e.g. 'text-indigo-800'
  accentHex: string;   // Hex code for dot/accent
  hexBg: string;       // Hex for Excel background fill
  hexBorder: string;   // Hex for Excel border
  hexText: string;     // Hex for Excel font color
}

export interface ScheduleItem {
  id: string;
  day: DayOfWeek;
  startTime: string; // "06:45"
  endTime: string;   // "08:45"
  student: string;   // "Thuỷ Lâm"
  subject: string;   // "Toán"
  grade: string;     // "10"
  fullSubject: string; // "Toán 10"
  notes?: string;    // "Học bù", "Scratch 2", etc.
  hourlyRate?: number; // e.g., 150000 VND
  colorKey: string;   // key into color dictionary
  isTrial?: boolean;  // Lớp học thử / Demo miễn phí (0đ)
}

export interface StudentSummary {
  student: string;
  subjects: string[];
  totalSessions: number;
  totalHours: number;
  colorKey: string;
  hourlyRate: number;
  totalTuition: number;
  days: DayOfWeek[];
}

export type ViewMode = 'grid' | 'timeline' | 'table' | 'summary';
