import { saveAs } from 'file-saver';
import { DAYS_OF_WEEK, calculateDurationHours, getStandardHourlyRate } from '../data/initialSchedule';
import { ScheduleItem } from '../types/schedule';

export function exportScheduleToCsv(items: ScheduleItem[], filename = 'EduSchedule_ThoiKhoaBieu.csv') {
  const dayOrder: Record<string, number> = { T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6, CN: 7 };
  const sortedItems = [...items].sort((a, b) => {
    if (dayOrder[a.day] !== dayOrder[b.day]) {
      return dayOrder[a.day] - dayOrder[b.day];
    }
    return a.startTime.localeCompare(b.startTime);
  });

  const headers = [
    'STT',
    'Thứ trong tuần',
    'Giờ bắt đầu',
    'Giờ kết thúc',
    'Thời lượng (giờ)',
    'Tên học sinh',
    'Môn học',
    'Khối lớp',
    'Phân loại môn/lớp',
    'Ghi chú',
    'Đơn giá/giờ (VNĐ)',
    'Thành tiền (VNĐ)',
  ];

  const rows = sortedItems.map((item, index) => {
    const dayInfo = DAYS_OF_WEEK.find((d) => d.id === item.day);
    const duration = calculateDurationHours(item.startTime, item.endTime);
    const rate = item.isTrial ? 0 : (item.hourlyRate !== undefined ? item.hourlyRate : getStandardHourlyRate(item.student));
    const total = item.isTrial ? 0 : duration * rate;
    const noteText = item.isTrial ? (item.notes ? `${item.notes} (Học thử 0₫)` : 'Học thử (0₫)') : (item.notes || '');

    return [
      index + 1,
      `"${dayInfo ? dayInfo.fullName : item.day}"`,
      `"${item.startTime}"`,
      `"${item.endTime}"`,
      duration,
      `"${item.student}"`,
      `"${item.subject}"`,
      `"${item.grade}"`,
      `"${item.fullSubject}"`,
      `"${noteText}"`,
      rate,
      total,
    ].join(',');
  });

  // Calculate totals
  const totalHours = sortedItems.reduce(
    (sum, item) => sum + calculateDurationHours(item.startTime, item.endTime),
    0
  );
  const totalTuition = sortedItems.reduce(
    (sum, item) => {
      if (item.isTrial) return sum;
      return sum + calculateDurationHours(item.startTime, item.endTime) * (item.hourlyRate || getStandardHourlyRate(item.student));
    },
    0
  );

  const summaryRow = [
    'TỔNG CỘNG',
    `"${sortedItems.length} buổi"`,
    '""',
    '""',
    totalHours.toFixed(1),
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    totalTuition,
  ].join(',');

  // UTF-8 BOM \uFEFF ensures Vietnamese diacritics appear correctly in Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows, summaryRow].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

export function copyScheduleToClipboardTsv(items: ScheduleItem[]): boolean {
  const dayOrder: Record<string, number> = { T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6, CN: 7 };
  const sortedItems = [...items].sort((a, b) => {
    if (dayOrder[a.day] !== dayOrder[b.day]) {
      return dayOrder[a.day] - dayOrder[b.day];
    }
    return a.startTime.localeCompare(b.startTime);
  });

  const headers = [
    'STT',
    'Thứ trong tuần',
    'Giờ bắt đầu',
    'Giờ kết thúc',
    'Thời lượng (giờ)',
    'Tên học sinh',
    'Môn học',
    'Khối lớp',
    'Phân loại môn/lớp',
    'Ghi chú',
    'Đơn giá/giờ',
    'Thành tiền',
  ];

  const rows = sortedItems.map((item, index) => {
    const dayInfo = DAYS_OF_WEEK.find((d) => d.id === item.day);
    const duration = calculateDurationHours(item.startTime, item.endTime);
    const rate = item.isTrial ? 0 : (item.hourlyRate !== undefined ? item.hourlyRate : getStandardHourlyRate(item.student));
    const total = item.isTrial ? 0 : duration * rate;
    const noteText = item.isTrial ? (item.notes ? `${item.notes} (Học thử 0₫)` : 'Học thử (0₫)') : (item.notes || '');

    return [
      index + 1,
      dayInfo ? dayInfo.fullName : item.day,
      item.startTime,
      item.endTime,
      duration,
      item.student,
      item.subject,
      item.grade,
      item.fullSubject,
      noteText,
      rate,
      total,
    ].join('\t');
  });

  const tsvContent = [headers.join('\t'), ...rows].join('\n');

  try {
    navigator.clipboard.writeText(tsvContent);
    return true;
  } catch {
    return false;
  }
}
