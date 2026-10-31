import React, { useRef, useState, useEffect } from 'react';
import { X, Award, Download, Copy, Sparkles, Check, RefreshCw } from 'lucide-react';
import { ClassConfig, Student } from '../types';

interface AwardCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  initialStudentName?: string;
  onShowToast: (msg: string, icon?: string) => void;
}

const AWARD_TITLES = [
  {
    id: 'GOOD_DEED',
    title: 'GƯƠNG HỌC SINH RÈN LUYỆN XUẤT SẮC',
    reason: 'Đã có thành tích xuất sắc trong việc thực hiện nề nếp, chuyên cần và phong trào thi đua của lớp.',
  },
  {
    id: 'TOP_SCORE',
    title: 'HOA ĐIỂM 10 & CHĂM NGOAN HỌC TỐT',
    reason: 'Đã đạt nhiều điểm giỏi, tích cực phát biểu xây dựng bài và luôn gương mẫu trong học tập.',
  },
  {
    id: 'LEADERSHIP',
    title: 'CÁN SỰ LỚP GƯƠNG MẪU & TRÁCH NHIỆM',
    reason: 'Đã hoàn thành xuất sắc nhiệm vụ được giao, nhiệt tình hỗ trợ thầy cô và bạn bè trong tập thể lớp.',
  },
  {
    id: 'PROGRESS',
    title: 'HỌC SINH CÓ TIẾN BỘ VƯỢT BẬC',
    reason: 'Đã có sự nỗ lực rèn luyện vượt bậc, khắc phục khó khăn và đạt nhiều chuyển biến tích cực.',
  },
];

export const AwardCertificateModal: React.FC<AwardCertificateModalProps> = ({
  isOpen,
  onClose,
  config,
  initialStudentName,
  onShowToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(config.students[0]?.id || '');
  const [selectedAward, setSelectedAward] = useState<string>('GOOD_DEED');
  const [customReason, setCustomReason] = useState<string>('');
  const [certificateTheme, setCertificateTheme] = useState<'GOLD' | 'BLUE'>('GOLD');

  useEffect(() => {
    if (initialStudentName) {
      const match = config.students.find((s) => s.name === initialStudentName);
      if (match) setSelectedStudentId(match.id);
    }
  }, [initialStudentName, config.students]);

  const currentStudent = config.students.find((s) => s.id === selectedStudentId) || config.students[0];
  const awardObj = AWARD_TITLES.find((a) => a.id === selectedAward) || AWARD_TITLES[0];

  // Draw Certificate to Canvas
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions: High Res 1200x800 for crisp export
    canvas.width = 1200;
    canvas.height = 800;

    // Background
    ctx.fillStyle = certificateTheme === 'GOLD' ? '#fffdf0' : '#f8faff';
    ctx.fillRect(0, 0, 1200, 800);

    // Decorative Borders
    const primaryColor = certificateTheme === 'GOLD' ? '#b45309' : '#1e40af';
    const accentColor = certificateTheme === 'GOLD' ? '#d97706' : '#3b82f6';

    // Outer Border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 1140, 740);

    // Inner Thin Border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, 1104, 704);

    // Corner Ornaments
    const drawCorner = (x: number, y: number) => {
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCorner(48, 48);
    drawCorner(1152, 48);
    drawCorner(48, 752);
    drawCorner(1152, 752);

    // School Name & Header
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Times New Roman", serif';
    ctx.fillStyle = '#334155';
    ctx.fillText((config.schoolName || 'TRƯỜNG TRUNG HỌC PHỔ THÔNG').toUpperCase(), 600, 100);

    ctx.font = 'bold 16px "Times New Roman", serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`LỚP: ${config.className} • NĂM HỌC 2025 - 2026`, 600, 130);

    // Divider Line
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(450, 150);
    ctx.lineTo(750, 150);
    ctx.stroke();

    // Certificate Main Title
    ctx.font = 'bold 44px "Times New Roman", serif';
    ctx.fillStyle = primaryColor;
    ctx.fillText('THƯ KHEN BIỂU DƯƠNG', 600, 220);

    ctx.font = 'italic 20px "Times New Roman", serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Giáo viên chủ nhiệm trân trọng tuyên dương em:', 600, 265);

    // Student Name (Highlight)
    ctx.font = 'bold 48px "Times New Roman", serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(currentStudent?.name || 'HỌC SINH', 600, 340);

    // Student Meta (STT, Group)
    ctx.font = 'bold 18px "Times New Roman", serif';
    ctx.fillStyle = '#64748b';
    const groupText = currentStudent?.group ? ` • Tổ ${currentStudent.group}` : '';
    const roleText = currentStudent?.role && currentStudent.role !== 'Thành viên' ? ` (${currentStudent.role})` : '';
    ctx.fillText(`Học sinh Lớp ${config.className}${groupText}${roleText}`, 600, 380);

    // Award Category Title
    ctx.fillStyle = certificateTheme === 'GOLD' ? '#92400e' : '#1d4ed8';
    ctx.font = 'bold 26px "Times New Roman", serif';
    ctx.fillText(`DANH HIỆU: ${awardObj.title}`, 600, 450);

    // Commendation Content / Reason
    ctx.font = 'italic 21px "Times New Roman", serif';
    ctx.fillStyle = '#334155';
    const reasonText = customReason.trim() || awardObj.reason;

    // Wrap text for reason
    const maxWidth = 900;
    const words = reasonText.split(' ');
    let line = '';
    let y = 510;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, 600, y);
        line = words[n] + ' ';
        y += 32;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 600, y);

    // Date & Signature Section
    const now = new Date();
    const dateStr = `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

    ctx.font = 'italic 18px "Times New Roman", serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(dateStr, 900, 640);

    ctx.font = 'bold 20px "Times New Roman", serif';
    ctx.fillStyle = primaryColor;
    ctx.fillText('GIÁO VIÊN CHỦ NHIỆM', 900, 670);

    ctx.font = 'bold 24px "Times New Roman", serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(config.teacherName || 'Phạm Hậu', 900, 740);

    // Certified Stamp (Mộc tròn đồ họa)
    ctx.save();
    ctx.translate(300, 680);
    ctx.rotate(-0.1);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.fillText('★ KHEN THƯỞNG ★', 0, -12);
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('ĐÃ DUYỆT', 0, 10);
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText(config.className, 0, 26);
    ctx.restore();
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(renderCanvas, 100);
    }
  }, [isOpen, selectedStudentId, selectedAward, customReason, certificateTheme]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Thu_Khen_${currentStudent?.name?.replace(/\s+/g, '_') || 'HocSinh'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('Đã tải xuống Thư khen (.png) độ phân giải cao!', '🎉');
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        onShowToast('Đã sao chép ảnh Giấy khen vào Clipboard! Bạn có thể dán (Ctrl+V) vào Zalo ngay.', '📋');
      });
    } catch {
      onShowToast('Trình duyệt chưa hỗ trợ sao chép ảnh trực tiếp, bạn hãy dùng nút Tải Ảnh.', 'ℹ️');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              🏅
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Tạo Thư Khen &amp; Giấy Khen Điện Tử
              </h3>
              <p className="text-xs text-amber-100">
                Thiết kế nghệ thuật số (Algorithmic Art) • Xuất ảnh PNG sắc nét gửi Zalo Phụ huynh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Controls Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            {/* Student Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1. Chọn học sinh khen thưởng:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 outline-hidden"
              >
                {config.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    STT {s.stt} - {s.name} {s.group ? `(Tổ ${s.group})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Award Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. Danh hiệu tuyên dương:
              </label>
              <select
                value={selectedAward}
                onChange={(e) => {
                  setSelectedAward(e.target.value);
                  const matched = AWARD_TITLES.find((a) => a.id === e.target.value);
                  if (matched) setCustomReason(matched.reason);
                }}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 outline-hidden"
              >
                {AWARD_TITLES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Style */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                3. Phong cách viền hoa văn:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCertificateTheme('GOLD')}
                  className={`flex-1 py-2 px-2.5 rounded-xl font-bold border transition ${
                    certificateTheme === 'GOLD'
                      ? 'bg-amber-100 border-amber-500 text-amber-900'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  ⚜️ Hoàng Gia Vàng
                </button>
                <button
                  type="button"
                  onClick={() => setCertificateTheme('BLUE')}
                  className={`flex-1 py-2 px-2.5 rounded-xl font-bold border transition ${
                    certificateTheme === 'BLUE'
                      ? 'bg-blue-100 border-blue-500 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  🏛️ Giáo Dục Xanh
                </button>
              </div>
            </div>

            {/* Custom commendation reason */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nội dung lời khen của Thầy/Cô (Có thể chỉnh sửa theo ý muốn):
              </label>
              <input
                type="text"
                value={customReason || awardObj.reason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white outline-hidden"
                placeholder="Ghi rõ thành tích xuất sắc của học sinh..."
              />
            </div>
          </div>

          {/* Canvas Preview Container */}
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
            <div className="w-full overflow-x-auto flex justify-center py-2">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto rounded-lg shadow-2xl border border-slate-700"
                style={{ maxHeight: '420px', aspectRatio: '1200 / 800' }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Bản xem trước kích thước chuẩn (Tỉ lệ 3:2 • Độ phân giải cao 1200 x 800px)
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Học sinh: <strong className="text-slate-800">{currentStudent?.name}</strong> (Lớp {config.className})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyImage}
              className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Copy className="w-4 h-4 text-blue-600" />
              <span>Chép Ảnh Vào Clipboard</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              className="py-2.5 px-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải Ảnh Giấy Khen (.png)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
