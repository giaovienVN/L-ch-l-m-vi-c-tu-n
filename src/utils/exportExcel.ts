import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours, getStandardHourlyRate } from '../data/initialSchedule';
import { ScheduleItem } from '../types/schedule';

export async function exportScheduleToExcel(items: ScheduleItem[], filename = 'EduSchedule_ThoiKhoaBieu_Tuan.xlsx') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduSchedule Pro';
  workbook.lastModifiedBy = 'EduSchedule Pro';
  workbook.created = new Date();
  workbook.modified = new Date();

  // -------------------------------------------------------------
  // SHEET 1: THỜI KHÓA BIỂU DẠNG LƯỚI TRỰC QUAN (Visual Weekly Grid)
  // -------------------------------------------------------------
  const gridSheet = workbook.addWorksheet('TKB_Tuan_Truc_Quan', {
    views: [{ showGridLines: true }],
  });

  // Title Row
  gridSheet.mergeCells('A1:G1');
  const titleCell = gridSheet.getCell('A1');
  titleCell.value = 'THỜI KHÓA BIỂU DẠY KÈM TUẦN (LỊCH TRỰC QUAN)';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Slate 800
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  gridSheet.getRow(1).height = 40;

  // Subtitle Row
  gridSheet.mergeCells('A2:G2');
  const subCell = gridSheet.getCell('A2');
  subCell.value = 'Phối màu thông minh theo [Học sinh + Môn học] · Nhận diện trực quan · Tự động tính thời lượng';
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  gridSheet.getRow(2).height = 24;

  // Column Headers: Thứ Hai -> Chủ Nhật
  const dayHeaders = DAYS_OF_WEEK.map((d) => d.fullName);
  gridSheet.getRow(3).values = dayHeaders;
  gridSheet.getRow(3).height = 30;

  // Style header row
  for (let col = 1; col <= 7; col++) {
    const cell = gridSheet.getCell(3, col);
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Slate 900
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  }

  // Populate Grid Columns
  // Group schedule items by day and sort by start time
  const dayItemsMap: Record<string, ScheduleItem[]> = {};
  DAYS_OF_WEEK.forEach((d) => {
    dayItemsMap[d.id] = items
      .filter((item) => item.day === d.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  const maxClassesInADay = Math.max(...DAYS_OF_WEEK.map((d) => dayItemsMap[d.id]?.length || 0), 1);

  // Each class takes 1 row in the grid table
  for (let slotIndex = 0; slotIndex < maxClassesInADay; slotIndex++) {
    const rowNumber = 4 + slotIndex;
    const row = gridSheet.getRow(rowNumber);
    row.height = 68;

    DAYS_OF_WEEK.forEach((d, colIndex) => {
      const colNumber = colIndex + 1;
      const cell = gridSheet.getCell(rowNumber, colNumber);
      const classItem = dayItemsMap[d.id]?.[slotIndex];

      if (classItem) {
        const duration = calculateDurationHours(classItem.startTime, classItem.endTime);
        const colorConfig = SUBJECT_COLORS[classItem.colorKey];
        const hexBg = colorConfig ? 'FF' + colorConfig.hexBg : 'FFF8FAFC';
        const hexText = colorConfig ? 'FF' + colorConfig.hexText : 'FF0F172A';
        const hexBorder = colorConfig ? 'FF' + colorConfig.hexBorder : 'FFCBD5E1';

        const noteText = classItem.notes ? ` (${classItem.notes})` : '';
        cell.value = `⏰ ${classItem.startTime} – ${classItem.endTime} (${duration}h)\n👤 ${classItem.student}\n📚 ${classItem.fullSubject}${noteText}`;
        cell.font = { name: 'Arial', size: 9.5, bold: false, color: { argb: hexText } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: hexBg },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: hexBorder } },
          bottom: { style: 'thin', color: { argb: hexBorder } },
          left: { style: 'medium', color: { argb: hexBorder } },
          right: { style: 'thin', color: { argb: hexBorder } },
        };
      } else {
        cell.value = '';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          right: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        };
      }
    });
  }

  // Set column widths for Grid
  for (let c = 1; c <= 7; c++) {
    gridSheet.getColumn(c).width = 28;
  }

  // Add Color Legend at bottom of Sheet 1
  const legendStartRow = 5 + maxClassesInADay;
  gridSheet.getCell(`A${legendStartRow}`).value = 'BẢNG CHÚ GIẢI PHỐI MÀU THÔNG MINH (COLOR LEGEND):';
  gridSheet.getCell(`A${legendStartRow}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  gridSheet.mergeCells(`A${legendStartRow}:G${legendStartRow}`);
  gridSheet.getRow(legendStartRow).height = 24;

  const colorKeys = Object.keys(SUBJECT_COLORS);
  colorKeys.forEach((key, index) => {
    const colorObj = SUBJECT_COLORS[key];
    const legendRow = legendStartRow + 1 + Math.floor(index / 3);
    const colStart = (index % 3) * 2 + 1;
    const colEnd = colStart + 1;

    gridSheet.mergeCells(legendRow, colStart, legendRow, colEnd);
    const legCell = gridSheet.getCell(legendRow, colStart);
    legCell.value = `■ ${colorObj.label}`;
    legCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF' + colorObj.hexText } };
    legCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + colorObj.hexBg },
    };
    legCell.alignment = { vertical: 'middle', horizontal: 'center' };
    legCell.border = {
      top: { style: 'thin', color: { argb: 'FF' + colorObj.hexBorder } },
      bottom: { style: 'thin', color: { argb: 'FF' + colorObj.hexBorder } },
      left: { style: 'thin', color: { argb: 'FF' + colorObj.hexBorder } },
      right: { style: 'thin', color: { argb: 'FF' + colorObj.hexBorder } },
    };
    gridSheet.getRow(legendRow).height = 22;
  });

  // -------------------------------------------------------------
  // SHEET 2: BẢNG DỮ LIỆU CHUẨN (Detailed Master Table)
  // -------------------------------------------------------------
  const tableSheet = workbook.addWorksheet('Danh_Sach_Chi_Tiet', {
    views: [{ showGridLines: true }],
  });

  // Header Title
  tableSheet.mergeCells('A1:K1');
  const tTitle = tableSheet.getCell('A1');
  tTitle.value = 'DANH SÁCH CHI TIẾT TẤT CẢ CÁC BUỔI DẠY KÈM TRONG TUẦN';
  tTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  tTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  tTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  tableSheet.getRow(1).height = 36;

  // Table Column Headers
  const tableHeaders = [
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
    'Đơn giá/giờ (₫)',
    'Thành tiền (₫)',
  ];

  tableSheet.getRow(3).values = tableHeaders;
  tableSheet.getRow(3).height = 28;

  for (let c = 1; c <= tableHeaders.length; c++) {
    const hCell = tableSheet.getCell(3, c);
    hCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    hCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' }, // Slate 700
    };
    hCell.alignment = { vertical: 'middle', horizontal: 'center' };
    hCell.border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF64748B' } },
      right: { style: 'thin', color: { argb: 'FF64748B' } },
    };
  }

  // Sort items day by day, then time
  const dayOrder: Record<string, number> = { T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6, CN: 7 };
  const sortedItems = [...items].sort((a, b) => {
    if (dayOrder[a.day] !== dayOrder[b.day]) {
      return dayOrder[a.day] - dayOrder[b.day];
    }
    return a.startTime.localeCompare(b.startTime);
  });

  // Populate rows
  sortedItems.forEach((item, index) => {
    const rowNum = 4 + index;
    const duration = calculateDurationHours(item.startTime, item.endTime);
    const dayInfo = DAYS_OF_WEEK.find((d) => d.id === item.day);
    const rate = item.hourlyRate || getStandardHourlyRate(item.student);
    const totalAmount = duration * rate;
    const colorObj = SUBJECT_COLORS[item.colorKey];

    const row = tableSheet.getRow(rowNum);
    row.values = [
      index + 1,
      dayInfo ? dayInfo.fullName : item.day,
      item.startTime,
      item.endTime,
      duration,
      item.student,
      item.subject,
      item.grade,
      item.fullSubject,
      item.notes || '—',
      rate,
      totalAmount,
    ];
    row.height = 24;

    const rowBg = colorObj ? 'FF' + colorObj.hexBg : (index % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF');

    for (let c = 1; c <= tableHeaders.length; c++) {
      const cell = tableSheet.getCell(rowNum, c);
      cell.font = { name: 'Arial', size: 9.5 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Alignment rules
      if (c === 1 || c === 3 || c === 4 || c === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c === 5 || c === 11 || c === 12) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Formatting
      if (c === 5) {
        cell.numFmt = '0.0 "giờ"';
      }
      if (c === 11 || c === 12) {
        cell.numFmt = '#,##0 "₫"';
      }
    }
  });

  // Summary Row at Bottom of Sheet 2
  const totalRowNum = 4 + sortedItems.length;
  const totalRow = tableSheet.getRow(totalRowNum);
  totalRow.height = 28;

  tableSheet.mergeCells(`A${totalRowNum}:D${totalRowNum}`);
  const summaryLabel = tableSheet.getCell(`A${totalRowNum}`);
  summaryLabel.value = `TỔNG CỘNG (${sortedItems.length} BUỔI HỌC)`;
  summaryLabel.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  summaryLabel.alignment = { vertical: 'middle', horizontal: 'center' };

  // Total Hours Formula
  const sumHoursCell = tableSheet.getCell(`E${totalRowNum}`);
  sumHoursCell.value = { formula: `SUM(E4:E${totalRowNum - 1})` };
  sumHoursCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  sumHoursCell.numFmt = '0.0 "giờ"';
  sumHoursCell.alignment = { vertical: 'middle', horizontal: 'right' };

  // Total Amount Formula
  const sumAmountCell = tableSheet.getCell(`L${totalRowNum}`);
  sumAmountCell.value = { formula: `SUM(L4:L${totalRowNum - 1})` };
  sumAmountCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF059669' } };
  sumAmountCell.numFmt = '#,##0 "₫"';
  sumAmountCell.alignment = { vertical: 'middle', horizontal: 'right' };

  // Style the whole summary row
  for (let c = 1; c <= tableHeaders.length; c++) {
    const cCell = tableSheet.getCell(totalRowNum, c);
    cCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    cCell.border = {
      top: { style: 'medium', color: { argb: 'FF475569' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  }

  // Set widths for Table Sheet
  const tableWidths = [6, 18, 14, 14, 16, 18, 14, 10, 18, 26, 16, 18];
  tableWidths.forEach((w, i) => {
    tableSheet.getColumn(i + 1).width = w;
  });

  // -------------------------------------------------------------
  // SHEET 3: BÁO CÁO THỐNG KÊ THEO HỌC SINH (Student Summary)
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Thong_Ke_Hoc_Sinh', {
    views: [{ showGridLines: true }],
  });

  summarySheet.mergeCells('A1:G1');
  const sTitle = summarySheet.getCell('A1');
  sTitle.value = 'BÁO CÁO THỐNG KÊ SỐ GIỜ & HỌC PHÍ THEO HỌC SINH / MÔN';
  sTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  sTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  sTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 36;

  const summaryHeaders = [
    'STT',
    'Tên học sinh',
    'Môn học & Khối lớp',
    'Số buổi/tuần',
    'Tổng thời lượng (giờ)',
    'Các ngày trong tuần',
    'Học phí ước tính/tuần (₫)',
  ];

  summarySheet.getRow(3).values = summaryHeaders;
  summarySheet.getRow(3).height = 28;

  for (let c = 1; c <= summaryHeaders.length; c++) {
    const sc = summarySheet.getCell(3, c);
    sc.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    sc.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF475569' },
    };
    sc.alignment = { vertical: 'middle', horizontal: 'center' };
    sc.border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
    };
  }

  // Aggregate by student and subject
  const studentMap: Record<string, {
    student: string;
    fullSubject: string;
    colorKey: string;
    sessions: number;
    hours: number;
    days: string[];
    tuition: number;
  }> = {};

  sortedItems.forEach((it) => {
    const key = `${it.student} - ${it.fullSubject}`;
    const dur = calculateDurationHours(it.startTime, it.endTime);
    const cost = dur * (it.hourlyRate || getStandardHourlyRate(it.student));

    if (!studentMap[key]) {
      studentMap[key] = {
        student: it.student,
        fullSubject: it.fullSubject,
        colorKey: it.colorKey,
        sessions: 0,
        hours: 0,
        days: [],
        tuition: 0,
      };
    }
    studentMap[key].sessions += 1;
    studentMap[key].hours += dur;
    if (!studentMap[key].days.includes(it.day)) {
      studentMap[key].days.push(it.day);
    }
    studentMap[key].tuition += cost;
  });

  const studentList = Object.values(studentMap).sort((a, b) => b.hours - a.hours);

  studentList.forEach((st, idx) => {
    const rNum = 4 + idx;
    const row = summarySheet.getRow(rNum);
    const colorObj = SUBJECT_COLORS[st.colorKey];
    row.values = [
      idx + 1,
      st.student,
      st.fullSubject,
      st.sessions,
      st.hours,
      st.days.join(', '),
      st.tuition,
    ];
    row.height = 24;

    const rowBg = colorObj ? 'FF' + colorObj.hexBg : 'FFFFFFFF';

    for (let c = 1; c <= summaryHeaders.length; c++) {
      const cell = summarySheet.getCell(rNum, c);
      cell.font = { name: 'Arial', size: 9.5 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (c === 1 || c === 4 || c === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c === 5 || c === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      if (c === 5) cell.numFmt = '0.0 "giờ"';
      if (c === 7) cell.numFmt = '#,##0 "₫"';
    }
  });

  const sumWidths = [6, 20, 24, 14, 20, 24, 24];
  sumWidths.forEach((w, i) => {
    summarySheet.getColumn(i + 1).width = w;
  });

  // Write workbook to buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename);
}
