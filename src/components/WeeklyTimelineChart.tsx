import React, { useState } from 'react';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours, formatVND } from '../data/initialSchedule';
import { DayOfWeek, ScheduleItem } from '../types/schedule';
import { Clock, User, BookOpen, Edit2, Copy, Trash2, Plus, ZoomIn, ZoomOut, Info } from 'lucide-react';

interface WeeklyTimelineChartProps {
  items: ScheduleItem[];
  selectedColorKey: string | null;
  onEditItem: (item: ScheduleItem) => void;
  onDeleteItem: (item: ScheduleItem) => void;
  onDuplicateItem: (item: ScheduleItem) => void;
  onAddNewToDay: (day: DayOfWeek, defaultTime?: string) => void;
}

const START_HOUR = 6;  // 06:00
const END_HOUR = 23;   // 23:00
const TOTAL_HOURS = END_HOUR - START_HOUR; // 17 hours
const TOTAL_MINUTES = TOTAL_HOURS * 60;    // 1020 minutes

export const WeeklyTimelineChart: React.FC<WeeklyTimelineChartProps> = ({
  items,
  selectedColorKey,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onAddNewToDay,
}) => {
  // Density mode: 'compact' (38px/hr, total ~646px) or 'comfortable' (52px/hr, total ~884px)
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

  return (
    <div className="space-y-3">
      
      {/* Chart Control Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Biểu đồ thời gian tuần (Timeline 06:00 – 23:00)</span>
          </div>
          <span className="text-slate-400 hidden md:inline">·</span>
          <span className="text-slate-500 hidden md:inline">
            Khung giờ theo tỷ lệ thực · Nhìn rõ khoảng trống & phân bổ lịch dạy
          </span>
        </div>

        {/* Density switcher and hint */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium text-[11px]">Chế độ xem:</span>
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-slate-600 font-medium">
            <button
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1 rounded-md transition-all text-xs ${
                density === 'compact'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Gọn toàn màn hình
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={`px-2.5 py-1 rounded-md transition-all text-xs ${
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

          {/* 7 Days Headers */}
          {DAYS_OF_WEEK.map((d) => {
            const dayClasses = filteredItems.filter((i) => i.day === d.id);
            const totalHours = dayClasses.reduce(
              (sum, it) => sum + calculateDurationHours(it.startTime, it.endTime),
              0
            );
            const isWeekend = d.id === 'T7' || d.id === 'CN';

            return (
              <div
                key={d.id}
                className={`p-2.5 text-center border-r last:border-r-0 border-slate-200 flex flex-col items-center justify-center ${
                  isWeekend ? 'bg-amber-50/60 text-amber-950' : 'text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs">{d.name}</span>
                  <span className="text-[10px] font-mono px-1 rounded-xs bg-white/80 border border-slate-200 text-slate-600 font-semibold">
                    {d.shortName}
                  </span>
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

            {/* 7 Days Column Tracks */}
            {DAYS_OF_WEEK.map((d) => {
              const dayClasses = filteredItems.filter((i) => i.day === d.id);
              const isWeekend = d.id === 'T7' || d.id === 'CN';

              return (
                <div
                  key={d.id}
                  onClick={(e) => {
                    // Click on empty space in column to add class at that approximate hour
                    if (e.target === e.currentTarget) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickY = e.clientY - rect.top;
                      const clickedHour = Math.floor(START_HOUR + clickY / hourHeight);
                      const formattedTime = `${String(Math.min(22, Math.max(START_HOUR, clickedHour))).padStart(2, '0')}:00`;
                      onAddNewToDay(d.id, formattedTime);
                    }
                  }}
                  className={`relative border-r last:border-r-0 border-slate-200 transition-colors cursor-pointer group/col ${
                    isWeekend ? 'bg-amber-50/15' : 'bg-white'
                  }`}
                >
                  {/* Horizontal Hour Grid Guidelines */}
                  {hoursList.map((h, idx) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-slate-100 pointer-events-none"
                      style={{ top: `${idx * hourHeight}px` }}
                    />
                  ))}

                  {/* Half-hour subtle dotted line */}
                  {hoursList.slice(0, -1).map((h, idx) => (
                    <div
                      key={`half-${h}`}
                      className="absolute w-full border-t border-dashed border-slate-100/60 pointer-events-none"
                      style={{ top: `${idx * hourHeight + hourHeight / 2}px` }}
                    />
                  ))}

                  {/* Render Class Blocks */}
                  {dayClasses.map((item) => {
                    const startMins = getMinutesFromStart(item.startTime);
                    const endMins = getMinutesFromStart(item.endTime);
                    const durationMins = Math.max(30, endMins - startMins);
                    const duration = calculateDurationHours(item.startTime, item.endTime);

                    const topPx = (startMins / 60) * hourHeight;
                    const heightPx = Math.max(30, (durationMins / 60) * hourHeight - 2);

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
                          left: '3px',
                          right: '3px',
                        }}
                        className={`absolute rounded-lg border px-2 py-1 transition-all overflow-hidden flex flex-col justify-between shadow-2xs cursor-pointer z-10 ${
                          color.bgColor
                        } ${color.borderColor} ${color.textColor} ${
                          isHovered ? 'ring-2 ring-slate-900 ring-offset-1 z-30 shadow-md scale-101' : 'hover:shadow-xs'
                        }`}
                        title={`${item.startTime} - ${item.endTime}: ${item.student} (${item.fullSubject})`}
                      >
                        {/* Line 1: Concise Time & Duration */}
                        <div className="flex items-center justify-between gap-1 text-[10px] font-mono leading-none">
                          <span className="font-bold tabular-nums truncate">
                            {item.startTime}–{item.endTime}
                          </span>
                          <span className={`px-1 rounded-2xs font-extrabold text-[9px] ${color.badgeBg} ${color.badgeText} shrink-0`}>
                            {duration}h
                          </span>
                        </div>

                        {/* Line 2: Student Name & Subject (Concise & Bold) */}
                        <div className="flex items-center gap-1 text-[11px] leading-tight font-bold truncate mt-0.5">
                          <span className="truncate">{item.student}</span>
                          <span className="text-[10px] opacity-75 font-normal">·</span>
                          <span className="text-[10px] font-semibold opacity-90 truncate">{item.fullSubject}</span>
                        </div>

                        {/* Line 3: Actions (visible on hover) */}
                        {isHovered && (
                          <div className="mt-1 pt-0.5 border-t border-black/10 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditItem(item);
                              }}
                              title="Chỉnh sửa"
                              className="p-1 bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-xs shadow-2xs"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateItem(item);
                              }}
                              title="Nhân bản"
                              className="p-1 bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-600 rounded-xs shadow-2xs"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItem(item);
                              }}
                              title="Xoá"
                              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xs shadow-2xs"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
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

      {/* Footer Info & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Mẹo: Bạn có thể click vào bất kỳ ô trống nào trên biểu đồ để tạo nhanh ca học tại khung giờ đó.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span>Khoảng trống = Khung giờ rảnh</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Khối màu = Ca dạy có lịch</span>
          </span>
        </div>
      </div>

    </div>
  );
};
