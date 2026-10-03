import React from 'react';
import { SUBJECT_COLORS } from '../data/initialSchedule';
import { ScheduleItem } from '../types/schedule';
import { Sparkles, Filter, X } from 'lucide-react';

interface LegendBarProps {
  items: ScheduleItem[];
  selectedColorKey: string | null;
  onSelectColorKey: (key: string | null) => void;
}

export const LegendBar: React.FC<LegendBarProps> = ({
  items,
  selectedColorKey,
  onSelectColorKey,
}) => {
  // Count sessions per color key
  const counts: Record<string, number> = {};
  items.forEach((it) => {
    counts[it.colorKey] = (counts[it.colorKey] || 0) + 1;
  });

  const colorEntries = Object.entries(SUBJECT_COLORS);

  return (
    <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Label & Rule description */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Quy tắc màu thông minh:</span>
          </div>
          <span className="text-xs text-slate-500 hidden xl:inline">
            Cùng học sinh & môn học chung 1 màu · Khác môn phân biệt tone (Thuỷ Lâm Toán 10 vs Hoá 10; Lâm Hoá 11 vs Toán 11)
          </span>
        </div>

        {/* Legend Chips / Interactive Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {selectedColorKey && (
            <button
              onClick={() => onSelectColorKey(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
              <span>Hiện tất cả ({items.length})</span>
            </button>
          )}

          {colorEntries.map(([key, color]) => {
            const count = counts[key] || 0;
            const isSelected = selectedColorKey === key;
            const isDimmed = selectedColorKey && !isSelected;

            return (
              <button
                key={key}
                onClick={() => onSelectColorKey(isSelected ? null : key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  color.bgColor
                } ${color.borderColor} ${color.textColor} ${
                  isSelected
                    ? 'ring-2 ring-slate-900 ring-offset-1 font-bold shadow-xs'
                    : isDimmed
                    ? 'opacity-40 hover:opacity-100'
                    : 'hover:shadow-xs hover:scale-102'
                }`}
                title={`Lọc xem riêng: ${color.label} (${count} buổi)`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color.accentHex }}
                />
                <span className="truncate max-w-[140px]">{color.label}</span>
                <span
                  className={`text-[10px] px-1 rounded-sm font-mono tabular-nums ${color.badgeBg} ${color.badgeText}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
