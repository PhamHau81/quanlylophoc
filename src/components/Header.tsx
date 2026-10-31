import React, { useState } from 'react';
import {
  Settings,
  History,
  Download,
  School,
  UserCheck,
  Trophy,
  Sparkles,
  FileText,
  Key,
  BarChart3,
  Award,
  Gamepad2,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { ClassConfig } from '../types';

interface HeaderProps {
  config: ClassConfig;
  historyCount: number;
  hasApiKey: boolean;
  onOpenConfig: () => void;
  onOpenHistory: () => void;
  onOpenExport: () => void;
  onOpenLuckyWheel: () => void;
  onOpenLeaderboard: () => void;
  onOpenAIAssistant: () => void;
  onOpenDocExport: () => void;
  onOpenApiKey: () => void;
  onOpenAnalytics: () => void;
  onOpenAward: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  historyCount,
  hasApiKey,
  onOpenConfig,
  onOpenHistory,
  onOpenExport,
  onOpenLuckyWheel,
  onOpenLeaderboard,
  onOpenAIAssistant,
  onOpenDocExport,
  onOpenApiKey,
  onOpenAnalytics,
  onOpenAward,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand / Class Info */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-lg sm:text-xl shadow-inner border border-white/20 shrink-0">
            <School className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-base font-extrabold tracking-tight text-white leading-tight truncate">
                QUẢN LÝ LỚP CHỦ NHIỆM
              </h1>
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-400/25 text-emerald-200 border border-emerald-400/30 shrink-0">
                Lớp {config.className || 'Chưa đặt'}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-blue-100 flex items-center gap-1.5 sm:gap-2 font-medium mt-0.5 truncate">
              <span className="truncate max-w-[150px] sm:max-w-none">{config.schoolName || 'Chưa cấu hình trường'}</span>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-blue-300 shrink-0"></span>
              <span className="hidden sm:flex items-center gap-1 shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                GVCN: <strong className="text-white">{config.teacherName || 'Chưa cấu hình'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Quick Nav Items */}
        <div className="hidden xl:flex items-center gap-1.5">
          {/* NÚT CẤU HÌNH LỚP HỌC (Ưu tiên số 1 - To rõ ràng) */}
          <button
            type="button"
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-blue-800 hover:bg-blue-50 active:scale-95 rounded-xl shadow-sm transition border border-white/40 cursor-pointer"
            title="Cài đặt thông tin Lớp học, Trường học, GVCN & Danh sách học sinh"
          >
            <Settings className="w-3.5 h-3.5 text-blue-700 animate-spin-slow" />
            <span>Cấu hình lớp</span>
          </button>

          {/* Trò chơi */}
          <button
            type="button"
            onClick={onOpenLuckyWheel}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-amber-500/25 hover:bg-amber-500/40 text-amber-100 rounded-lg backdrop-blur transition border border-amber-400/40 cursor-pointer"
            title="Khu trò chơi: Vòng quay, Hộp quà bí mật & Quiz"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Trò chơi</span>
          </button>

          {/* Thi đua */}
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-100 rounded-lg backdrop-blur transition border border-indigo-400/40 cursor-pointer"
            title="Bảng thi đua nề nếp 4 Tổ"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-300" />
            <span>Thi đua</span>
          </button>

          {/* Biểu đồ D3 */}
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-blue-500/30 hover:bg-blue-500/45 text-blue-100 rounded-lg backdrop-blur transition border border-blue-400/40 cursor-pointer"
            title="Biểu đồ phân tích nề nếp trực quan D3"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Biểu đồ D3</span>
          </button>

          {/* Thư khen */}
          <button
            type="button"
            onClick={onOpenAward}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-500/30 hover:bg-emerald-500/45 text-emerald-100 rounded-lg backdrop-blur transition border border-emerald-400/40 cursor-pointer"
            title="Tạo Thư khen & Giấy khen điện tử"
          >
            <Award className="w-3.5 h-3.5 text-yellow-300" />
            <span>Thư khen</span>
          </button>

          {/* AI Chủ nhiệm */}
          <button
            type="button"
            onClick={onOpenAIAssistant}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-purple-500/30 hover:bg-purple-500/45 text-purple-100 rounded-lg backdrop-blur transition border border-purple-400/40 cursor-pointer"
            title="Trợ lý AI viết nhận xét học bạ"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI Chủ nhiệm</span>
          </button>

          {/* Word & Slide */}
          <button
            type="button"
            onClick={onOpenDocExport}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-sky-500/25 hover:bg-sky-500/40 text-sky-100 rounded-lg backdrop-blur transition border border-sky-400/40 cursor-pointer"
            title="Xuất Giấy mời, Biên bản Word & Slide Họp PH"
          >
            <FileText className="w-3.5 h-3.5 text-sky-200" />
            <span>Word &amp; Slide</span>
          </button>

          {/* Lịch sử */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white rounded-lg backdrop-blur transition border border-white/20 cursor-pointer"
            title="Xem nhật ký báo cáo đã gửi"
          >
            <History className="w-3.5 h-3.5 text-blue-200" />
            <span>Lịch sử</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-500 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* File HTML Offline */}
          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-teal-500/80 hover:bg-teal-500 text-white rounded-lg shadow-xs transition border border-teal-300/40 cursor-pointer"
            title="Tải về file HTML đơn tệp chạy offline"
          >
            <Download className="w-3.5 h-3.5" />
            <span>File HTML</span>
          </button>

          {/* NÚT API KEY GEMINI (Rõ ràng, không gây nhầm lẫn) */}
          <button
            type="button"
            onClick={onOpenApiKey}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition border cursor-pointer ${
              hasApiKey
                ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border-rose-500/60'
                : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400 animate-pulse'
            }`}
            title="Thiết lập Gemini API Key cho Trợ lý AI"
          >
            <Key className="w-3.5 h-3.5 text-amber-300" />
            <span>{hasApiKey ? 'Gemini API' : 'Lấy API key'}</span>
          </button>
        </div>

        {/* Medium / Tablet / Mobile Bar */}
        <div className="flex xl:hidden items-center gap-1.5">
          {/* NÚT CẤU HÌNH LỚP - LUÔN HIỆN TRÊN MỌI THIẾT BỊ */}
          <button
            type="button"
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-white text-blue-800 hover:bg-blue-50 active:scale-95 rounded-xl shadow-xs transition border border-white/50 cursor-pointer"
            title="Cấu hình thông tin Lớp học & Danh sách học sinh"
          >
            <Settings className="w-3.5 h-3.5 text-blue-700" />
            <span className="font-extrabold">Cấu hình</span>
          </button>

          {/* Lịch sử */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-lg text-white border border-white/20 cursor-pointer"
            title="Xem nhật ký báo cáo"
          >
            <History className="w-3.5 h-3.5 text-blue-200" />
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-500 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* NÚT TẤT CẢ MỤC KHÁC (Menu Drawer / Dropdown) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-indigo-500/60 hover:bg-indigo-500/80 text-white rounded-lg border border-indigo-300/50 cursor-pointer"
            title="Mở toàn bộ danh mục tính năng"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden sm:inline">Tất cả mục</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* DROPDOWN MENU KHI MỞ TRÊN MOBILE / TABLET */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-slate-900/95 backdrop-blur-md border-t border-blue-500/30 px-4 py-3 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {/* 1. Cấu hình lớp */}
            <button
              type="button"
              onClick={() => {
                onOpenConfig();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-white font-bold transition text-left cursor-pointer"
            >
              <Settings className="w-4 h-4 text-blue-300 shrink-0" />
              <div>
                <div>Cấu hình lớp</div>
                <div className="text-[10px] text-blue-200 font-normal">Trường, lớp, học sinh</div>
              </div>
            </button>

            {/* 2. Trò chơi */}
            <button
              type="button"
              onClick={() => {
                onOpenLuckyWheel();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/30 text-amber-100 font-bold transition text-left cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div>Khu trò chơi</div>
                <div className="text-[10px] text-amber-200/80 font-normal">Vòng quay, Hộp quà</div>
              </div>
            </button>

            {/* 3. Thi đua 4 tổ */}
            <button
              type="button"
              onClick={() => {
                onOpenLeaderboard();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/30 text-indigo-100 font-bold transition text-left cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-yellow-300 shrink-0" />
              <div>
                <div>Thi đua 4 Tổ</div>
                <div className="text-[10px] text-indigo-200/80 font-normal">Xếp hạng nề nếp</div>
              </div>
            </button>

            {/* 4. Biểu đồ D3 */}
            <button
              type="button"
              onClick={() => {
                onOpenAnalytics();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/30 text-cyan-100 font-bold transition text-left cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-cyan-300 shrink-0" />
              <div>
                <div>Biểu đồ D3</div>
                <div className="text-[10px] text-cyan-200/80 font-normal">Thống kê chuyên sâu</div>
              </div>
            </button>

            {/* 5. Thư khen */}
            <button
              type="button"
              onClick={() => {
                onOpenAward();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/30 text-emerald-100 font-bold transition text-left cursor-pointer"
            >
              <Award className="w-4 h-4 text-yellow-300 shrink-0" />
              <div>
                <div>Thư khen điện tử</div>
                <div className="text-[10px] text-emerald-200/80 font-normal">Tuyên dương học sinh</div>
              </div>
            </button>

            {/* 6. AI Chủ nhiệm */}
            <button
              type="button"
              onClick={() => {
                onOpenAIAssistant();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/30 text-purple-100 font-bold transition text-left cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
              <div>
                <div>AI Chủ nhiệm</div>
                <div className="text-[10px] text-purple-200/80 font-normal">Viết nhận xét học bạ</div>
              </div>
            </button>

            {/* 7. Word & Slide */}
            <button
              type="button"
              onClick={() => {
                onOpenDocExport();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/30 text-sky-100 font-bold transition text-left cursor-pointer"
            >
              <FileText className="w-4 h-4 text-sky-200 shrink-0" />
              <div>
                <div>Word &amp; Slide</div>
                <div className="text-[10px] text-sky-200/80 font-normal">Giấy mời, Slide họp PH</div>
              </div>
            </button>

            {/* 8. Lịch sử báo cáo */}
            <button
              type="button"
              onClick={() => {
                onOpenHistory();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition text-left cursor-pointer"
            >
              <History className="w-4 h-4 text-blue-200 shrink-0" />
              <div>
                <div>Nhật ký báo cáo</div>
                <div className="text-[10px] text-slate-300 font-normal">{historyCount} lượt đã gửi</div>
              </div>
            </button>

            {/* 9. Tải file HTML Offline */}
            <button
              type="button"
              onClick={() => {
                onOpenExport();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/35 border border-teal-400/30 text-teal-100 font-bold transition text-left cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-300 shrink-0" />
              <div>
                <div>Tải file HTML</div>
                <div className="text-[10px] text-teal-200/80 font-normal">Chạy offline không cần mạng</div>
              </div>
            </button>

            {/* 10. Gemini API Key */}
            <button
              type="button"
              onClick={() => {
                onOpenApiKey();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/40 text-rose-100 font-bold transition text-left cursor-pointer col-span-2 sm:col-span-1"
            >
              <Key className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div>Gemini API Key</div>
                <div className="text-[10px] text-rose-200/80 font-normal">
                  {hasApiKey ? 'Đã cài đặt key' : 'Bấm để nạp API key'}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
