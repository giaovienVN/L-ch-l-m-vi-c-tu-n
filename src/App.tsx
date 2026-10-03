import React, { useState, useEffect } from 'react';
import { INITIAL_SCHEDULE_ITEMS, calculateDurationHours, getStandardHourlyRate } from './data/initialSchedule';
import { DayOfWeek, ScheduleItem, ViewMode } from './types/schedule';
import { exportScheduleToExcel } from './utils/exportExcel';
import { exportScheduleToCsv, copyScheduleToClipboardTsv } from './utils/exportCsv';
import { HeaderBar } from './components/HeaderBar';
import { LegendBar } from './components/LegendBar';
import { WeeklyGridView } from './components/WeeklyGridView';
import { WeeklyTimelineChart } from './components/WeeklyTimelineChart';
import { DataTableView } from './components/DataTableView';
import { SummaryStats } from './components/SummaryStats';
import { ClassModal } from './components/ClassModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import {
  RotateCcw,
  CheckCircle2,
  Undo2,
  Plus,
} from 'lucide-react';

const STORAGE_KEY = 'eduschedule_items_v2';

export default function App() {
  const [items, setItems] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem('eduschedule_items_v2') || localStorage.getItem('eduschedule_items_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: ScheduleItem) => {
            const studentName = (item.student === 'Lâm' || item.student === 'Hoàng Lâm') ? 'Hoàng Lâm' : item.student;
            return {
              ...item,
              student: studentName,
              hourlyRate: getStandardHourlyRate(studentName),
            };
          });
        }
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_SCHEDULE_ITEMS;
  });

  const [currentView, setCurrentView] = useState<ViewMode>('grid');
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [defaultDayForAdd, setDefaultDayForAdd] = useState<DayOfWeek>('T2');
  const [defaultStartTimeForAdd, setDefaultStartTimeForAdd] = useState<string | undefined>(undefined);
  
  // Delete confirm modal state (replaces window.confirm)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ScheduleItem | null>(null);
  
  // Reset confirm modal state (replaces window.confirm)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Undo delete support
  const [lastDeletedItem, setLastDeletedItem] = useState<ScheduleItem | null>(null);

  // Feedback states
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist changes to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Open add modal with optional day & default time
  const handleOpenAddModal = (day: DayOfWeek = 'T2', defaultTime?: string) => {
    setDefaultDayForAdd(day);
    setDefaultStartTimeForAdd(defaultTime);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Request Delete -> Opens in-app modal (never uses window.confirm)
  const handleRequestDelete = (item: ScheduleItem) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    const itemToRemove = deletingItem;
    setItems((prev) => prev.filter((i) => i.id !== itemToRemove.id));
    setLastDeletedItem(itemToRemove);
    setIsDeleteModalOpen(false);
    setDeletingItem(null);
    showToast(`Đã xoá buổi học của ${itemToRemove.student} (${itemToRemove.day} ${itemToRemove.startTime})`);
  };

  // Undo Delete
  const handleUndoDelete = () => {
    if (!lastDeletedItem) return;
    setItems((prev) => [...prev, lastDeletedItem]);
    showToast(`Đã khôi phục buổi học của ${lastDeletedItem.student}`);
    setLastDeletedItem(null);
  };

  // Duplicate an item
  const handleDuplicateItem = (item: ScheduleItem) => {
    const duplicated: ScheduleItem = {
      ...item,
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      notes: item.notes ? `${item.notes} (bản sao)` : '(bản sao)',
    };
    setItems((prev) => [...prev, duplicated]);
    // Clear filter so user immediately sees the duplicated item
    setSelectedColorKey(null);
    showToast(`Đã nhân bản ca dạy của ${item.student}`);
  };

  // Save item from modal (Add or Edit)
  const handleSaveModalItem = (item: ScheduleItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [...prev, item];
    });

    // Reset color filter so the new item is NEVER hidden by an active filter
    setSelectedColorKey(null);
    showToast(editingItem ? 'Đã lưu thay đổi buổi học' : `Đã thêm ca dạy mới cho ${item.student} (${item.day})`);
  };

  // Reset to default 21 items
  const handleConfirmReset = () => {
    setItems(INITIAL_SCHEDULE_ITEMS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsResetModalOpen(false);
    setSelectedColorKey(null);
    showToast('Đã khôi phục thời khóa biểu gốc 21 ca học mẫu');
  };

  // Export handlers
  const handleExportExcel = async () => {
    try {
      await exportScheduleToExcel(items, `EduSchedule_ThoiKhoaBieu_Tuan_${Date.now()}.xlsx`);
      showToast('Đã tạo và tải xuống file Excel (.xlsx) thành công!');
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      showToast('Có lỗi xảy ra khi tạo file Excel. Hãy thử xuất CSV.');
    }
  };

  const handleExportCsv = () => {
    exportScheduleToCsv(items, `EduSchedule_ThoiKhoaBieu_${Date.now()}.csv`);
    showToast('Đã tải xuống file CSV (UTF-8 tiếng Việt chuẩn)');
  };

  const handleCopyTsv = () => {
    const success = copyScheduleToClipboardTsv(items);
    if (success) {
      setCopied(true);
      showToast('Đã sao chép bảng tính! Mở Excel hoặc Google Sheets và nhấn Ctrl+V.');
      setTimeout(() => setCopied(false), 3000);
    } else {
      showToast('Không thể sao chép tự động. Hãy dùng nút Xuất CSV hoặc Excel.');
    }
  };

  const handleUpdateRate = (student: string, subjectName: string, newRate: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.student === student && it.fullSubject === subjectName) {
          return { ...it, hourlyRate: newRate };
        }
        return it;
      })
    );
    showToast(`Đã cập nhật đơn giá cho ${student} - ${subjectName}: ${newRate.toLocaleString('vi-VN')}₫/h`);
  };

  const totalHours = items.reduce(
    (sum, it) => sum + calculateDurationHours(it.startTime, it.endTime),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      
      {/* 1. Header Navigation Bar */}
      <HeaderBar
        currentView={currentView}
        onViewChange={setCurrentView}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        onCopyTsv={handleCopyTsv}
        onOpenAddModal={() => handleOpenAddModal('T2')}
        copied={copied}
        totalClasses={items.length}
        totalHours={totalHours}
      />

      {/* 2. Smart Color Coding Legend Bar */}
      <LegendBar
        items={items}
        selectedColorKey={selectedColorKey}
        onSelectColorKey={setSelectedColorKey}
      />

      {/* 3. Hero Section / Breadcrumb & Quick Action Controls */}
      <section className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Quản lý gia sư & dạy kèm</span>
              <span aria-hidden="true">·</span>
              <span>Thời khóa biểu tuần</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">Hỗ trợ xuất Excel (.xlsx) & CSV</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Lịch Dạy Kèm Tuần & Bảng Phân Bổ Ca Học
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Thời khóa biểu chuyên nghiệp 7 ngày trong tuần (Thứ 2 – Chủ Nhật), tự động phối màu theo cặp [Học sinh + Môn], tính thời lượng chính xác và xuất file Excel nhiều trang.
            </p>
          </div>

          {/* Quick Stat Pill, Add Class Button & Reset Option */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-3 bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">TỔNG CA:</span>
                <span className="font-bold text-slate-900">{items.length} buổi</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">TỔNG GIỜ:</span>
                <span className="font-bold text-slate-900">{totalHours.toFixed(1)}h</span>
              </div>
            </div>

            {/* Prominent Add Button in Hero */}
            <button
              type="button"
              onClick={() => handleOpenAddModal('T2')}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-200" />
              <span>Thêm Buổi Học</span>
            </button>

            {/* Reset to template button */}
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              title="Khôi phục về 21 ca học gốc trong đề bài"
              className="px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Khôi phục mẫu</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'grid' && (
          <WeeklyGridView
            items={items}
            selectedColorKey={selectedColorKey}
            onEditItem={handleEditItem}
            onDeleteItem={handleRequestDelete}
            onDuplicateItem={handleDuplicateItem}
            onAddNewToDay={handleOpenAddModal}
            onSwitchToTimeline={() => setCurrentView('timeline')}
          />
        )}

        {currentView === 'timeline' && (
          <WeeklyTimelineChart
            items={items}
            selectedColorKey={selectedColorKey}
            onEditItem={handleEditItem}
            onDeleteItem={handleRequestDelete}
            onDuplicateItem={handleDuplicateItem}
            onAddNewToDay={handleOpenAddModal}
          />
        )}

        {currentView === 'table' && (
          <DataTableView
            items={items}
            onEditItem={handleEditItem}
            onDeleteItem={handleRequestDelete}
            onDuplicateItem={handleDuplicateItem}
            onOpenAddModal={() => handleOpenAddModal('T2')}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
            onCopyTsv={handleCopyTsv}
            copied={copied}
          />
        )}

        {currentView === 'summary' && (
          <SummaryStats items={items} onUpdateRate={handleUpdateRate} />
        )}
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">EduSchedule Pro</span>
            <span>·</span>
            <span>Hệ thống bảng tính & quản lý thời khóa biểu tuần chuẩn Excel</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Định dạng hỗ trợ: Microsoft Excel (.xlsx), CSV (UTF-8), TSV Clipboard</span>
          </div>
        </div>
      </footer>

      {/* 6. Add/Edit Class Modal Dialog */}
      <ClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModalItem}
        initialItem={editingItem}
        defaultDay={defaultDayForAdd}
        defaultStartTime={defaultStartTimeForAdd}
        allItems={items}
      />

      {/* 7. Delete Confirmation Modal (In-app, avoids window.confirm blocking in iframe) */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        item={deletingItem}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* 8. Reset Data Confirmation Modal (In-app, avoids window.confirm blocking in iframe) */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />

      {/* 9. Toast Notification with Undo Support */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          {lastDeletedItem && (
            <button
              type="button"
              onClick={handleUndoDelete}
              className="ml-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-md font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              <span>Hoàn tác</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
}
