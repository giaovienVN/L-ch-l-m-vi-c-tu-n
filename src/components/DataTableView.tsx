import React, { useState, useMemo } from 'react';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours, formatVND } from '../data/initialSchedule';
import { ScheduleItem } from '../types/schedule';
import { Search, ArrowUpDown, Edit2, Copy, Trash2, FileSpreadsheet, Download, Check, Plus } from 'lucide-react';

interface DataTableViewProps {
  items: ScheduleItem[];
  onEditItem: (item: ScheduleItem) => void;
  onDeleteItem: (item: ScheduleItem) => void;
  onDuplicateItem: (item: ScheduleItem) => void;
  onOpenAddModal: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onCopyTsv: () => void;
  copied: boolean;
}

export const DataTableView: React.FC<DataTableViewProps> = ({
  items,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onOpenAddModal,
  onExportExcel,
  onExportCsv,
  onCopyTsv,
  copied,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'day' | 'time' | 'student' | 'duration' | 'tuition'>('day');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Unique students list
  const uniqueStudents = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.student))).sort();
  }, [items]);

  // Filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (dayFilter !== 'all' && item.day !== dayFilter) return false;
      if (studentFilter !== 'all' && item.student !== studentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesStudent = item.student.toLowerCase().includes(q);
        const matchesSubject = item.fullSubject.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q) || false;
        if (!matchesStudent && !matchesSubject && !matchesNotes) return false;
      }
      return true;
    });
  }, [items, dayFilter, studentFilter, searchQuery]);

  // Sorting
  const sortedItems = useMemo(() => {
    const dayOrder: Record<string, number> = { T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6, CN: 7 };
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'day') {
        comparison = dayOrder[a.day] - dayOrder[b.day];
        if (comparison === 0) {
          comparison = a.startTime.localeCompare(b.startTime);
        }
      } else if (sortField === 'time') {
        comparison = a.startTime.localeCompare(b.startTime);
      } else if (sortField === 'student') {
        comparison = a.student.localeCompare(b.student, 'vi');
      } else if (sortField === 'duration') {
        const durA = calculateDurationHours(a.startTime, a.endTime);
        const durB = calculateDurationHours(b.startTime, b.endTime);
        comparison = durA - durB;
      } else if (sortField === 'tuition') {
        const tA = calculateDurationHours(a.startTime, a.endTime) * (a.hourlyRate || 220000);
        const tB = calculateDurationHours(b.startTime, b.endTime) * (b.hourlyRate || 220000);
        comparison = tA - tB;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [filteredItems, sortField, sortAsc]);

  const handleSort = (field: 'day' | 'time' | 'student' | 'duration' | 'tuition') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Totals
  const totalHours = useMemo(() => {
    return sortedItems.reduce(
      (sum, it) => sum + calculateDurationHours(it.startTime, it.endTime),
      0
    );
  }, [sortedItems]);

  const totalTuition = useMemo(() => {
    return sortedItems.reduce(
      (sum, it) =>
        sum + calculateDurationHours(it.startTime, it.endTime) * (it.hourlyRate || 220000),
      0
    );
  }, [sortedItems]);

  return (
    <div className="space-y-4">
      {/* Control bar: search, day filter, student filter, export buttons AND Add button */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left side: search & filter inputs */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative min-w-[180px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo học sinh, môn, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Filter by Day */}
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Tất cả các ngày</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>

          {/* Filter by Student */}
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Tất cả học sinh ({uniqueStudents.length})</option>
            {uniqueStudents.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {(searchQuery || dayFilter !== 'all' || studentFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDayFilter('all');
                setStudentFilter('all');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
            >
              Đặt lại
            </button>
          )}
        </div>

        {/* Right side: Add class & export buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Buổi Học</span>
          </button>
          <button
            type="button"
            onClick={onCopyTsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            title="Sao chép dạng bảng TSV để dán trực tiếp vào Excel / Google Sheets"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Dán Excel'}</span>
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>
        </div>

      </div>

      {/* Spreadsheet Master Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="py-3 px-3 text-center w-12 text-slate-300">STT</th>
                <th
                  onClick={() => handleSort('day')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Thứ / Ngày</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('time')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Bắt đầu</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Kết thúc</th>
                <th
                  onClick={() => handleSort('duration')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Thời lượng</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('student')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Tên học sinh</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Môn học</th>
                <th className="py-3 px-3 text-center">Lớp</th>
                <th className="py-3 px-3">Phân loại & Màu sắc</th>
                <th className="py-3 px-3">Ghi chú</th>
                <th className="py-3 px-3 text-right">Đơn giá/giờ</th>
                <th
                  onClick={() => handleSort('tuition')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Thành tiền</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 text-sm">
                    <div>Không tìm thấy buổi học nào phù hợp với bộ lọc.</div>
                    <button
                      type="button"
                      onClick={onOpenAddModal}
                      className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      + Thêm buổi học mới ngay
                    </button>
                  </td>
                </tr>
              ) : (
                sortedItems.map((item, index) => {
                  const duration = calculateDurationHours(item.startTime, item.endTime);
                  const dayInfo = DAYS_OF_WEEK.find((d) => d.id === item.day);
                  const color = SUBJECT_COLORS[item.colorKey] || {
                    bgColor: 'bg-white',
                    borderColor: 'border-slate-200',
                    textColor: 'text-slate-900',
                    badgeBg: 'bg-slate-100',
                    badgeText: 'text-slate-700',
                    accentHex: '#64748B',
                  };
                  const rate = item.hourlyRate || 220000;
                  const lineTotal = duration * rate;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color.accentHex }}
                          />
                          <span>{dayInfo?.fullName || item.day}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-700 font-medium">
                        {item.startTime}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-700 font-medium">
                        {item.endTime}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {duration.toFixed(1)}h
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {item.student}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {item.subject}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-semibold">
                          {item.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${color.bgColor} ${color.borderColor} ${color.textColor}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: color.accentHex }}
                          />
                          <span>{item.fullSubject}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[180px] truncate">
                        {item.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                        {formatVND(rate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatVND(lineTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            title="Chỉnh sửa buổi học"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateItem(item)}
                            title="Nhân bản buổi học"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item)}
                            title="Xoá buổi học"
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Sum Formulas */}
            <tfoot>
              <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={4} className="py-3 px-3 text-center uppercase tracking-wide text-xs">
                  Tổng cộng ({sortedItems.length} buổi học)
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-900 font-bold text-sm">
                  {totalHours.toFixed(1)}h
                </td>
                <td colSpan={6} className="py-3 px-3 text-slate-500 text-xs">
                  Trung bình: {(totalHours / (sortedItems.length || 1)).toFixed(2)}h / buổi
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-800 font-bold text-sm">
                  {formatVND(totalTuition)}
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={onOpenAddModal}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    + Thêm
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
