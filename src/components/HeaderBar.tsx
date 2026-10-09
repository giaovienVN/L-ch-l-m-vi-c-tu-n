import React from 'react';
import { Download, FileSpreadsheet, Plus, Table, Calendar, BarChart3, Copy, Check, Printer, Clock } from 'lucide-react';
import { ViewMode } from '../types/schedule';

interface HeaderBarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onCopyTsv: () => void;
  onOpenAddModal: () => void;
  onOpenTodayModal?: () => void;
  todayClassesCount?: number;
  copied: boolean;
  totalClasses: number;
  totalHours: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentView,
  onViewChange,
  onExportExcel,
  onExportCsv,
  onCopyTsv,
  onOpenAddModal,
  onOpenTodayModal,
  todayClassesCount,
  copied,
  totalClasses,
  totalHours,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Title (Top Bar Contract: single text element) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              E
            </div>
            <div>
              <a href="#" className="text-lg font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors">
                EduSchedule Pro
              </a>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500">
                Thời Khóa Biểu Tuần Chuẩn Bảng Tính
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Views (Segmented Controls) */}
          <nav className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 shrink-0">
            <button
              onClick={() => onViewChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentView === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Lịch Tuần Lưới</span>
            </button>
            <button
              onClick={() => onViewChange('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentView === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Biểu Đồ Tuần</span>
            </button>
            <button
              onClick={() => onViewChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentView === 'table'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Bảng Chuẩn Excel</span>
            </button>
            <button
              onClick={() => onViewChange('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentView === 'summary'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Thống Kê Học Phí</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Today schedule button */}
            {onOpenTodayModal && (
              <button
                type="button"
                onClick={onOpenTodayModal}
                title="Xem thông báo lịch dạy hôm nay"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Lịch hôm nay</span>
                {todayClassesCount !== undefined && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {todayClassesCount}
                  </span>
                )}
              </button>
            )}

            {/* Quick Copy TSV for pasting into Google Sheets / Excel */}
            <button
              onClick={onCopyTsv}
              title="Sao chép toàn bộ bảng tính để dán trực tiếp vào Excel hoặc Google Sheets"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Đã chép TSV</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Chép Bảng Tính</span>
                </>
              )}
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              title="In lịch tuần hoặc Lưu thành file PDF"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xl:inline">In / PDF</span>
            </button>

            {/* Export CSV button */}
            <button
              onClick={onExportCsv}
              title="Tải tệp CSV (UTF-8 tiếng Việt chuẩn)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>

            {/* Export Excel (.xlsx) button - Primary highlight */}
            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
              title="Xuất file Excel (.xlsx) đa trang kèm định dạng màu sắc & công thức tính"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Xuất Excel (.xlsx)</span>
            </button>

            {/* Add class button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-200" />
              <span className="hidden sm:inline">Thêm Buổi Học</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
