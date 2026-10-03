import React, { useState } from 'react';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours, formatVND } from '../data/initialSchedule';
import { DayOfWeek, ScheduleItem } from '../types/schedule';
import { Clock, User, BookOpen, AlertCircle, Edit2, Copy, Trash2, Plus } from 'lucide-react';

interface WeeklyGridViewProps {
  items: ScheduleItem[];
  selectedColorKey: string | null;
  onEditItem: (item: ScheduleItem) => void;
  onDeleteItem: (item: ScheduleItem) => void;
  onDuplicateItem: (item: ScheduleItem) => void;
  onAddNewToDay: (day: DayOfWeek) => void;
  onSwitchToTimeline?: () => void;
}

export const WeeklyGridView: React.FC<WeeklyGridViewProps> = ({
  items,
  selectedColorKey,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onAddNewToDay,
  onSwitchToTimeline,
}) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedColorKey && item.colorKey !== selectedColorKey) return false;

    if (timeFilter === 'all') return true;
    const hour = parseInt(item.startTime.split(':')[0], 10);
    if (timeFilter === 'morning') return hour < 12;
    if (timeFilter === 'afternoon') return hour >= 12 && hour < 18;
    if (timeFilter === 'evening') return hour >= 18;
    return true;
  });

  // Calculate day metrics
  const dayStats = DAYS_OF_WEEK.map((day) => {
    const dayClasses = filteredItems
      .filter((it) => it.day === day.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const totalHours = dayClasses.reduce(
      (sum, it) => sum + calculateDurationHours(it.startTime, it.endTime),
      0
    );

    // Overlap checks
    const conflicts: string[] = [];
    for (let i = 0; i < dayClasses.length; i++) {
      for (let j = i + 1; j < dayClasses.length; j++) {
        const a = dayClasses[i];
        const b = dayClasses[j];
        if (a.startTime < b.endTime && b.startTime < a.endTime) {
          conflicts.push(`${a.student} (${a.startTime}) trùng giờ với ${b.student} (${b.startTime})`);
        }
      }
    }

    return {
      day,
      classes: dayClasses,
      totalHours,
      conflicts,
    };
  });

  return (
    <div className="space-y-4">
      {/* Sub-toolbar: Quick Filter by Time of Day & Metric Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Lọc theo buổi:</span>
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-slate-600 font-medium">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Cả ngày
            </button>
            <button
              onClick={() => setTimeFilter('morning')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeFilter === 'morning' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Sáng (&lt;12h)
            </button>
            <button
              onClick={() => setTimeFilter('afternoon')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeFilter === 'afternoon' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Chiều (12h-18h)
            </button>
            <button
              onClick={() => setTimeFilter('evening')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeFilter === 'evening' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Tối (&gt;18h)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          {onSwitchToTimeline && (
            <button
              type="button"
              onClick={onSwitchToTimeline}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Xem dạng Biểu Đồ Tuần →</span>
            </button>
          )}
          <span>
            Đang hiển thị:{' '}
            <strong className="text-slate-900 font-mono tabular-nums">{filteredItems.length}</strong> buổi học
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Tổng thời lượng:{' '}
            <strong className="text-slate-900 font-mono tabular-nums">
              {filteredItems
                .reduce((acc, it) => acc + calculateDurationHours(it.startTime, it.endTime), 0)
                .toFixed(1)}
              h
            </strong>
          </span>
        </div>
      </div>

      {/* Weekly Grid (7 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 items-start">
        {dayStats.map(({ day, classes, totalHours, conflicts }) => {
          const isWeekend = day.id === 'T7' || day.id === 'CN';

          return (
            <div
              key={day.id}
              className={`flex flex-col rounded-xl border bg-white shadow-xs overflow-hidden transition-all ${
                isWeekend ? 'border-amber-200/80 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 border-b flex items-center justify-between ${
                  isWeekend
                    ? 'bg-amber-100/60 border-amber-200 text-amber-950'
                    : 'bg-slate-100/80 border-slate-200 text-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">{day.name}</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-sm bg-white/70 text-slate-700 border border-slate-200/60 font-semibold">
                      {day.shortName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <span className="font-mono tabular-nums font-semibold text-slate-700">
                      {classes.length} ca
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-700">
                      {totalHours.toFixed(1)}h
                    </span>
                  </div>
                </div>

                {/* Quick Add for this day in header */}
                <button
                  type="button"
                  onClick={() => onAddNewToDay(day.id)}
                  title={`Thêm buổi dạy vào ${day.name}`}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-2xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Conflict Alert (if any) */}
              {conflicts.length > 0 && (
                <div className="p-2 bg-rose-50 border-b border-rose-200 text-[11px] text-rose-800 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Cảnh báo trùng giờ:</span>
                    {conflicts.map((c, idx) => (
                      <div key={idx} className="text-rose-700">{c}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Classes in Day */}
              <div className="p-2.5 space-y-2.5 min-h-[380px] flex flex-col justify-between">
                <div className="space-y-2.5">
                  {classes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-lg text-slate-400">
                      <Clock className="w-6 h-6 stroke-1 mb-1 text-slate-300" />
                      <span className="text-xs">Chưa có lịch dạy</span>
                    </div>
                  ) : (
                    classes.map((item) => {
                      const duration = calculateDurationHours(item.startTime, item.endTime);
                      const color = SUBJECT_COLORS[item.colorKey] || {
                        bgColor: 'bg-slate-50',
                        borderColor: 'border-slate-200',
                        textColor: 'text-slate-900',
                        badgeBg: 'bg-slate-200',
                        badgeText: 'text-slate-800',
                        accentHex: '#64748B',
                      };

                      const rate = item.hourlyRate || 220000;
                      const sessionTuition = duration * rate;

                      return (
                        <div
                          key={item.id}
                          className={`group relative rounded-xl border p-3 transition-all hover:shadow-md ${color.bgColor} ${color.borderColor} ${color.textColor}`}
                        >
                          {/* Time Row */}
                          <div className="flex items-center justify-between gap-1 text-[11px] font-mono tabular-nums mb-1.5 pb-1 border-b border-black/5">
                            <div className="flex items-center gap-1 font-bold">
                              <Clock className="w-3 h-3 opacity-70" />
                              <span>
                                {item.startTime} – {item.endTime}
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.2 rounded-sm text-[10px] font-extrabold ${color.badgeBg} ${color.badgeText}`}>
                              {duration}h
                            </span>
                          </div>

                          {/* Student Name */}
                          <div className="flex items-center gap-1.5 text-xs font-bold leading-tight">
                            <User className="w-3.5 h-3.5 opacity-80 shrink-0" />
                            <span className="truncate">{item.student}</span>
                          </div>

                          {/* Subject & Grade */}
                          <div className="mt-1 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 text-[11px]">
                              <BookOpen className="w-3 h-3 opacity-70 shrink-0" />
                              <span className="font-semibold">{item.fullSubject}</span>
                            </div>
                            {item.notes && (
                              <span
                                className="text-[10px] px-1 py-0.2 rounded-xs bg-white/70 border border-black/10 text-slate-700 truncate max-w-[80px]"
                                title={item.notes}
                              >
                                {item.notes}
                              </span>
                            )}
                          </div>

                          {/* Estimated fee footer */}
                          <div className="mt-2 pt-1 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{formatVND(rate)}/h</span>
                            <span className="font-bold text-slate-800">{formatVND(sessionTuition)}</span>
                          </div>

                          {/* Action buttons (Clean and easily clickable) */}
                          <div className="mt-2 pt-1.5 border-t border-black/5 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditItem(item)}
                              title="Chỉnh sửa buổi học"
                              className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-white/80 hover:bg-white hover:text-indigo-600 rounded-md border border-black/10 transition-colors flex items-center gap-1"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicateItem(item)}
                              title="Nhân bản buổi học"
                              className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-white/80 hover:bg-white hover:text-emerald-600 rounded-md border border-black/10 transition-colors flex items-center gap-1"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item)}
                              title="Xoá buổi học"
                              className="px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 bg-rose-50/80 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Xoá</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Button to add class at the bottom of column */}
                <button
                  type="button"
                  onClick={() => onAddNewToDay(day.id)}
                  className="w-full mt-2 py-2 px-3 border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm ca {day.shortName}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
