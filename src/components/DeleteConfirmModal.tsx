import React from 'react';
import { ScheduleItem } from '../types/schedule';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours } from '../data/initialSchedule';
import { Trash2, AlertTriangle, X, Clock, Calendar, User, BookOpen } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: ScheduleItem | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) return null;

  const dayInfo = DAYS_OF_WEEK.find((d) => d.id === item.day);
  const duration = calculateDurationHours(item.startTime, item.endTime);
  const color = SUBJECT_COLORS[item.colorKey] || {
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-900',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    accentHex: '#64748B',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Xác Nhận Xoá Buổi Học</h3>
              <p className="text-[11px] text-slate-500">Hành động này sẽ xoá buổi dạy khỏi thời khóa biểu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body with item preview */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Bạn có chắc chắn muốn xoá buổi dạy kèm này khỏi lịch tuần không?
          </p>

          {/* Item details card */}
          <div className={`p-3.5 rounded-xl border ${color.bgColor} ${color.borderColor} ${color.textColor} space-y-2`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 opacity-75" />
                <span>{dayInfo?.fullName || item.day}</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 opacity-75" />
                <span>{item.startTime} – {item.endTime} ({duration}h)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-black/5 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <User className="w-3.5 h-3.5 opacity-75" />
                <span>{item.student}</span>
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <BookOpen className="w-3.5 h-3.5 opacity-75" />
                <span>{item.fullSubject}</span>
              </div>
            </div>

            {item.notes && (
              <div className="text-[11px] text-slate-500 italic">
                Ghi chú: {item.notes}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg text-[11px] text-amber-800 border border-amber-200/70">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Bạn vẫn có thể nhấn nút "Hoàn tác" ở góc màn hình ngay sau khi xoá nếu bấm nhầm.</span>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Huỷ Bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xác Nhận Xoá</span>
          </button>
        </div>

      </div>
    </div>
  );
};
