import React, { useState } from 'react';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours, formatVND } from '../data/initialSchedule';
import { DayOfWeek, ScheduleItem } from '../types/schedule';
import { getWeekDates, getWeekRangeString } from '../utils/dateUtils';
import { Clock, User, BookOpen, Edit2, Copy, Trash2, Plus, Star, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface WeeklyTimelineChartProps {
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
  onAddNewToDay: (day: DayOfWeek, defaultTime?: string) => void;
}

const START_HOUR = 6;  // 06:00
const END_HOUR = 23;   // 23:00
const TOTAL_HOURS = END_HOUR - START_HOUR; // 17 hours

export const WeeklyTimelineChart: React.FC<WeeklyTimelineChartProps> = ({
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
}) => {
  // Density mode: 'compact' (38px/hr) or 'comfortable' (52px/hr)
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const hourHeight = density === 'compact' ? 38 : 52;
  const totalChartHeight = TOTAL_HOURS * hourHeight;

  // Filter items if color is selected
  const filteredItems = items.filter((item) => {
    if (selectedColorKey && item.colorKey !== selectedColorKey) return false;
    return true;
  });

  // Convert "HH:MM" to minutes from 06:00
  const getMinutesFromStart = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return Math.max(0, (h - START_HOUR) * 60 + m);
  };

  const hoursList = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
  const weekDates = getWeekDates(referenceDate);
  const weekRangeText = getWeekRangeString(referenceDate);

  return (
    <div className="space-y-3">

      {/* Week Navigation & Chart Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Week navigation */}
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

        {/* Density switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium text-[11px]">Chế độ xem:</span>
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-slate-600 font-medium">
            <button
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1 rounded-md transition-all text-xs cursor-pointer ${
                density === 'compact'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Gọn toàn màn hình
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={`px-2.5 py-1 rounded-md transition-all text-xs cursor-pointer ${
                density === 'comfortable'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Thoáng rộng
            </button>
          </div>
        </div>
      </div>

      {/* Main Timeline Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Day Column Headers (Sticky Header) */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700 sticky top-16 z-20">
          {/* Time gutter header */}
          <div className="p-2.5 text-center text-[11px] text-slate-400 font-mono border-r border-slate-200 flex items-center justify-center">
            Giờ
          </div>

          {/* 7 Days Headers with Dates */}
          {DAYS_OF_WEEK.map((d) => {
            const dateInfo = weekDates.find((w) => w.dayId === d.id);
            const dayClasses = filteredItems.filter((i) => i.day === d.id);
            const totalHours = dayClasses.reduce(
              (sum, it) => sum + calculateDurationHours(it.startTime, it.endTime),
              0
            );
            const isWeekend = d.id === 'T7' || d.id === 'CN';

            return (
              <div
                key={d.id}
                className={`p-2 text-center border-r last:border-r-0 border-slate-200 flex flex-col items-center justify-center ${
                  dateInfo?.isToday
                    ? 'bg-emerald-50 text-emerald-950 font-bold'
                    : isWeekend
                    ? 'bg-amber-50/60 text-amber-950'
                    : 'text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <span className="font-bold text-xs">{d.name}</span>
                  <span className="text-[10px] font-mono px-1 rounded-xs bg-white/90 border border-slate-200 text-slate-800 font-bold">
                    {dateInfo?.dateStr}
                  </span>
                  {dateInfo?.isToday && (
                    <span className="text-[9px] font-bold px-1.5 rounded-full bg-emerald-600 text-white animate-pulse">
                      Hôm nay
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  <span>{dayClasses.length} ca</span>
                  <span className="mx-1">·</span>
                  <span className="font-bold text-slate-700">{totalHours.toFixed(1)}h</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Canvas Body */}
        <div className="relative overflow-x-auto">
          <div
            className="grid grid-cols-[56px_repeat(7,1fr)] relative"
            style={{ height: `${totalChartHeight}px` }}
          >
            {/* Left Time Axis */}
            <div className="border-r border-slate-200 bg-slate-50/60 relative select-none">
              {hoursList.map((h, idx) => (
                <div
                  key={h}
                  className="absolute w-full pr-2 text-right font-mono text-[10px] text-slate-400 -translate-y-2"
                  style={{ top: `${idx * hourHeight}px` }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* 7 Columns for Days */}
            {DAYS_OF_WEEK.map((d) => {
              const dayClasses = filteredItems.filter((i) => i.day === d.id);
              const isWeekend = d.id === 'T7' || d.id === 'CN';

              return (
                <div
                  key={d.id}
                  className={`border-r last:border-r-0 border-slate-200 relative group/col ${
                    isWeekend ? 'bg-amber-50/20' : 'bg-white'
                  }`}
                >
                  {/* Horizontal Hour Grid Lines */}
                  {hoursList.map((h, idx) => (
                    <div
                      key={h}
                      onClick={() => {
                        const timeStr = `${String(h).padStart(2, '0')}:00`;
                        onAddNewToDay(d.id, timeStr);
                      }}
                      title={`Nhấp để thêm ca học lúc ${String(h).padStart(2, '0')}:00 (${d.name})`}
                      className="absolute w-full border-b border-slate-100 hover:bg-slate-100/60 cursor-pointer transition-colors"
                      style={{
                        top: `${idx * hourHeight}px`,
                        height: `${hourHeight}px`,
                      }}
                    />
                  ))}

                  {/* Render Class Block Items */}
                  {dayClasses.map((item) => {
                    const startMin = getMinutesFromStart(item.startTime);
                    const endMin = getMinutesFromStart(item.endTime);
                    const durationMinutes = Math.max(30, endMin - startMin);
                    const durationHours = calculateDurationHours(item.startTime, item.endTime);

                    // Position in pixels
                    const topPx = (startMin / 60) * hourHeight;
                    const heightPx = Math.max(32, (durationMinutes / 60) * hourHeight);

                    const color = SUBJECT_COLORS[item.colorKey] || {
                      bgColor: 'bg-indigo-50',
                      borderColor: 'border-indigo-300',
                      textColor: 'text-indigo-950',
                      badgeBg: 'bg-indigo-100',
                      badgeText: 'text-indigo-800',
                      accentHex: '#6366F1',
                    };

                    const isHovered = hoveredItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                        }}
                        className={`absolute left-1 right-1 rounded-lg border p-1.5 transition-all cursor-pointer shadow-xs overflow-hidden ${
                          color.bgColor
                        } ${color.borderColor} ${color.textColor} ${
                          isHovered ? 'z-30 ring-2 ring-slate-900 shadow-md scale-[1.02]' : 'z-10'
                        }`}
                      >
                        {/* Time & Duration badge */}
                        <div className="flex items-center justify-between text-[10px] font-mono leading-none mb-1">
                          <span className="font-bold truncate">
                            {item.startTime} – {item.endTime}
                          </span>
                          {item.isTrial ? (
                            <span className="px-1 py-0.2 rounded-xs text-[9px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-0.5 shrink-0">
                              <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                              <span>Học thử</span>
                            </span>
                          ) : (
                            <span className={`px-1 py-0.2 rounded-xs text-[9px] font-bold ${color.badgeBg} ${color.badgeText} shrink-0`}>
                              {durationHours}h
                            </span>
                          )}
                        </div>

                        {/* Student Name */}
                        <div className="font-bold text-xs leading-tight truncate">
                          {item.student}
                        </div>

                        {/* Subject */}
                        <div className="text-[10px] font-medium opacity-85 truncate mt-0.5">
                          {item.fullSubject}
                        </div>

                        {/* Hover Quick Actions */}
                        {isHovered && (
                          <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-white/95 rounded-md p-0.5 shadow-xs border border-slate-200">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditItem(item);
                              }}
                              title="Sửa"
                              className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-sm"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateItem(item);
                              }}
                              title="Nhân bản"
                              className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-sm"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItem(item);
                              }}
                              title="Xoá"
                              className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
