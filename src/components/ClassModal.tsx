import React, { useState, useEffect } from 'react';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours } from '../data/initialSchedule';
import { DayOfWeek, ScheduleItem, SubjectColor } from '../types/schedule';
import { X, Clock, AlertTriangle, Check, Sparkles, Plus } from 'lucide-react';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ScheduleItem) => void;
  initialItem?: ScheduleItem | null;
  defaultDay?: DayOfWeek;
  defaultStartTime?: string;
  allItems: ScheduleItem[];
}

const TIME_PRESETS = [
  { label: '06:45 – 08:45', start: '06:45', end: '08:45', tag: 'Sáng' },
  { label: '07:30 – 08:30', start: '07:30', end: '08:30', tag: 'Sáng' },
  { label: '09:15 – 11:15', start: '09:15', end: '11:15', tag: 'Sáng' },
  { label: '10:00 – 11:00', start: '10:00', end: '11:00', tag: 'Sáng' },
  { label: '13:00 – 15:00', start: '13:00', end: '15:00', tag: 'Chiều' },
  { label: '14:30 – 16:30', start: '14:30', end: '16:30', tag: 'Chiều' },
  { label: '15:30 – 17:30', start: '15:30', end: '17:30', tag: 'Chiều' },
  { label: '17:00 – 19:00', start: '17:00', end: '19:00', tag: 'Chiều' },
  { label: '18:30 – 20:30', start: '18:30', end: '20:30', tag: 'Tối' },
  { label: '20:00 – 22:00', start: '20:00', end: '22:00', tag: 'Tối' },
  { label: '20:15 – 21:15', start: '20:15', end: '21:15', tag: 'Tối' },
  { label: '20:30 – 22:30', start: '20:30', end: '22:30', tag: 'Tối' },
];

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  defaultDay = 'T2',
  defaultStartTime,
  allItems,
}) => {
  const [day, setDay] = useState<DayOfWeek>(defaultDay);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [student, setStudent] = useState('');
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('9');
  const [notes, setNotes] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(220000);
  const [colorKey, setColorKey] = useState<string>('minh_thien_toan_9');
  const [error, setError] = useState<string | null>(null);

  // Existing student names for autocomplete
  const existingStudents = Array.from(new Set(allItems.map((i) => i.student)));

  useEffect(() => {
    if (initialItem) {
      setDay(initialItem.day);
      setStartTime(initialItem.startTime);
      setEndTime(initialItem.endTime);
      setStudent(initialItem.student);
      setSubject(initialItem.subject);
      setGrade(initialItem.grade);
      setNotes(initialItem.notes || '');
      setHourlyRate(initialItem.hourlyRate || 220000);
      setColorKey(initialItem.colorKey);
    } else {
      setDay(defaultDay);
      if (defaultStartTime) {
        setStartTime(defaultStartTime);
        const [h, m] = defaultStartTime.split(':').map(Number);
        const endH = Math.min(23, h + 2);
        setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      } else {
        setStartTime('17:00');
        setEndTime('19:00');
      }
      setStudent('');
      setSubject('Toán');
      setGrade('9');
      setNotes('');
      setHourlyRate(220000);
      setColorKey('minh_thien_toan_9');
    }
    setError(null);
  }, [initialItem, defaultDay, defaultStartTime, isOpen]);

  // When student or subject changes, automatically match theme if exists
  const handleStudentChange = (val: string) => {
    setStudent(val);
    const match = allItems.find(
      (it) => it.student.toLowerCase() === val.trim().toLowerCase()
    );
    if (match) {
      setColorKey(match.colorKey);
      if (match.hourlyRate) setHourlyRate(match.hourlyRate);
      if (match.subject) setSubject(match.subject);
      if (match.grade) setGrade(match.grade);
    }
  };

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    const match = allItems.find(
      (it) =>
        it.student.toLowerCase() === student.trim().toLowerCase() &&
        it.subject.toLowerCase() === val.trim().toLowerCase()
    );
    if (match) {
      setColorKey(match.colorKey);
    }
  };

  if (!isOpen) return null;

  const duration = calculateDurationHours(startTime, endTime);

  // Advisory conflict check
  const conflict = allItems.find((it) => {
    if (initialItem && it.id === initialItem.id) return false;
    if (it.day !== day) return false;
    return startTime < it.endTime && it.startTime < endTime;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedStudent = student.trim();
    if (!trimmedStudent) {
      setError('Vui lòng nhập tên học sinh');
      return;
    }

    if (!startTime || !endTime) {
      setError('Vui lòng chọn giờ bắt đầu và kết thúc');
      return;
    }

    if (duration <= 0) {
      setError('Giờ kết thúc phải lớn hơn giờ bắt đầu');
      return;
    }

    const trimmedSubject = subject.trim() || 'Toán';
    const trimmedGrade = grade.trim() || '10';
    const fullSubject = `${trimmedSubject} ${trimmedGrade}`.trim();

    const newItem: ScheduleItem = {
      id: initialItem ? initialItem.id : `sch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      day,
      startTime,
      endTime,
      student: trimmedStudent,
      subject: trimmedSubject,
      grade: trimmedGrade,
      fullSubject,
      notes: notes.trim() || undefined,
      hourlyRate: Number(hourlyRate) || 220000,
      colorKey: colorKey || 'minh_thien_toan_9',
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl my-6 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>{initialItem ? 'Chỉnh Sửa Buổi Học' : 'Thêm Buổi Học Mới Vào Lịch'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thời khóa biểu tuần dạy kèm · Tự động tính thời lượng và học phí
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {conflict && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold">Lưu ý trùng lịch (vẫn cho phép lưu nếu dạy ghép):</span> Có ca của <strong>{conflict.student}</strong> ({conflict.startTime} - {conflict.endTime}) vào cùng ngày.
              </div>
            </div>
          )}

          {/* 1. Day of Week */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Chọn Thứ trong tuần <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = day === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDay(d.id)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs scale-102 ring-2 ring-slate-900 ring-offset-1'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div>{d.shortName}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Time Pickers & Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                2. Khung giờ học (Bắt đầu – Kết thúc) <span className="text-rose-500">*</span>
              </label>
              <div className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                Thời lượng: {duration > 0 ? `${duration.toFixed(1)}h` : '0h'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] text-slate-500 mb-1 font-medium">Bắt đầu</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <span className="block text-[11px] text-slate-500 mb-1 font-medium">Kết thúc</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            </div>

            {/* Quick time preset chips */}
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Khung giờ phổ biến (click để chọn nhanh):</span>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {TIME_PRESETS.map((p) => {
                  const isActive = startTime === p.start && endTime === p.end;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setStartTime(p.start);
                        setEndTime(p.end);
                      }}
                      className={`text-[11px] px-2 py-1 rounded-md border font-mono transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Student Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              3. Tên học sinh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="student-list"
              value={student}
              onChange={(e) => handleStudentChange(e.target.value)}
              placeholder="VD: Thuỷ Lâm, Minh Thiện, Lâm, Noel, Hoàng Nam..."
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white font-semibold"
            />
            <datalist id="student-list">
              {existingStudents.map((st) => (
                <option key={st} value={st} />
              ))}
            </datalist>
          </div>

          {/* 4. Subject & Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. Môn học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="subject-list"
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                placeholder="Toán, Hoá, Scratch..."
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white font-medium"
              />
              <datalist id="subject-list">
                <option value="Toán" />
                <option value="Hoá" />
                <option value="Toán tư duy" />
                <option value="Scratch" />
                <option value="Vật lý" />
                <option value="Sinh học" />
                <option value="Tiếng Anh" />
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khối lớp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="VD: 9, 10, 11, 12, 6, 2..."
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* 5. Notes & Hourly Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú (tuỳ chọn)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Học bù, Luyện thi THPT, Cơ bản..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đơn giá / giờ (VNĐ)
              </label>
              <input
                type="number"
                step="10000"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* 6. Color Theme Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Màu nhận diện thông minh (Color Theme)</span>
              </label>
              <span className="text-[11px] text-slate-400">Đồng bộ sang Excel (.xlsx)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
              {Object.entries(SUBJECT_COLORS).map(([key, c]) => {
                const isSelected = colorKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColorKey(key)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      c.bgColor
                    } ${c.borderColor} ${c.textColor} ${
                      isSelected
                        ? 'ring-2 ring-slate-900 ring-offset-1 font-bold shadow-xs scale-102'
                        : 'opacity-70 hover:opacity-100 hover:scale-101'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: c.accentHex }}
                    />
                    <span className="truncate text-[11px] font-medium">{c.label}</span>
                    {isSelected && <Check className="w-3 h-3 ml-auto text-slate-900 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer CTA Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Huỷ Bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{initialItem ? 'Lưu Thay Đổi' : 'Thêm Vào Lịch Dạy'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
