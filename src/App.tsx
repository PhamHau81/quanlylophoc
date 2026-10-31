import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ReportForm } from './components/ReportForm';
import { PreviewCard } from './components/PreviewCard';
import { ConfigModal } from './components/ConfigModal';
import { HistoryModal } from './components/HistoryModal';
import { StandaloneExportModal } from './components/StandaloneExportModal';
import { ParentZaloModal } from './components/ParentZaloModal';
import { LuckyWheelModal } from './components/LuckyWheelModal';
import { ClassGamesModal } from './components/ClassGamesModal';
import { GroupLeaderboardModal } from './components/GroupLeaderboardModal';
import { AnalyticsDashboardModal } from './components/AnalyticsDashboardModal';
import { AwardCertificateModal } from './components/AwardCertificateModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { DocumentExportModal } from './components/DocumentExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { getStoredApiKey } from './utils/geminiService';
import {
  ClassConfig,
  ReportType,
  AbsentType,
  Student,
  ReportItem,
  UserRole,
} from './types';
import { DEFAULT_CONFIG, POPULAR_SCHOOLS } from './data/defaultData';
import {
  generateReportMessage,
  cleanPhoneNumber,
  getZaloLink,
  formatVietnameseDate,
} from './utils/zaloHelper';

const STORAGE_KEY_CONFIG = 'app_class_zalo_config';
const STORAGE_KEY_HISTORY = 'app_class_zalo_history';

export default function App() {
  // Class configuration loaded from LocalStorage
  const [config, setConfig] = useState<ClassConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.students)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading config from LocalStorage', e);
    }
    return DEFAULT_CONFIG;
  });

  // History records loaded from LocalStorage
  const [history, setHistory] = useState<ReportItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading history from LocalStorage', e);
    }
    return [];
  });

  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isParentZaloOpen, setIsParentZaloOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAwardOpen, setIsAwardOpen] = useState(false);
  const [awardStudentName, setAwardStudentName] = useState<string>('');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isDocExportOpen, setIsDocExportOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  // Current active operational role (Teacher / Student Leader)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('school_current_user_role');
      if (saved === 'TEACHER' || saved === 'STUDENT_LEADER') return saved;
    } catch {}
    return 'TEACHER'; // default homeroom teacher
  });

  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    try {
      localStorage.setItem('school_current_user_role', newRole);
      showToast(
        newRole === 'TEACHER'
          ? `Đã chuyển vai trò: GVCN (${config.teacherName}) - Toàn quyền gửi Zalo Phụ huynh`
          : `Đã chuyển vai trò: Ban cán sự (${config.reporterRole || 'Lớp trưởng'}) - Quyền báo cáo GVCN`,
        newRole === 'TEACHER' ? '👨‍🏫' : '🎓'
      );
    } catch {}
  };

  // Form State
  const [dateStr, setDateStr] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [period, setPeriod] = useState<string>('Tiết 1');
  const [subject, setSubject] = useState<string>('');
  const [reportType, setReportType] = useState<ReportType>('ABSENT');
  const [absentType, setAbsentType] = useState<AbsentType>('EXCUSED');
  const [violationTags, setViolationTags] = useState<string[]>([]);
  const [commendationTags, setCommendationTags] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  // Toast feedback state
  const [toast, setToast] = useState<{ visible: boolean; message: string; icon: string }>({
    visible: false,
    message: '',
    icon: '✅',
  });

  const showToast = (message: string, icon = '✅') => {
    setToast({ visible: true, message, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  // Danh sách trường người dùng đã tự nạp để gợi ý cho banner
  const [userCustomSchools, setUserCustomSchools] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('user_custom_schools');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Persist config whenever it changes
  const handleSaveConfig = (newConfig: ClassConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
      showToast('Đã lưu cấu hình lớp thành công!', '✅');
    } catch (e) {
      console.error('Failed to save config', e);
    }
  };

  // Persist history
  const saveHistory = (items: ReportItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  // Realtime calculated message
  const messageText = useMemo(() => {
    return generateReportMessage({
      config,
      reportType,
      absentType,
      selectedStudents,
      violationTags,
      commendationTags,
      customNote,
      dateStr,
      period,
      subject,
    });
  }, [
    config,
    reportType,
    absentType,
    selectedStudents,
    violationTags,
    commendationTags,
    customNote,
    dateStr,
    period,
    subject,
  ]);

  // Validation
  const validateForm = (): boolean => {
    if (selectedStudents.length === 0) {
      showToast('Vui lòng chọn ít nhất một học sinh trong danh sách!', '⚠️');
      return false;
    }
    if (
      reportType === 'VIOLATION' &&
      violationTags.length === 0 &&
      !customNote.trim()
    ) {
      showToast('Vui lòng chọn ít nhất 1 lỗi vi phạm hoặc nhập ghi chú!', '⚠️');
      return false;
    }
    if (
      reportType === 'COMMENDATION' &&
      commendationTags.length === 0 &&
      !customNote.trim()
    ) {
      showToast('Vui lòng chọn ít nhất 1 mục tuyên dương hoặc ghi chú!', '⚠️');
      return false;
    }
    if (!config.zaloPhone.trim()) {
      showToast('Vui lòng nhập Số Zalo của GVCN trong phần Cấu hình!', '⚠️');
      setIsConfigOpen(true);
      return false;
    }
    return true;
  };

  const createHistoryItem = (): ReportItem => {
    return {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      date: dateStr,
      dateDisplay: formatVietnameseDate(dateStr),
      period,
      subject,
      type: reportType,
      absentType: reportType === 'ABSENT' ? absentType : undefined,
      violationTags: reportType === 'VIOLATION' ? violationTags : [],
      commendationTags: reportType === 'COMMENDATION' ? commendationTags : [],
      customNote,
      students: selectedStudents,
      reporter: config.reporterName || 'Ban cán sự',
      teacherName: config.teacherName,
      className: config.className,
      schoolName: config.schoolName,
      formattedMessage: messageText,
    };
  };

  // Handle Send to Zalo
  const handleSendToZalo = () => {
    if (!validateForm()) return;

    // 1. Copy message automatically to clipboard
    navigator.clipboard.writeText(messageText).catch(() => {});

    // 2. Save to history
    const newItem = createHistoryItem();
    saveHistory([newItem, ...history]);

    // 3. Open Zalo chat
    const zaloUrl = getZaloLink(config.zaloPhone);
    showToast('Đã chép nội dung! Đang mở cửa sổ Zalo với GVCN...', '🚀');

    setTimeout(() => {
      window.open(zaloUrl, '_blank');
    }, 250);
  };

  // Handle Copy message
  const handleCopyText = () => {
    navigator.clipboard
      .writeText(messageText)
      .then(() => {
        showToast('Đã sao chép nội dung báo cáo vào Clipboard!', '📋');
      })
      .catch(() => {
        showToast('Lỗi khi sao chép. Vui lòng thử lại!', '❌');
      });
  };

  // Handle Save to history without opening Zalo
  const handleSaveToHistory = () => {
    if (!validateForm()) return;
    const newItem = createHistoryItem();
    saveHistory([newItem, ...history]);
    showToast('Đã lưu lượt báo cáo vào Nhật ký!', '💾');
  };

  // Handle Reset form
  const handleResetForm = () => {
    setSelectedStudents([]);
    setViolationTags([]);
    setCommendationTags([]);
    setCustomNote('');
    setSubject('');
    showToast('Đã làm mới biểu mẫu để nhập báo cáo tiếp theo!', '🔄');
  };

  // Delete single history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
  };

  // Update student parent phone inline and persist to config
  const handleUpdateStudentParentPhone = (studentId: string, newPhone: string) => {
    const updatedStudents = config.students.map((s) =>
      s.id === studentId ? { ...s, parentPhone: newPhone } : s
    );
    const newConfig = { ...config, students: updatedStudents };
    handleSaveConfig(newConfig);

    // Also update selectedStudents if present
    setSelectedStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, parentPhone: newPhone } : s))
    );
  };

  const handleOpenParentZaloModal = () => {
    if (selectedStudents.length === 0) {
      showToast('Vui lòng chọn ít nhất một học sinh để gửi báo cáo phụ huynh!', '⚠️');
      return;
    }
    if (
      reportType === 'VIOLATION' &&
      violationTags.length === 0 &&
      !customNote.trim()
    ) {
      showToast('Vui lòng chọn ít nhất 1 lỗi vi phạm hoặc ghi chú trước khi gửi!', '⚠️');
      return;
    }
    setIsParentZaloOpen(true);
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử báo cáo?')) {
      saveHistory([]);
      showToast('Đã xóa toàn bộ lịch sử.', '🗑️');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased flex flex-col pb-16">
      {/* Header Bar */}
      <Header
        config={config}
        historyCount={history.length}
        hasApiKey={Boolean(getStoredApiKey())}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenLuckyWheel={() => setIsWheelOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenAward={() => {
          setAwardStudentName('');
          setIsAwardOpen(true);
        }}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenDocExport={() => setIsDocExportOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 w-full flex-1">
        {/* Welcome / Quick status banner */}
        <div className="mb-5 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              📢
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Báo cáo nề nếp học sinh - Gửi Zalo GVCN
              </h2>
              <p className="text-xs text-slate-500">
                Ghi nhận nhanh vắng học, vi phạm nội quy và tạo tin nhắn chuẩn mực gửi thẳng đến Zalo Giáo viên chủ nhiệm.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tên trường học - Cho phép người dùng tự nạp trực tiếp hoặc chọn gợi ý */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50/90 rounded-xl border border-blue-200/80 text-xs shadow-xs">
              <span className="font-bold text-blue-900 flex items-center gap-1 shrink-0">
                <span>🏫</span> Trường:
              </span>
              <input
                type="text"
                list="banner-school-suggestions"
                value={config.schoolName}
                onChange={(e) => {
                  const val = e.target.value;
                  handleSaveConfig({ ...config, schoolName: val });
                }}
                onBlur={() => {
                  if (config.schoolName.trim()) {
                    try {
                      if (!POPULAR_SCHOOLS.includes(config.schoolName) && !userCustomSchools.includes(config.schoolName)) {
                        const updated = [config.schoolName, ...userCustomSchools].slice(0, 20);
                        setUserCustomSchools(updated);
                        localStorage.setItem('user_custom_schools', JSON.stringify(updated));
                      }
                    } catch {}
                  }
                }}
                placeholder="Tự nhập tên trường..."
                className="bg-white/90 hover:bg-white focus:bg-white px-2 py-0.5 rounded-lg border border-blue-300 font-bold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500 w-[140px] sm:w-[220px] transition text-xs"
                title="Người dùng có thể tự gõ tên bất kỳ trường nào hoặc chọn từ gợi ý"
              />
              <datalist id="banner-school-suggestions">
                {userCustomSchools.map((s) => (
                  <option key={`banner-custom-${s}`} value={s}>
                    ⭐ {s}
                  </option>
                ))}
                {POPULAR_SCHOOLS.map((s) => (
                  <option key={`banner-pop-${s}`} value={s} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => setIsConfigOpen(true)}
                className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100/60 rounded-md transition cursor-pointer"
                title="Mở cấu hình trường lớp chi tiết"
              >
                ✏️
              </button>
            </div>

            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-xs text-slate-700 hover:text-blue-700 font-semibold px-3 py-1.5 bg-white hover:bg-slate-50 rounded-xl transition cursor-pointer border border-slate-200 shadow-xs"
              title="Cài đặt tên lớp hoặc danh sách học sinh"
            >
              Lớp: <strong className="text-blue-700">{config.className || 'Chưa đặt'}</strong> ({config.students.length} bạn)
            </button>

            {/* Active Operational Role Selector (Teacher vs Student Leader) */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <span className="font-bold text-slate-500 pl-2 pr-1 flex items-center gap-1">
                <span>👤</span> Vai trò:
              </span>
              <button
                type="button"
                onClick={() => handleRoleChange('TEACHER')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  userRole === 'TEACHER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Giáo viên chủ nhiệm: Toàn quyền gửi Zalo GVCN & gửi Zalo cho từng Phụ huynh"
              >
                <span>👨‍🏫</span>
                <span>GVCN {config.teacherName ? `(${config.teacherName})` : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('STUDENT_LEADER')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  userRole === 'STUDENT_LEADER'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Ban cán sự lớp: Chỉ gửi báo cáo cho GVCN duyệt, không được gửi Zalo cho phụ huynh"
              >
                <span>🎓</span>
                <span>Ban cán sự</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Student selector */}
          <div className="lg:col-span-7">
            <ReportForm
              config={config}
              dateStr={dateStr}
              setDateStr={setDateStr}
              period={period}
              setPeriod={setPeriod}
              subject={subject}
              setSubject={setSubject}
              reportType={reportType}
              setReportType={setReportType}
              absentType={absentType}
              setAbsentType={setAbsentType}
              violationTags={violationTags}
              setViolationTags={setViolationTags}
              commendationTags={commendationTags}
              setCommendationTags={setCommendationTags}
              customNote={customNote}
              setCustomNote={setCustomNote}
              selectedStudents={selectedStudents}
              setSelectedStudents={setSelectedStudents}
              onOpenConfig={() => setIsConfigOpen(true)}
            />
          </div>

          {/* Right Column: Real-time Zalo Preview & Direct Action */}
          <div className="lg:col-span-5">
            <PreviewCard
              config={config}
              messageText={messageText}
              hasStudentsSelected={selectedStudents.length > 0}
              selectedStudentsCount={selectedStudents.length}
              userRole={userRole}
              onSendToZalo={handleSendToZalo}
              onOpenParentZaloModal={handleOpenParentZaloModal}
              onRequestTeacherPermission={() => setIsPermissionModalOpen(true)}
              onCopyText={handleCopyText}
              onSaveToHistory={handleSaveToHistory}
              onResetForm={handleResetForm}
              onOpenConfig={() => setIsConfigOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* MODALS */}
      <ParentZaloModal
        isOpen={isParentZaloOpen}
        onClose={() => setIsParentZaloOpen(false)}
        config={config}
        userRole={userRole}
        selectedStudents={selectedStudents}
        reportType={reportType}
        absentType={absentType}
        violationTags={violationTags}
        commendationTags={commendationTags}
        customNote={customNote}
        dateStr={dateStr}
        period={period}
        subject={subject}
        onUpdateStudentParentPhone={handleUpdateStudentParentPhone}
        onShowToast={showToast}
      />

      {/* MODAL: XÁC THỰC QUYỀN GVCN KHI GỬI PHỤ HUYNH */}
      {isPermissionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mx-auto shadow-inner">
              🔒
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">
                Chỉ GVCN Mới Được Quyền Gửi Zalo Cho Phụ Huynh
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Theo quy định quản lý nề nếp, <strong>chỉ Giáo viên chủ nhiệm (Thầy {config.teacherName})</strong> mới có thẩm quyền gửi thông báo trực tiếp đến Phụ huynh. Ban cán sự lớp chỉ có quyền lập báo cáo gửi về cho GVCN duyệt.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed text-center font-medium">
              Bạn có phải là <strong>Thầy {config.teacherName}</strong> (GVCN lớp {config.className}) không?
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleRoleChange('TEACHER');
                  setIsPermissionModalOpen(false);
                  setIsParentZaloOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>👨‍🏫 Tôi là Thầy {config.teacherName} (Chuyển quyền GVCN)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPermissionModalOpen(false)}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Tôi là Ban cán sự (Đã hiểu &amp; Đóng)
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        config={config}
        onClearHistory={handleClearHistory}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onShowToast={showToast}
      />

      <StandaloneExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onShowToast={showToast}
      />

      <ClassGamesModal
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
        students={config.students}
        onShowToast={showToast}
      />

      <AnalyticsDashboardModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        config={config}
        history={history}
        onShowToast={showToast}
        onOpenAward={(name) => {
          setAwardStudentName(name);
          setIsAwardOpen(true);
        }}
      />

      <AwardCertificateModal
        isOpen={isAwardOpen}
        onClose={() => setIsAwardOpen(false)}
        config={config}
        initialStudentName={awardStudentName}
        onShowToast={showToast}
      />

      <GroupLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        config={config}
        history={history}
        onShowToast={showToast}
      />

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        config={config}
        history={history}
        onShowToast={showToast}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
      />

      <DocumentExportModal
        isOpen={isDocExportOpen}
        onClose={() => setIsDocExportOpen(false)}
        config={config}
        history={history}
        onShowToast={showToast}
      />

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        onShowToast={showToast}
      />

      {/* FLOATING TOAST NOTIFICATION */}
      <div
        className={`fixed bottom-5 right-5 z-50 transform transition-all duration-300 pointer-events-none max-w-sm ${
          toast.visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-12 opacity-0 scale-95'
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700/80">
          <span className="text-base">{toast.icon}</span>
          <span className="font-medium text-slate-100">{toast.message}</span>
        </div>
      </div>
    </div>
  );
}
