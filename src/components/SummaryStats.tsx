import React from 'react';
import { DAYS_OF_WEEK, SUBJECT_COLORS, calculateDurationHours, formatVND, getStandardHourlyRate } from '../data/initialSchedule';
import { ScheduleItem } from '../types/schedule';
import { Users, Clock, CalendarCheck, DollarSign, BookOpen, Sparkles, TrendingUp } from 'lucide-react';

interface SummaryStatsProps {
  items: ScheduleItem[];
  onUpdateRate: (student: string, subject: string, newRate: number) => void;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ items, onUpdateRate }) => {
  // Aggregate by student + subject
  const studentMap: Record<
    string,
    {
      student: string;
      subject: string;
      grade: string;
      fullSubject: string;
      colorKey: string;
      sessions: number;
      hours: number;
      paidHours: number;
      trialSessions: number;
      days: string[];
      hourlyRate: number;
      isTrial?: boolean;
    }
  > = {};

  items.forEach((it) => {
    const key = `${it.student} - ${it.fullSubject}`;
    const dur = calculateDurationHours(it.startTime, it.endTime);
    if (!studentMap[key]) {
      studentMap[key] = {
        student: it.student,
        subject: it.subject,
        grade: it.grade,
        fullSubject: it.fullSubject,
        colorKey: it.colorKey,
        sessions: 0,
        hours: 0,
        paidHours: 0,
        trialSessions: 0,
        days: [],
        hourlyRate: it.isTrial ? 0 : (it.hourlyRate || getStandardHourlyRate(it.student)),
        isTrial: !!it.isTrial,
      };
    }
    studentMap[key].sessions += 1;
    studentMap[key].hours += dur;
    if (it.isTrial) {
      studentMap[key].trialSessions += 1;
    } else {
      studentMap[key].paidHours += dur;
    }
    if (!studentMap[key].days.includes(it.day)) {
      studentMap[key].days.push(it.day);
    }
  });

  const studentBreakdown = Object.values(studentMap).sort((a, b) => b.hours - a.hours);

  // Overall metrics
  const totalSessions = items.length;
  const totalTrialSessions = items.filter((i) => i.isTrial).length;
  const totalHours = items.reduce(
    (sum, it) => sum + calculateDurationHours(it.startTime, it.endTime),
    0
  );
  const uniqueStudents = Array.from(new Set(items.map((i) => i.student)));
  const totalTuition = studentBreakdown.reduce(
    (sum, st) => sum + st.paidHours * st.hourlyRate,
    0
  );

  // Subject grouping metrics
  const subjectGroups: Record<string, { sessions: number; hours: number }> = {};
  items.forEach((it) => {
    const subj = it.subject.includes('Toán') ? 'Môn Toán' : it.subject.includes('Hoá') ? 'Môn Hoá' : 'Lập trình / Khác';
    if (!subjectGroups[subj]) subjectGroups[subj] = { sessions: 0, hours: 0 };
    subjectGroups[subj].sessions += 1;
    subjectGroups[subj].hours += calculateDurationHours(it.startTime, it.endTime);
  });

  return (
    <div className="space-y-6">
      
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Sessions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Tổng số ca dạy / tuần</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {totalSessions} <span className="text-xs font-normal text-slate-500">buổi</span>
            </div>
            {totalTrialSessions > 0 ? (
              <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                ⭐ Gồm {totalTrialSessions} ca học thử (0₫)
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 mt-1 block">Trung bình ~{(totalSessions / 7).toFixed(1)} ca / ngày</span>
            )}
          </div>
        </div>

        {/* Card 2: Total Hours */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Tổng thời lượng giảng dạy</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">giờ / tuần</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">~{(totalHours / 7).toFixed(1)} giờ mỗi ngày</span>
          </div>
        </div>

        {/* Card 3: Unique Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Quy mô học sinh</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {uniqueStudents.length} <span className="text-xs font-normal text-slate-500">học sinh</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">{studentBreakdown.length} cặp lớp môn học</span>
          </div>
        </div>

        {/* Card 4: Estimated Tuition */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Thu nhập ước tính / tuần</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
              {formatVND(totalTuition)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
              ~{formatVND(totalTuition * 4)} / tháng
            </span>
          </div>
        </div>

      </div>

      {/* Subject Distribution Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Phân Bổ Tải Giảng Dạy Theo Nhóm Môn</h3>
          </div>
          <span className="text-xs text-slate-500">Tổng cộng {totalHours.toFixed(1)} giờ</span>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          {Object.entries(subjectGroups).map(([groupName, data], idx) => {
            const pct = (data.hours / totalHours) * 100;
            const bgClass =
              idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-amber-500' : 'bg-purple-500';
            return (
              <div
                key={groupName}
                style={{ width: `${pct}%` }}
                className={`${bgClass} transition-all`}
                title={`${groupName}: ${data.hours}h (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend for Groups */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          {Object.entries(subjectGroups).map(([groupName, data], idx) => {
            const pct = ((data.hours / totalHours) * 100).toFixed(1);
            const dotColor =
              idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-amber-500' : 'bg-purple-500';

            return (
              <div key={groupName} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                  <span className="font-semibold text-slate-800">{groupName}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono tabular-nums font-bold text-slate-900">{data.hours}h</span>
                  <span className="text-slate-400 text-[11px] ml-1">({data.sessions} buổi · {pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Student Tuition Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Sổ Chi Tiết Số Giờ & Biểu Phí Từng Học Sinh</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                Cho phép chỉnh sửa đơn giá
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bạn có thể nhập trực tiếp mức học phí/giờ của từng học sinh để bảng tự động cập nhật tổng thành tiền
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4 text-center w-12">STT</th>
                <th className="py-2.5 px-4">Tên học sinh</th>
                <th className="py-2.5 px-4">Môn & Khối lớp</th>
                <th className="py-2.5 px-4 text-center">Số buổi/tuần</th>
                <th className="py-2.5 px-4 text-right">Tổng thời lượng</th>
                <th className="py-2.5 px-4">Các ngày trong tuần</th>
                <th className="py-2.5 px-4 text-right min-w-[150px]">Đơn giá / giờ (VNĐ)</th>
                <th className="py-2.5 px-4 text-right">Học phí tuần (VNĐ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentBreakdown.map((st, idx) => {
                const color = SUBJECT_COLORS[st.colorKey] || {
                  bgColor: 'bg-slate-50',
                  borderColor: 'border-slate-200',
                  textColor: 'text-slate-900',
                  badgeBg: 'bg-slate-100',
                  badgeText: 'text-slate-700',
                  accentHex: '#64748B',
                };
                const isTrialOnly = st.isTrial || (st.sessions === st.trialSessions);
                const weekCost = isTrialOnly ? 0 : st.paidHours * st.hourlyRate;

                return (
                  <tr key={`${st.student}-${st.fullSubject}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color.accentHex }}
                        />
                        <span>{st.student}</span>
                        {isTrialOnly && (
                          <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                            Học thử
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${color.bgColor} ${color.borderColor} ${color.textColor}`}
                      >
                        {st.fullSubject}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-medium text-slate-700">
                      {st.sessions} buổi
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {st.hours.toFixed(1)} giờ
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {st.days.map((d) => (
                          <span
                            key={d}
                            className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-sm font-mono text-[10px] text-slate-700"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isTrialOnly ? (
                        <span className="text-amber-800 font-bold text-xs">0₫ (Miễn phí)</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="10000"
                            value={st.hourlyRate}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (!isNaN(val) && val >= 0) {
                                onUpdateRate(st.student, st.fullSubject, val);
                              }
                            }}
                            className="w-28 px-2 py-1 text-right font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                          />
                          <span className="text-slate-400 text-[10px]">₫</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-800 text-sm">
                      {formatVND(weekCost)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={3} className="py-3 px-4 uppercase text-xs">
                  Tổng cộng sổ thu nhập ({studentBreakdown.length} mục)
                </td>
                <td className="py-3 px-4 text-center font-mono tabular-nums">
                  {totalSessions} buổi
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-indigo-900 text-sm">
                  {totalHours.toFixed(1)}h
                </td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-right text-xs text-slate-500">Tổng học phí tuần:</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800 text-base">
                  {formatVND(totalTuition)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
