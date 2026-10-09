import React, { useState, useEffect, useMemo } from 'react';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours, getStandardHourlyRate, formatVND } from '../data/initialSchedule';
import { DayOfWeek, ScheduleItem } from '../types/schedule';
import { X, Clock, AlertTriangle, Check, Sparkles, Plus, Star, Search, Palette, User, BookOpen } from 'lucide-react';

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

type ColorCategory = 'all' | 'students' | 'blue' | 'green' | 'warm' | 'purple' | 'neutral';

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
  const [hourlyRate, setHourlyRate] = useState<number>(150000);
  const [colorKey, setColorKey] = useState<string>('minh_thien_toan_9');
  const [isTrial, setIsTrial] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Color picker enhancements
  const [colorFilter, setColorFilter] = useState<ColorCategory>('all');
  const [colorSearch, setColorSearch] = useState('');

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
      setHourlyRate(initialItem.hourlyRate || 0);
      setColorKey(initialItem.colorKey);
      setIsTrial(!!initialItem.isTrial);
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
      setHourlyRate(150000);
      setColorKey('minh_thien_toan_9');
      setIsTrial(false);
    }
    setError(null);
    setColorSearch('');
    setColorFilter('all');
  }, [initialItem, defaultDay, defaultStartTime, isOpen]);

  // When student or subject changes, automatically match theme and rate if exists
  const handleStudentChange = (val: string) => {
    setStudent(val);
    if (!isTrial) {
      const stdRate = getStandardHourlyRate(val);
      setHourlyRate(stdRate);
    }

    const match = allItems.find(
      (it) => it.student.toLowerCase() === val.trim().toLowerCase()
    );
    if (match) {
      if (!isTrial) setColorKey(match.colorKey);
      if (match.subject) setSubject(match.subject);
      if (match.grade) setGrade(match.grade);
    }
  };

  const handleToggleTrial = (checked: boolean) => {
    setIsTrial(checked);
    if (checked) {
      setHourlyRate(0);
      setColorKey('trial_free');
    } else {
      setHourlyRate(getStandardHourlyRate(student));
      setColorKey('minh_thien_toan_9');
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

  // Filtered color palette
  const filteredColors = useMemo(() => {
    return Object.entries(SUBJECT_COLORS).filter(([key, c]) => {
      // Search filter
      if (colorSearch.trim()) {
        const q = colorSearch.toLowerCase();
        if (!c.label.toLowerCase().includes(q) && !key.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Category filter
      if (colorFilter === 'all') return true;
      if (colorFilter === 'students') {
        return c.student && c.student !== 'Học thử';
      }
      if (colorFilter === 'blue') {
        return key.includes('blue') || key.includes('cyan') || key.includes('sky') || key.includes('navy') || key.includes('ocean');
      }
      if (colorFilter === 'green') {
        return key.includes('green') || key.includes('lime') || key.includes('mint') || key.includes('emerald') || key.includes('teal') || key.includes('forest') || key.includes('turquoise');
      }
      if (colorFilter === 'warm') {
        return key.includes('red') || key.includes('ruby') || key.includes('crimson') || key.includes('orange') || key.includes('coral') || key.includes('yellow') || key.includes('amber') || key.includes('gold') || key.includes('trial');
      }
      if (colorFilter === 'purple') {
        return key.includes('purple') || key.includes('violet') || key.includes('lavender') || key.includes('plum') || key.includes('pink') || key.includes('rose') || key.includes('fuchsia') || key.includes('magenta');
      }
      if (colorFilter === 'neutral') {
        return key.includes('slate') || key.includes('zinc') || key.includes('copper') || key.includes('coffee') || key.includes('stone');
      }
      return true;
    });
  }, [colorFilter, colorSearch]);

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
    const fullSubject = isTrial ? `${trimmedSubject} ${trimmedGrade} (Học thử)`.trim() : `${trimmedSubject} ${trimmedGrade}`.trim();

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
      hourlyRate: isTrial ? 0 : (Number(hourlyRate) || 0),
      colorKey: isTrial ? (colorKey || 'trial_free') : (colorKey || 'minh_thien_toan_9'),
      isTrial,
    };

    onSave(newItem);
    onClose();
  };

  const selectedColorConfig = SUBJECT_COLORS[colorKey] || SUBJECT_COLORS['minh_thien_toan_9'];
  const previewFee = isTrial ? 0 : duration * (Number(hourlyRate) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl my-6 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>{initialItem ? 'Cập Nhật Buổi Học' : 'Thêm Buổi Học Mới Vào Lịch'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thời khóa biểu tuần dạy kèm · Tự động tính thời lượng, học phí & màu sắc
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Conflict Warning */}
        {conflict && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lưu ý trùng lịch:</span> Đã có ca học của{' '}
              <strong className="font-semibold">{conflict.student}</strong> ({conflict.startTime} – {conflict.endTime}) vào {DAYS_OF_WEEK.find(d => d.id === day)?.name}.
              <div className="text-[11px] text-amber-700 mt-0.5">
                Bạn vẫn có thể lưu nếu đây là ca dạy ghép hoặc dạy nhóm.
              </div>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* 1. Day of Week */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Thứ trong tuần <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = day === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDay(d.id)}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div>{d.shortName}</div>
                    <div className="text-[10px] font-normal opacity-80">{d.name.replace('Thứ ', 'T')}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Quick Time Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Khung giờ dạy học</span>
              </label>
              <span className="text-[11px] text-indigo-700 font-semibold">
                Thời lượng: {duration > 0 ? `${duration} tiếng` : '—'}
              </span>
            </div>

            {/* Presets badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {TIME_PRESETS.map((p) => {
                const isSelected = startTime === p.start && endTime === p.end;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setStartTime(p.start);
                      setEndTime(p.end);
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Time Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Giờ bắt đầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Giờ kết thúc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Student Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên học sinh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={student}
              onChange={(e) => handleStudentChange(e.target.value)}
              placeholder="VD: Thuỷ Lâm, Minh Thiện, Hoàng Lâm, Noel, Khôi..."
              required
              list="student-list"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white font-medium"
            />
            <datalist id="student-list">
              {existingStudents.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

            {/* Existing Student Quick-click Pills */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {existingStudents.slice(0, 7).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStudentChange(st)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors"
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Subject & Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Môn học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                placeholder="VD: Toán, Hoá, Lý, Anh..."
                required
                list="subject-list"
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

          {/* 5. ⭐ TRIAL CLASS OPTION (Yêu cầu: Lựa chọn lớp học thử, không tính phí, màu riêng) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isTrial ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400' : 'bg-slate-50 border-slate-200'
          }`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isTrial}
                onChange={(e) => handleToggleTrial(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>Lớp học thử (Trial / Demo miễn phí)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-900 font-extrabold rounded-md border border-amber-300">
                    0 VNĐ · MIỄN PHÍ
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Khi kích hoạt: Học phí tự động đặt về <strong>0₫</strong> (không cộng vào thu nhập), tự động áp dụng <strong>màu vàng hổ phách viền nét đứt</strong> và gắn nhãn <em>⭐ Học thử (0₫)</em> riêng biệt.
                </p>
              </div>
            </label>
          </div>

          {/* 6. Notes & Hourly Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú (tuỳ chọn)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Học bù, Khảo sát lực học..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đơn giá / giờ (VNĐ) {isTrial && <span className="text-amber-700 font-normal">(0₫ - Miễn phí)</span>}
              </label>
              <input
                type="number"
                step="10000"
                min="0"
                disabled={isTrial}
                value={isTrial ? 0 : hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono tabular-nums font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                  isTrial ? 'bg-amber-100/50 text-amber-900 border-amber-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* 7. LIVE PREVIEW CARD */}
          <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
              <span>Xem trước ca học trên thời khóa biểu:</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {isTrial ? 'Lớp học thử' : `${formatVND(previewFee)} / buổi`}
              </span>
            </div>

            <div className={`p-3 rounded-xl border transition-all ${selectedColorConfig.bgColor} ${selectedColorConfig.borderColor} ${selectedColorConfig.textColor}`}>
              <div className="flex items-center justify-between text-xs font-mono mb-1 pb-1 border-b border-black/5">
                <span className="font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 opacity-75" />
                  {startTime} – {endTime} ({duration}h)
                </span>
                {isTrial ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>Học thử (0₫)</span>
                  </span>
                ) : (
                  <span className="font-bold tabular-nums text-[11px]">
                    {formatVND(previewFee)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <User className="w-3 h-3 opacity-75" />
                  {student.trim() || '(Tên học sinh)'}
                </span>
                <span className="font-semibold flex items-center gap-1">
                  <BookOpen className="w-3 h-3 opacity-75" />
                  {subject} {grade}
                </span>
              </div>
              {notes && (
                <div className="mt-1 text-[11px] italic opacity-80 border-t border-black/5 pt-1">
                  {notes}
                </div>
              )}
            </div>
          </div>

          {/* 8. EXPANDED COLOR SELECTION (Yêu cầu: Tăng số lượng màu hiển thị có thể chọn khi tạo ca) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chọn màu hiển thị ({Object.keys(SUBJECT_COLORS).length} màu có sẵn)</span>
              </label>
              <span className="text-[11px] text-slate-400">Đồng bộ cả vào Excel</span>
            </div>

            {/* Category tabs & Search bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm màu (tên, tone màu)..."
                  value={colorSearch}
                  onChange={(e) => setColorSearch(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
                <button
                  type="button"
                  onClick={() => setColorFilter('all')}
                  className={`px-2 py-1 rounded-md shrink-0 font-medium ${
                    colorFilter === 'all' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({Object.keys(SUBJECT_COLORS).length})
                </button>
                <button
                  type="button"
                  onClick={() => setColorFilter('students')}
                  className={`px-2 py-1 rounded-md shrink-0 font-medium ${
                    colorFilter === 'students' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Theo học sinh
                </button>
                <button
                  type="button"
                  onClick={() => setColorFilter('blue')}
                  className={`px-2 py-1 rounded-md shrink-0 font-medium ${
                    colorFilter === 'blue' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tone Xanh Lam
                </button>
                <button
                  type="button"
                  onClick={() => setColorFilter('green')}
                  className={`px-2 py-1 rounded-md shrink-0 font-medium ${
                    colorFilter === 'green' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tone Xanh Lá
                </button>
                <button
                  type="button"
                  onClick={() => setColorFilter('warm')}
                  className={`px-2 py-1 rounded-md shrink-0 font-medium ${
                    colorFilter === 'warm' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tone Đỏ / Vàng
                </button>
                <button
                  type="button"
                  onClick={() => setColorFilter('purple')}
                  className={`px-2 py-1 rounded-md shrink-0 font-medium ${
                    colorFilter === 'purple' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tone Tím / Hồng
                </button>
              </div>
            </div>

            {/* Colors Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
              {filteredColors.map(([key, c]) => {
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
                        : 'opacity-85 hover:opacity-100 hover:scale-101'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white"
                      style={{ backgroundColor: c.accentHex }}
                    />
                    <span className="truncate text-[11px] font-medium">{c.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-slate-900 shrink-0" />}
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Huỷ Bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{initialItem ? 'Cập Nhật Buổi Học' : 'Thêm Vào Lịch Dạy'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
