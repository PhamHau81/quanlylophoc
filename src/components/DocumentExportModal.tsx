import React, { useState } from 'react';
import { X, FileText, Presentation, Download, ExternalLink, Calendar, MapPin, User, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { ClassConfig, ReportItem, Student } from '../types';
import { generateWordDocument, openPresentationViewer, SlideItem, triggerFileDownload, generatePowerPointPresentation } from '../utils/documentGenerator';

interface DocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  history: ReportItem[];
  onShowToast: (msg: string, icon?: string) => void;
}

export const DocumentExportModal: React.FC<DocumentExportModalProps> = ({
  isOpen,
  onClose,
  config,
  history,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'DOCX' | 'SLIDES'>('DOCX');
  
  // Word doc form state
  const [docType, setDocType] = useState<'INVITATION' | 'VIOLATION' | 'SUMMARY_REPORT'>('INVITATION');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(config.students[0]?.id || '');
  const [meetingTime, setMeetingTime] = useState<string>('08 giờ 30 phút, sáng Thứ Bảy tuần này');
  const [meetingLocation, setMeetingLocation] = useState<string>(`Phòng học lớp ${config.className}`);
  const [customReason, setCustomReason] = useState<string>('Trao đổi tình hình nề nếp chuyên cần và ý thức học tập của học sinh.');
  const [isExportingPptx, setIsExportingPptx] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentStudent = config.students.find((s) => s.id === selectedStudentId);

  const handleExportWord = () => {
    try {
      generateWordDocument(docType, {
        config,
        student: currentStudent,
        reason: customReason,
        meetingTime,
        meetingLocation,
        history,
      });
      onShowToast('Đã tải xuống văn bản Word chuẩn thể thức!', '📄');
    } catch (e) {
      onShowToast('Có lỗi khi tạo văn bản Word.', '⚠️');
    }
  };

  const handleDownloadPptx = async (slideType: 'PARENT' | 'CLASS') => {
    try {
      setIsExportingPptx(true);
      onShowToast('Đang tạo file PowerPoint (.pptx)...', '⏳');
      await generatePowerPointPresentation(slideType, { config, history });
      onShowToast('Đã tải xuống file PowerPoint (.pptx) thành công!', '🎉');
    } catch (err: any) {
      console.error(err);
      onShowToast(err?.message || 'Lỗi khi tạo file PowerPoint.', '❌');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleLaunchSlides = (slideType: 'PARENT' | 'CLASS') => {
    const title = slideType === 'PARENT' 
      ? `HỌP PHỤ HUYNH LỚP ${config.className} - GVCN: ${config.teacherName}`
      : `SINH HOẠT LỚP TUẦN - LỚP ${config.className} - GVCN: ${config.teacherName}`;

    // Calculate quick stats
    const totalViolations = history.filter(h => h.type === 'VIOLATION').length;
    const totalCommendations = history.filter(h => h.type === 'COMMENDATION').length;
    const totalAbsents = history.filter(h => h.type === 'ABSENT').length;

    let slides: SlideItem[] = [];

    if (slideType === 'PARENT') {
      slides = [
        {
          tag: 'HỘI NGHỊ BAN ĐẠI DIỆN CHA MẸ HỌC SINH',
          title: `HỌP PHỤ HUYNH LỚP ${config.className}`,
          subtitle: `${config.schoolName} • Giáo viên chủ nhiệm: ${config.teacherName}`,
          contentHtml: `
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div class="bg-blue-950/60 p-5 rounded-2xl border border-blue-700/50 text-center">
                <div class="text-3xl font-extrabold text-blue-400">${config.students.length}</div>
                <div class="text-xs uppercase text-slate-300 font-bold mt-1">Sĩ số lớp</div>
              </div>
              <div class="bg-emerald-950/60 p-5 rounded-2xl border border-emerald-700/50 text-center">
                <div class="text-3xl font-extrabold text-emerald-400">+${totalCommendations}</div>
                <div class="text-xs uppercase text-slate-300 font-bold mt-1">Lượt khen thưởng</div>
              </div>
              <div class="bg-amber-950/60 p-5 rounded-2xl border border-amber-700/50 text-center">
                <div class="text-3xl font-extrabold text-amber-400">4 Tổ</div>
                <div class="text-xs uppercase text-slate-300 font-bold mt-1">Thi đua nề nếp</div>
              </div>
            </div>
            <p class="text-slate-300 mt-6 text-center italic">
              "Sự gắn kết chặt chẽ giữa gia đình và nhà trường là chìa khóa vàng cho sự trưởng thành của con trẻ."
            </p>
          `,
        },
        {
          tag: 'TÌNH HÌNH CHUNG',
          title: 'ĐÁNH GIÁ NỀ NẾP & CHUYÊN CẦN',
          subtitle: 'Ghi nhận khách quan, minh bạch qua hệ thống quản lý lớp học',
          contentHtml: `
            <div class="space-y-4">
              <div class="p-4 bg-emerald-950/40 rounded-xl border border-emerald-600/40">
                <h4 class="font-bold text-emerald-300 text-base flex items-center gap-2">🌟 Ưu điểm nổi bật:</h4>
                <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-300 text-sm">
                  <li>Đại đa số học sinh chấp hành nghiêm chỉnh nội quy trang phục, chào hỏi lễ phép.</li>
                  <li>Tập thể đoàn kết, tích cực tham gia các phong trào thi đua của trường.</li>
                  <li>Nhiều cá nhân đạt điểm 10 và hăng hái xây dựng bài trong các giờ học.</li>
                </ul>
              </div>
              <div class="p-4 bg-amber-950/40 rounded-xl border border-amber-600/40">
                <h4 class="font-bold text-amber-300 text-base flex items-center gap-2">⚠️ Điểm cần lưu ý & Khắc phục:</h4>
                <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-300 text-sm">
                  <li>Vẫn còn một số bạn vào lớp muộn vào các tiết 1 đầu tuần.</li>
                  <li>Cần nhắc nhở ý thức chuẩn bị bài cũ và tự giác làm bài tập về nhà.</li>
                  <li>Hạn chế mang đồ ăn vặt và sử dụng điện thoại khi chưa có yêu cầu của giáo viên.</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          tag: 'KẾT NỐI & PHỐI HỢP',
          title: 'PHƯƠNG HƯỚNG & BIỆN PHÁP PHỐI HỢP',
          subtitle: 'Kính mong Quý Phụ huynh cùng chung tay đồng hành',
          contentHtml: `
            <div class="space-y-3">
              <div class="p-4 bg-slate-900 rounded-xl border border-slate-700">
                <strong class="text-blue-400 block mb-1">1. Quản lý thời gian học tập tại nhà:</strong>
                <p class="text-sm text-slate-300">Đôn đốc các con chuẩn bị sách vở, đồ dùng học tập từ tối hôm trước để tránh quên bài hoặc đi muộn.</p>
              </div>
              <div class="p-4 bg-slate-900 rounded-xl border border-slate-700">
                <strong class="text-blue-400 block mb-1">2. Giữ liên lạc thường xuyên qua Zalo:</strong>
                <p class="text-sm text-slate-300">GVCN và Ban cán sự sẽ cập nhật tình hình vắng học hoặc biểu dương trực tiếp qua tin nhắn Zalo đến từng phụ huynh.</p>
              </div>
              <div class="p-4 bg-slate-900 rounded-xl border border-slate-700">
                <strong class="text-blue-400 block mb-1">3. Kênh liên hệ với Thầy Phạm Hậu:</strong>
                <p class="text-sm text-slate-300">Số điện thoại / Zalo: <strong>${config.zaloPhone || '0988123456'}</strong>. Thầy luôn sẵn sàng lắng nghe mọi chia sẻ từ gia đình.</p>
              </div>
            </div>
          `,
        },
      ];
    } else {
      slides = [
        {
          tag: 'TIẾT SINH HOẠT LỚP',
          title: `SINH HOẠT LỚP ${config.className}`,
          subtitle: `Chủ trì: Thầy ${config.teacherName} • Báo cáo: ${config.reporterName} (${config.reporterRole})`,
          contentHtml: `
            <div class="text-center p-6 bg-blue-950/40 rounded-2xl border border-blue-700/40 mt-4">
              <h3 class="text-xl font-bold text-blue-300 mb-2">MỤC TIÊU TIẾT SINH HOẠT</h3>
              <p class="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
                1. Sơ kết công tác nề nếp và học tập tuần qua.<br/>
                2. Vinh danh các Tổ xuất sắc và cá nhân tiêu biểu.<br/>
                3. Đóng góp ý kiến và triển khai kế hoạch tuần tới.
              </p>
            </div>
          `,
        },
        {
          tag: 'TỔNG KẾT THI ĐUA',
          title: 'KẾT QUẢ THI ĐUA NỀ NẾP CÁC TỔ',
          subtitle: 'Dựa trên hệ thống tính điểm tự động của lớp',
          contentHtml: `
            <div class="grid grid-cols-2 gap-4 mt-2">
              <div class="p-4 bg-slate-900 rounded-xl border border-slate-700 text-center">
                <div class="text-lg font-bold text-amber-400">TỔ 1</div>
                <div class="text-xs text-slate-400 mt-1">Nề nếp ổn định • Trực nhật tốt</div>
              </div>
              <div class="p-4 bg-slate-900 rounded-xl border border-slate-700 text-center">
                <div class="text-lg font-bold text-blue-400">TỔ 2</div>
                <div class="text-xs text-slate-400 mt-1">Phát biểu sôi nổi • Đoàn kết</div>
              </div>
              <div class="p-4 bg-slate-900 rounded-xl border border-slate-700 text-center">
                <div class="text-lg font-bold text-emerald-400">TỔ 3</div>
                <div class="text-xs text-slate-400 mt-1">Nhiều điểm 10 • Chuyên cần cao</div>
              </div>
              <div class="p-4 bg-slate-900 rounded-xl border border-slate-700 text-center">
                <div class="text-lg font-bold text-purple-400">TỔ 4</div>
                <div class="text-xs text-slate-400 mt-1">Cố gắng khắc phục các lỗi muộn giờ</div>
              </div>
            </div>
          `,
        },
        {
          tag: 'KẾ HOẠCH TUẦN TỚI',
          title: 'NHIỆM VỤ TRỌNG TÂM TUẦN MỚI',
          subtitle: `Thông điệp từ Giáo viên chủ nhiệm: ${config.teacherName}`,
          contentHtml: `
            <div class="p-5 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 rounded-2xl border border-blue-700/50 space-y-3">
              <div class="flex items-center gap-2 text-white font-bold text-sm">
                <span>✅</span> 100% học sinh đi học đúng giờ, sơ vin chỉnh tề, đeo phù hiệu.
              </div>
              <div class="flex items-center gap-2 text-white font-bold text-sm">
                <span>✅</span> Chuẩn bị bài đầy đủ, chấm dứt tình trạng không làm bài tập về nhà.
              </div>
              <div class="flex items-center gap-2 text-white font-bold text-sm">
                <span>✅</span> Giữ gìn vệ sinh lớp học, tắt điện và khóa cửa sổ khi ra về.
              </div>
            </div>
            <p class="text-center text-blue-300 font-extrabold text-lg mt-6">
              "CHÚC CẢ LỚP MỘT TUẦN HỌC MỚI ĐẦY NĂNG LƯỢNG VÀ THÀNH CÔNG!"
            </p>
          `,
        },
      ];
    }

    openPresentationViewer(title, slides);
    onShowToast(`Đã mở trình chiếu slide ${slideType === 'PARENT' ? 'Họp Phụ Huynh' : 'Sinh Hoạt Lớp'}!`, '📽️');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              📂
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Xuất Văn Bản Word (.doc) & Slide Thuyết Trình
              </h3>
              <p className="text-xs text-blue-100">
                Tự động tạo Giấy mời, Biên bản kỷ luật và Slide Họp Phụ huynh / Sinh hoạt lớp
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

        {/* Tab Selection */}
        <div className="px-5 pt-3 border-b border-slate-200 flex gap-4 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('DOCX')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'DOCX'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Văn bản Word (.doc)</span>
          </button>

          <button
            onClick={() => setActiveTab('SLIDES')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'SLIDES'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>Slide Trình Chiếu</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'DOCX' ? (
            <div className="space-y-4">
              {/* Select Document Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn mẫu văn bản cần tạo:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocType('INVITATION')}
                    className={`p-3 rounded-xl border text-left transition ${
                      docType === 'INVITATION'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base mb-1">📩</div>
                    <div className="font-bold">Giấy Mời Phụ Huynh</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Gặp mặt trao đổi nề nếp</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocType('VIOLATION')}
                    className={`p-3 rounded-xl border text-left transition ${
                      docType === 'VIOLATION'
                        ? 'border-rose-600 bg-rose-50/80 text-rose-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base mb-1">📋</div>
                    <div className="font-bold">Biên Bản Kỷ Luật</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Kèm bản cam kết rèn luyện</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocType('SUMMARY_REPORT')}
                    className={`p-3 rounded-xl border text-left transition ${
                      docType === 'SUMMARY_REPORT'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base mb-1">📊</div>
                    <div className="font-bold">Báo Cáo Tổng Hợp</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Toàn bộ nề nếp đã lưu</div>
                  </button>
                </div>
              </div>

              {/* Student selection (if applicable) */}
              {docType !== 'SUMMARY_REPORT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn học sinh áp dụng:
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
                  >
                    {config.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        STT {s.stt} - {s.name} {s.group ? `(Tổ ${s.group})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Invitation fields */}
              {docType === 'INVITATION' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Thời gian mời:
                    </label>
                    <input
                      type="text"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                      placeholder="VD: 08 giờ 30 phút ngày..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Địa điểm:
                    </label>
                    <input
                      type="text"
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                      placeholder="VD: Phòng học lớp..."
                    />
                  </div>
                </div>
              )}

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung / Lý do cụ thể:
                </label>
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="Ghi rõ nội dung sự việc hoặc lý do cần mời..."
                />
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExportWord}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Xuống File Word (.doc) Chuẩn Thể Thức</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200/80 rounded-2xl text-indigo-900 leading-relaxed">
                <strong>💡 Trình chiếu tương tác thời gian thực:</strong> Tạo slide tức thời mang thương hiệu <strong>Lớp {config.className} - GVCN: {config.teacherName}</strong>. Bạn có thể bấm để trình chiếu toàn màn hình trực tiếp trên máy tính hoặc máy chiếu của lớp!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Parent Meeting Slides */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-3xl mb-2">👨‍👩‍👧‍👦</div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Slide Họp Phụ Huynh Học Sinh
                    </h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Báo cáo tình hình nề nếp, chuyên cần, ưu điểm và giải pháp phối hợp giữa gia đình và nhà trường.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={isExportingPptx}
                      onClick={() => handleDownloadPptx('PARENT')}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      {isExportingPptx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>Tải File PowerPoint (.pptx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchSlides('PARENT')}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Presentation className="w-4 h-4 text-blue-600" />
                      <span>Trình Chiếu Trên Trình Duyệt</span>
                    </button>
                  </div>
                </div>

                {/* Class Meeting Slides */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-3xl mb-2">🏫</div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Slide Sinh Hoạt Lớp Hàng Tuần
                    </h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Sơ kết thi đua các Tổ (Tổ 1 - Tổ 4), tuyên dương cá nhân tiêu biểu và giao nhiệm vụ trọng tâm tuần mới.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={isExportingPptx}
                      onClick={() => handleDownloadPptx('CLASS')}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      {isExportingPptx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>Tải File PowerPoint (.pptx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchSlides('CLASS')}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Presentation className="w-4 h-4 text-emerald-600" />
                      <span>Trình Chiếu Trên Trình Duyệt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
