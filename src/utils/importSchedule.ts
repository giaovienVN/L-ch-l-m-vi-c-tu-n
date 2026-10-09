import ExcelJS from 'exceljs';
import { DAYS_OF_WEEK, getStandardHourlyRate, SUBJECT_COLORS } from '../data/initialSchedule';
import { DayOfWeek, ScheduleItem } from '../types/schedule';

/**
 * Normalizes day string (e.g. "Thứ Hai (Thứ 2)", "Thứ 2", "T2", "Mon", "2") to DayOfWeek
 */
export function normalizeDay(dayStr: string): DayOfWeek | null {
  if (!dayStr) return null;
  const raw = dayStr.trim().toLowerCase();

  if (raw.includes('chủ nhật') || raw.includes('chu nhat') || raw === 'cn' || raw === 'sun' || raw === 'sunday' || raw === 'cn (chủ nhật)') {
    return 'CN';
  }
  if (raw.includes('thứ 2') || raw.includes('thu 2') || raw.includes('thứ hai') || raw.includes('thu hai') || raw === 't2' || raw === 'mon' || raw === 'monday' || raw === '2') {
    return 'T2';
  }
  if (raw.includes('thứ 3') || raw.includes('thu 3') || raw.includes('thứ ba') || raw.includes('thu ba') || raw === 't3' || raw === 'tue' || raw === 'tuesday' || raw === '3') {
    return 'T3';
  }
  if (raw.includes('thứ 4') || raw.includes('thu 4') || raw.includes('thứ tư') || raw.includes('thu tu') || raw === 't4' || raw === 'wed' || raw === 'wednesday' || raw === '4') {
    return 'T4';
  }
  if (raw.includes('thứ 5') || raw.includes('thu 5') || raw.includes('thứ năm') || raw.includes('thu nam') || raw === 't5' || raw === 'thu' || raw === 'thursday' || raw === '5') {
    return 'T5';
  }
  if (raw.includes('thứ 6') || raw.includes('thu 6') || raw.includes('thứ sáu') || raw.includes('thu sau') || raw === 't6' || raw === 'fri' || raw === 'friday' || raw === '6') {
    return 'T6';
  }
  if (raw.includes('thứ 7') || raw.includes('thu 7') || raw.includes('thứ bảy') || raw.includes('thu bay') || raw === 't7' || raw === 'sat' || raw === 'saturday' || raw === '7') {
    return 'T7';
  }

  // Check against DAYS_OF_WEEK IDs
  const match = DAYS_OF_WEEK.find(d => d.id.toLowerCase() === raw || d.name.toLowerCase() === raw || d.fullName.toLowerCase().includes(raw));
  return match ? match.id : null;
}

/**
 * Normalizes time string to "HH:mm"
 */
export function normalizeTime(timeStr: string): string {
  if (!timeStr) return '08:00';
  let t = timeStr.trim();
  // Handle formats like "6:45", "06:45", "6h45", "06h45", "6:45:00"
  t = t.replace(/h/i, ':').replace(/\s+/g, '');
  const parts = t.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  return timeStr;
}

/**
 * Finds or assigns a colorKey for a student + subject
 */
export function resolveColorKey(student: string, subject: string, isTrial?: boolean): string {
  if (isTrial) return 'trial_free';

  const s = student.trim().toLowerCase();
  const sub = subject.trim().toLowerCase();

  // Try to find matching existing key
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (color.student && color.student.toLowerCase() === s) {
      if (color.subject && color.subject.toLowerCase() === sub) {
        return key;
      }
    }
  }

  // Check known student keywords
  if (s.includes('thuỷ lâm') || s.includes('thuy lam')) {
    return sub.includes('hoá') || sub.includes('hoa') ? 'thuy_lam_hoa_10' : 'thuy_lam_toan_10';
  }
  if (s.includes('minh thiện') || s.includes('minh thien')) return 'minh_thien_toan_9';
  if (s.includes('khôi') || s.includes('khoi')) return 'khoi_scr_2';
  if (s.includes('noel')) return 'noel_toan_9';
  if (s.includes('hoàng lâm') || s.includes('hoang lam') || s === 'lâm' || s === 'lam') {
    return sub.includes('toán') || sub.includes('toan') ? 'lam_toan_11' : 'lam_hoa_11';
  }
  if (s.includes('thái sơn') || s.includes('thai son')) return 'thai_son_toan_tu_duy_6';
  if (s.includes('nhật anh') || s.includes('nhat anh')) return 'nhat_anh_hoa_12';
  if (s.includes('đình duy') || s.includes('dinh duy')) return 'dinh_duy_hoa_10';
  if (s.includes('đức kiên') || s.includes('duc kien')) return 'duc_kien_hoa_10';

  // Fallback to palette colors
  const paletteKeys = [
    'palette_cyan_teal', 'palette_emerald_fresh', 'palette_lime_green',
    'palette_amber_bright', 'palette_orange_sunset', 'palette_navy',
    'palette_lavender', 'palette_pink', 'palette_slate'
  ];
  const hash = Math.abs((s + sub).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  return paletteKeys[hash % paletteKeys.length];
}

/**
 * Checks if a class is a trial class
 */
export function detectIsTrial(notes: string, student: string, subject: string, rate: number): boolean {
  const n = (notes || '').toLowerCase();
  const st = (student || '').toLowerCase();
  const sub = (subject || '').toLowerCase();

  // Explicit keyword "học thử" (distinguishing from "thi thử")
  if (n.includes('học thử') || n.includes('hoc thu') || n.includes('trial')) return true;
  if (st.includes('học thử') || st.includes('hoc thu')) return true;
  if (sub.includes('học thử') || sub.includes('hoc thu')) return true;

  // Rate is 0 and note mentions trial / free
  if (rate === 0 && (n.includes('thử') || n.includes('miễn phí') || n.includes('free'))) return true;

  return false;
}

/**
 * RFC 4180 CSV & TSV Line Parser
 */
export function parseDelimitedText(text: string): string[][] {
  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  // Detect delimiter: comma, tab, or semicolon
  const firstLine = cleanText.split(/\r\n|\n|\r/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t') && (firstLine.match(/\t/g) || []).length >= (firstLine.match(/,/g) || []).length) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export interface ParseResult {
  items: ScheduleItem[];
  errors: string[];
  totalParsed: number;
}

/**
 * Parses CSV or TSV string into ScheduleItem[]
 */
export function parseCsvToSchedule(csvContent: string): ParseResult {
  const rows = parseDelimitedText(csvContent);
  if (rows.length < 2) {
    return {
      items: [],
      errors: ['Tệp rỗng hoặc không đủ dữ liệu (cần ít nhất dòng tiêu đề và 1 dòng dữ liệu).'],
      totalParsed: 0,
    };
  }

  // Header indexing
  const headerRow = rows[0].map(h => h.trim().toLowerCase());
  
  // Find column indices
  let colDay = -1;
  let colStart = -1;
  let colEnd = -1;
  let colStudent = -1;
  let colSubject = -1;
  let colGrade = -1;
  let colFullSubject = -1;
  let colNotes = -1;
  let colRate = -1;
  let colTrial = -1;

  headerRow.forEach((h, idx) => {
    if (h.includes('thứ') || h.includes('thu') || h.includes('day') || h.includes('ngày') || h.includes('ngay')) {
      if (colDay === -1) colDay = idx;
    } else if (h.includes('bắt đầu') || h.includes('bat dau') || h.includes('start') || h.includes('từ') || h.includes('tu')) {
      if (colStart === -1) colStart = idx;
    } else if (h.includes('kết thúc') || h.includes('ket thuc') || h.includes('end') || h.includes('đến') || h.includes('den')) {
      if (colEnd === -1) colEnd = idx;
    } else if (h.includes('học sinh') || h.includes('hoc sinh') || h.includes('student') || h.includes('tên') || h.includes('ten')) {
      if (colStudent === -1) colStudent = idx;
    } else if (h.includes('môn') || h.includes('mon') || h.includes('subject')) {
      if (h.includes('phân loại') || h.includes('phan loai') || h.includes('lớp') || h.includes('lop')) {
        colFullSubject = idx;
      } else {
        colSubject = idx;
      }
    } else if (h.includes('khối') || h.includes('khoi') || h.includes('lớp') || h.includes('lop') || h.includes('grade')) {
      if (colGrade === -1) colGrade = idx;
    } else if (h.includes('ghi chú') || h.includes('ghi chu') || h.includes('notes') || h.includes('note')) {
      if (colNotes === -1) colNotes = idx;
    } else if (h.includes('đơn giá') || h.includes('don gia') || h.includes('rate') || h.includes('học phí') || h.includes('hoc phi')) {
      if (colRate === -1) colRate = idx;
    } else if (h.includes('học thử') || h.includes('hoc thu') || h.includes('trial')) {
      if (colTrial === -1) colTrial = idx;
    }
  });

  // Fallbacks if standard EduSchedule export columns match by position:
  // 0: STT, 1: Thứ, 2: Giờ bắt đầu, 3: Giờ kết thúc, 4: Thời lượng, 5: Tên học sinh, 6: Môn, 7: Khối, 8: Phân loại, 9: Ghi chú, 10: Đơn giá, 11: Thành tiền
  if (colDay === -1 && rows[0].length >= 4) colDay = 1;
  if (colStart === -1 && rows[0].length >= 4) colStart = 2;
  if (colEnd === -1 && rows[0].length >= 4) colEnd = 3;
  if (colStudent === -1 && rows[0].length >= 6) colStudent = 5;
  if (colSubject === -1 && rows[0].length >= 7) colSubject = 6;
  if (colGrade === -1 && rows[0].length >= 8) colGrade = 7;
  if (colNotes === -1 && rows[0].length >= 10) colNotes = 9;
  if (colRate === -1 && rows[0].length >= 11) colRate = 10;

  const items: ScheduleItem[] = [];
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Skip summary / empty rows
    const firstCell = (row[0] || '').trim().toLowerCase();
    if (firstCell.includes('tổng') || firstCell.includes('tong') || firstCell.includes('total')) {
      continue;
    }
    if (row.every(c => !c.trim())) continue;

    const rawDay = colDay !== -1 ? row[colDay] : (row[1] || '');
    const day = normalizeDay(rawDay);
    if (!day) {
      errors.push(`Dòng ${r + 1}: Không nhận diện được thứ ("${rawDay}")`);
      continue;
    }

    const rawStart = colStart !== -1 ? row[colStart] : (row[2] || '');
    const rawEnd = colEnd !== -1 ? row[colEnd] : (row[3] || '');
    const startTime = normalizeTime(rawStart);
    const endTime = normalizeTime(rawEnd);

    const student = (colStudent !== -1 ? row[colStudent] : (row[5] || 'Học sinh')).trim();
    const subject = (colSubject !== -1 ? row[colSubject] : (row[6] || 'Toán')).trim();
    const grade = (colGrade !== -1 ? row[colGrade] : (row[7] || '')).trim();
    let fullSubject = (colFullSubject !== -1 ? row[colFullSubject] : (row[8] || '')).trim();
    if (!fullSubject) {
      fullSubject = grade ? `${subject} ${grade}` : subject;
    }

    const notes = (colNotes !== -1 ? row[colNotes] : (row[9] || '')).trim();

    // Parse rate
    let hourlyRate = getStandardHourlyRate(student);
    if (colRate !== -1 && row[colRate]) {
      const parsedNum = parseFloat(row[colRate].replace(/[^\d.-]/g, ''));
      if (!isNaN(parsedNum)) {
        hourlyRate = parsedNum;
      }
    }

    // Trial check
    let isTrial = false;
    if (colTrial !== -1 && row[colTrial]) {
      const tVal = row[colTrial].toLowerCase();
      isTrial = tVal === 'true' || tVal === 'có' || tVal === '1' || tVal.includes('học thử');
    } else {
      isTrial = detectIsTrial(notes, student, subject, hourlyRate);
    }

    if (isTrial) {
      hourlyRate = 0;
    }

    const colorKey = resolveColorKey(student, subject, isTrial);

    items.push({
      id: `sch-import-${Date.now()}-${r}`,
      day,
      startTime,
      endTime,
      student,
      subject,
      grade,
      fullSubject,
      notes,
      hourlyRate,
      colorKey,
      isTrial,
    });
  }

  return {
    items,
    errors,
    totalParsed: items.length,
  };
}

/**
 * Parses Excel (.xlsx) file buffer using ExcelJS
 */
export async function parseExcelToSchedule(arrayBuffer: ArrayBuffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  // Find sheet: look for first sheet or sheet with "ThoiKhoaBieu" / "Lịch"
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return {
      items: [],
      errors: ['Không tìm thấy bảng tính nào trong file Excel.'],
      totalParsed: 0,
    };
  }

  // Convert worksheet to 2D string array
  const rows: string[][] = [];
  worksheet.eachRow((row) => {
    const rowValues: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      let val = '';
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === 'object') {
          // If rich text or formula result
          if ('result' in cell.value) {
            val = String(cell.value.result ?? '');
          } else if ('text' in cell.value) {
            val = String(cell.value.text ?? '');
          } else {
            val = String(cell.text || '');
          }
        } else {
          val = String(cell.value);
        }
      }
      rowValues.push(val);
    });
    if (rowValues.some(c => c.trim().length > 0)) {
      rows.push(rowValues);
    }
  });

  // Format as CSV text and parse
  const csvText = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  return parseCsvToSchedule(csvText);
}
