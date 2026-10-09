import React from 'react';
import { ScheduleItem } from '../types/schedule';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours, formatVND } from '../data/initialSchedule';
import { getDayOfWeekId, formatFullDate } from '../utils/dateUtils';
import { Calendar, Clock, User, BookOpen, Sparkles, CheckCircle2, X, Star } from 'lucide-react';

interface TodayScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ScheduleItem[];
  onSelectClass?: (item: ScheduleItem) => void;
}

export const TodayScheduleModal: React.FC<TodayScheduleModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectClass,
}) => {
  if (!isOpen) return null;

  const todayDate = new Date();
  const todayDayId = getDayOfWeekId(todayDate);
  const dayInfo = DAYS_OF_WEEK.find((d) => d.id === todayDayId);
  const formattedTodayDate = formatFullDate(todayDate);

  // Filter today's classes and sort by time
  const todayClasses = items
    .filter((item) => item.day === todayDayId)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalTodayHours = todayClasses.reduce(
    (sum, it) => sum + calculateDurationHours(it.startTime, it.endTime),
    0
  );

  const totalTodayTuition = todayClasses.reduce(
    (sum, it) => {
      if (it.isTrial) return sum;
      return sum + calculateDurationHours(it.startTime, it.endTime) * (it.hourlyRate || 0);
    },
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header with Greeting & Date */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thông Báo Lịch Dạy Hôm Nay</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {dayInfo?.name || 'Hôm nay'}, {formattedTodayDate}
          </h2>

          <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong>{todayClasses.length} ca dạy</strong>
            </span>
            <span>·</span>
            <span>
              Tổng thời lượng: <strong>{totalTodayHours.toFixed(1)}h</strong>
            </span>
            {totalTodayTuition > 0 && (
              <>
                <span>·</span>
                <span className="text-emerald-300 font-semibold">
                  {formatVND(totalTodayTuition)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Classes List */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {todayClasses.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6 stroke-1" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Hôm nay không có lịch dạy nào</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Bạn không có ca dạy kèm nào trong ngày {dayInfo?.name}. Chúc bạn một ngày nghỉ ngơi hoặc làm việc hiệu quả!
              </p>
            </div>
          ) : (
            todayClasses.map((item, idx) => {
              const duration = calculateDurationHours(item.startTime, item.endTime);
              const color = SUBJECT_COLORS[item.colorKey] || {
                bgColor: 'bg-indigo-50',
                borderColor: 'border-indigo-300',
                textColor: 'text-indigo-950',
                badgeBg: 'bg-indigo-100',
                badgeText: 'text-indigo-800',
                accentHex: '#6366F1',
              };

              const fee = item.isTrial ? 0 : duration * (item.hourlyRate || 0);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectClass) {
                      onSelectClass(item);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all ${color.bgColor} ${color.borderColor} ${color.textColor} cursor-pointer hover:shadow-md`}
                >
                  {/* Row 1: Time & Badge */}
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5 pb-1 border-b border-black/5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-3.5 h-3.5 opacity-75" />
                      <span>{item.startTime} – {item.endTime}</span>
                      <span className="font-normal opacity-80">({duration}h)</span>
                    </div>

                    {item.isTrial ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Học thử (0₫)</span>
                      </span>
                    ) : (
                      <span className="font-mono tabular-nums font-bold text-slate-800 text-[11px]">
                        {formatVND(fee)}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Student & Subject */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <User className="w-3.5 h-3.5 opacity-80" />
                      <span className="text-sm">{item.student}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-semibold">
                      <BookOpen className="w-3.5 h-3.5 opacity-75" />
                      <span>{item.fullSubject}</span>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="mt-2 pt-1 border-t border-black/5 text-[11px] text-slate-600 italic">
                      Ghi chú: {item.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {todayClasses.length > 0 ? 'Nhấn vào ca học để chỉnh sửa nhanh' : 'Có thể bấm xem lịch cả tuần'}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đã Hiểu, Vào Thời Khóa Biểu</span>
          </button>
        </div>

      </div>
    </div>
  );
};
