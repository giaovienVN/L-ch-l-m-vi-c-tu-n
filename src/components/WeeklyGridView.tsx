import React, { useState } from 'react';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours, formatVND, getStandardHourlyRate } from '../data/initialSchedule';
import { DayOfWeek, ScheduleItem } from '../types/schedule';
import { getWeekDates, getWeekRangeString } from '../utils/dateUtils';
import { Clock, User, BookOpen, AlertCircle, Edit2, Copy, Trash2, Plus, Star, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface WeeklyGridViewProps {
  items: ScheduleItem[];
  selectedColorKey: string | null;
  referenceDate?: Date;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onCurrentWeek?: () => void;
  isCurrentWeek?: boolean;
  onEditItem: (item: ScheduleItem) => void;
  onDeleteItem: (item: ScheduleItem) => void;
  onDuplicateItem: (item: ScheduleItem) => void;
  onAddNewToDay: (day: DayOfWeek) => void;
  onSwitchToTimeline?: () => void;
}

export const WeeklyGridView: React.FC<WeeklyGridViewProps> = ({
  items,
  selectedColorKey,
  referenceDate = new Date(),
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  isCurrentWeek = true,
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

  const weekDates = getWeekDates(referenceDate);
  const weekRangeText = getWeekRangeString(referenceDate);

  // Calculate day metrics
  const dayStats = DAYS_OF_WEEK.map((day) => {
    const dateInfo = weekDates.find((w) => w.dayId === day.id);
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
      dateInfo,
      classes: dayClasses,
      totalHours,
      conflicts,
    };
  });

  return (
    <div className="space-y-4">

      {/* Week Navigation & Date Range Bar (Yêu cầu: Thêm ngày tháng tuần hiện tại bên cạnh thứ, tự động đổi khi qua tuần) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {onPrevWeek && (
              <button
                type="button"
                onClick={onPrevWeek}
                title="Xem tuần trước"
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {onCurrentWeek && (
              <button
                type="button"
                onClick={onCurrentWeek}
                className={`px-2.5 py-1 text-xs rounded-md transition-all font-semibold cursor-pointer ${
                  isCurrentWeek
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Tuần hiện tại
              </button>
            )}
            {onNextWeek && (
              <button
                type="button"
                onClick={onNextWeek}
                title="Xem tuần tiếp theo"
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-slate-900 font-mono">
              Tuần: {weekRangeText}
            </span>
            {isCurrentWeek ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Đang xem tuần này
              </span>
            ) : (
              <button
                type="button"
                onClick={onCurrentWeek}
                className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 hover:bg-amber-200 cursor-pointer transition-colors"
              >
                Quay lại tuần này
              </button>
            )}
          </div>
        </div>

        {/* View Switcher / Quick Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
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
          <span className="hidden md:inline">
            Tổng cộng: <strong className="text-slate-900 font-mono">{filteredItems.length} ca</strong> ({filteredItems.reduce((acc, it) => acc + calculateDurationHours(it.startTime, it.endTime), 0).toFixed(1)}h)
          </span>
        </div>
      </div>

      {/* Sub-toolbar: Quick Filter by Time of Day & Metric Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Lọc theo buổi:</span>
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-slate-600 font-medium">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                timeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Cả ngày
            </button>
            <button
              onClick={() => setTimeFilter('morning')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                timeFilter === 'morning' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Sáng (&lt;12h)
            </button>
            <button
              onClick={() => setTimeFilter('afternoon')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                timeFilter === 'afternoon' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Chiều (12h-18h)
            </button>
            <button
              onClick={() => setTimeFilter('evening')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                timeFilter === 'evening' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Tối (&gt;18h)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
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

      {/* Weekly Grid (7 Columns) with Day & Date clearly shown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 items-start">
        {dayStats.map(({ day, dateInfo, classes, totalHours, conflicts }) => {
          const isWeekend = day.id === 'T7' || day.id === 'CN';

          return (
            <div
              key={day.id}
              className={`flex flex-col rounded-xl border bg-white shadow-xs overflow-hidden transition-all ${
                dateInfo?.isToday
                  ? 'ring-2 ring-emerald-500 border-emerald-400'
                  : isWeekend
                  ? 'border-amber-200/80 bg-amber-50/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Day Header with Date beside Day */}
              <div
                className={`p-3 border-b flex items-center justify-between ${
                  dateInfo?.isToday
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : isWeekend
                    ? 'bg-amber-100/60 border-amber-200 text-amber-950'
                    : 'bg-slate-100/80 border-slate-200 text-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm">{day.name}</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-white/90 text-slate-800 border border-slate-300 font-bold shadow-2xs">
                      {dateInfo?.dateStr}
                    </span>
                    {dateInfo?.isToday && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs animate-pulse">
                        Hôm nay
                      </span>
                    )}
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
                  title={`Thêm buổi dạy vào ${day.name} (${dateInfo?.dateStr})`}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-2xs font-bold cursor-pointer"
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

                      const rate = item.hourlyRate || getStandardHourlyRate(item.student);
                      const sessionTuition = item.isTrial ? 0 : duration * rate;

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
                            <div className="flex items-center gap-1">
                              {item.isTrial && (
                                <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                  <span>Học thử</span>
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-extrabold ${color.badgeBg} ${color.badgeText}`}>
                                {duration}h
                              </span>
                            </div>
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
                            {item.isTrial ? (
                              <span className="text-amber-800 font-bold flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>Học thử miễn phí (0₫)</span>
                              </span>
                            ) : (
                              <>
                                <span>{formatVND(rate)}/h</span>
                                <span className="font-bold text-slate-800">{formatVND(sessionTuition)}</span>
                              </>
                            )}
                          </div>

                          {/* Action buttons (Clean and easily clickable) */}
                          <div className="mt-2 pt-1.5 border-t border-black/5 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditItem(item)}
                              title="Chỉnh sửa ca học này"
                              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-black/5 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicateItem(item)}
                              title="Nhân bản ca học này"
                              className="p-1 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-black/5 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item)}
                              title="Xoá ca học này"
                              className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Day Footer Add Action */}
                <button
                  type="button"
                  onClick={() => onAddNewToDay(day.id)}
                  className="w-full mt-2 py-1.5 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm ca {day.shortName}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
