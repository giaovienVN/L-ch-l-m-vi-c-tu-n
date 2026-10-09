import React, { useState, useRef } from 'react';
import { 
  Upload, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, 
  Trash2, Plus, Download, X, Eye, RefreshCw, FileUp
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import { parseCsvToSchedule, parseExcelToSchedule, ParseResult } from '../utils/importSchedule';
import { exportScheduleToCsv } from '../utils/exportCsv';
import { DAYS_OF_WEEK, calculateDurationHours, formatVND } from '../data/initialSchedule';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newItems: ScheduleItem[], replaceAll: boolean) => void;
  onClearAll: () => void;
  currentItemsCount: number;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onClearAll,
  currentItemsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    try {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const res = await parseExcelToSchedule(buffer);
        setParseResult(res);
      } else {
        // Assume CSV or text
        const text = await file.text();
        const res = parseCsvToSchedule(text);
        setParseResult(res);
      }
    } catch (err: any) {
      setParseResult({
        items: [],
        errors: [`Lỗi khi đọc file: ${err?.message || 'Định dạng không hợp lệ'}`],
        totalParsed: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleParsePastedText = () => {
    if (!pasteText.trim()) return;
    setIsLoading(true);
    try {
      const res = parseCsvToSchedule(pasteText);
      setFileName('Nội dung đã dán');
      setParseResult(res);
    } catch (err: any) {
      setParseResult({
        items: [],
        errors: [`Lỗi khi xử lý dữ liệu dán: ${err?.message || 'Không thể đọc'}`],
        totalParsed: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!parseResult || parseResult.items.length === 0) return;
    onImport(parseResult.items, importMode === 'replace');
    onClose();
  };

  const handleDownloadSample = () => {
    // Generate sample with 2 items (1 regular, 1 trial)
    const sampleItems: ScheduleItem[] = [
      {
        id: 'sample-1',
        day: 'T2',
        startTime: '08:00',
        endTime: '10:00',
        student: 'Nguyễn Văn A',
        subject: 'Toán',
        grade: '10',
        fullSubject: 'Toán 10',
        notes: 'Học chính thức',
        hourlyRate: 150000,
        colorKey: 'thuy_lam_toan_10',
        isTrial: false,
      },
      {
        id: 'sample-2',
        day: 'T3',
        startTime: '14:00',
        endTime: '15:30',
        student: 'Trần Thị B',
        subject: 'Hoá',
        grade: '11',
        fullSubject: 'Hoá 11',
        notes: 'Buổi học thử (0₫)',
        hourlyRate: 0,
        colorKey: 'trial_free',
        isTrial: true,
      },
    ];
    exportScheduleToCsv(sampleItems, 'Mau_ThoiKhoaBieu_EduSchedule.csv');
  };

  // Stats calculation for preview
  const previewItems = parseResult?.items || [];
  const previewHours = previewItems.reduce(
    (sum, it) => sum + calculateDurationHours(it.startTime, it.endTime),
    0
  );
  const previewTrialCount = previewItems.filter(it => it.isTrial).length;
  const previewTuition = previewItems.reduce(
    (sum, it) => sum + (it.isTrial ? 0 : calculateDurationHours(it.startTime, it.endTime) * (it.hourlyRate || 0)),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Cập Nhật & Nhập Lịch Mới</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  CSV / Excel
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Xóa lịch cũ và thay bằng lịch mới từ tệp CSV, Excel hoặc bảng tính
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Mode Selector (Replace old schedule vs Append) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Phương thức cập nhật thời khóa biểu:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label 
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  importMode === 'replace' 
                    ? 'bg-white border-amber-500 shadow-xs ring-1 ring-amber-500/30' 
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Xóa toàn bộ lịch cũ & Thay bằng lịch mới</span>
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-semibold">Khuyên dùng</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Xoá {currentItemsCount} ca hiện tại và nạp chính xác các ca trong file.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  importMode === 'append' 
                    ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500/30' 
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    Giữ lịch cũ & Bổ sung thêm ca mới
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Giữ nguyên {currentItemsCount} ca hiện tại và gộp thêm các ca từ file.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Source Tabs: Upload File vs Paste Text */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải Tệp Lên (.csv, .xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dán Nội Dung CSV / Bảng Tính</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSample}
                className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                title="Tải file mẫu để xem định dạng các cột"
              >
                <Download className="w-3 h-3" />
                <span>Tải file CSV mẫu</span>
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.xlsx,.xls,.tsv,.txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                      : fileName
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {fileName ? (
                      <span className="text-emerald-700 font-mono">Đã chọn: {fileName}</span>
                    ) : (
                      'Nhấn để chọn tệp hoặc kéo thả file vào đây'
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Hỗ trợ tệp <strong className="text-slate-700">.csv</strong> (UTF-8) hoặc <strong className="text-slate-700">.xlsx</strong> (Excel)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    (Tệp xuất ra từ nút "CSV" hoặc "Xuất Excel" đều được đọc tự động hoàn hảo)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Dán nội dung CSV hoặc copy trực tiếp các hàng từ Excel vào đây...\nVí dụ:\nSTT,Thứ trong tuần,Giờ bắt đầu,Giờ kết thúc,Tên học sinh,Môn học,Khối lớp,Ghi chú,Đơn giá/giờ (VNĐ)\n1,Thứ Hai,08:00,10:00,Thuỷ Lâm,Toán,10,Sáng sớm,150000\n2,Thứ Ba,14:00,15:30,Bảo Nam,Toán,8,Buổi học thử (0₫),0`}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-slate-50"
                />
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={!pasteText.trim() || isLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Phân tích & Xem trước dữ liệu</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Clear All Button (Clean Slate) */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Hoặc bạn muốn xoá sạch thời khóa biểu để tạo lại từ đầu?
            </span>
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xoá Sạch Lịch Cũ (Về Bảng Trắng)</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 bg-rose-100 p-1.5 rounded-lg">
                <span className="text-xs font-bold text-rose-900">Xác nhận xoá sạch {currentItemsCount} ca?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-rose-700 text-white rounded hover:bg-rose-800 transition-colors cursor-pointer"
                >
                  Xoá Luôn
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 text-xs text-rose-800 hover:bg-rose-200 rounded transition-colors cursor-pointer"
                >
                  Huỷ
                </button>
              </div>
            )}
          </div>

          {/* Parse Result & Preview */}
          {parseResult && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 space-y-3 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900">
                    Kết quả đọc file: Tìm thấy {previewItems.length} ca học hợp lệ
                  </span>
                </div>
                {previewTrialCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    ⭐ {previewTrialCount} ca học thử (0₫)
                  </span>
                )}
              </div>

              {/* Statistics summary badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Tổng số ca</span>
                  <span className="text-base font-bold text-slate-900">{previewItems.length} ca</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Tổng thời lượng</span>
                  <span className="text-base font-bold text-slate-900">{previewHours.toFixed(1)}h</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Lớp học thử</span>
                  <span className="text-base font-bold text-amber-700">{previewTrialCount} ca (0₫)</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Doanh thu dự kiến</span>
                  <span className="text-base font-bold text-emerald-700">{formatVND(previewTuition)}</span>
                </div>
              </div>

              {/* Parse warnings/errors */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Lưu ý ({parseResult.errors.length} cảnh báo):</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 max-h-20 overflow-y-auto">
                    {parseResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Live Preview List */}
              {previewItems.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem trước các ca học được nhận diện:</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-1.5 px-2.5">Thứ</th>
                          <th className="py-1.5 px-2.5">Thời gian</th>
                          <th className="py-1.5 px-2.5">Học sinh</th>
                          <th className="py-1.5 px-2.5">Môn & Khối</th>
                          <th className="py-1.5 px-2.5">Đơn giá</th>
                          <th className="py-1.5 px-2.5">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                        {previewItems.map((item, idx) => {
                          const dayObj = DAYS_OF_WEEK.find(d => d.id === item.day);
                          return (
                            <tr key={idx} className={`hover:bg-slate-50 ${item.isTrial ? 'bg-amber-50/50' : ''}`}>
                              <td className="py-1.5 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                                {dayObj ? dayObj.shortName : item.day}
                              </td>
                              <td className="py-1.5 px-2.5 font-mono whitespace-nowrap">
                                {item.startTime} - {item.endTime}
                              </td>
                              <td className="py-1.5 px-2.5 font-semibold whitespace-nowrap">
                                {item.student}
                              </td>
                              <td className="py-1.5 px-2.5 whitespace-nowrap">
                                {item.fullSubject || `${item.subject} ${item.grade}`}
                              </td>
                              <td className="py-1.5 px-2.5 whitespace-nowrap">
                                {item.isTrial ? (
                                  <span className="font-bold text-amber-700">0₫ (Học thử)</span>
                                ) : (
                                  `${(item.hourlyRate || 0).toLocaleString('vi-VN')}₫/h`
                                )}
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-500 truncate max-w-[150px]">
                                {item.notes || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
          
          <button
            type="button"
            onClick={handleApply}
            disabled={!parseResult || previewItems.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {importMode === 'replace'
                ? `Xoá Lịch Cũ & Cập Nhật ${previewItems.length} Ca Mới`
                : `Thêm ${previewItems.length} Ca Mới Vào Lịch`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
