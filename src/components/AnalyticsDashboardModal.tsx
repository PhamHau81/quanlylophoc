import React, { useMemo, useState } from 'react';
import {
  X,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Award,
  AlertTriangle,
  Users,
  Download,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ClassConfig, ReportItem } from '../types';

interface AnalyticsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  history: ReportItem[];
  onShowToast: (msg: string, icon?: string) => void;
  onOpenAward?: (studentName: string) => void;
}

export const AnalyticsDashboardModal: React.FC<AnalyticsDashboardModalProps> = ({
  isOpen,
  onClose,
  config,
  history,
  onShowToast,
  onOpenAward,
}) => {
  const [filterRange, setFilterRange] = useState<'ALL' | '7DAYS' | '30DAYS'>('ALL');

  // Filter history by time range
  const filteredHistory = useMemo(() => {
    if (filterRange === 'ALL') return history;
    const now = Date.now();
    const days = filterRange === '7DAYS' ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return history.filter((h) => h.timestamp >= cutoff);
  }, [history, filterRange]);

  // General counts
  const totalReports = filteredHistory.length;
  const totalViolations = filteredHistory.filter((h) => h.type === 'VIOLATION').length;
  const totalCommendations = filteredHistory.filter((h) => h.type === 'COMMENDATION').length;
  const totalAbsents = filteredHistory.filter((h) => h.type === 'ABSENT').length;

  // 4 Groups Stats
  const groupStats = useMemo(() => {
    const groups = [1, 2, 3, 4];
    return groups.map((gNum) => {
      const groupStudents = config.students.filter((s) => (s.group || 1) === gNum);
      const studentIds = new Set(groupStudents.map((s) => s.id));
      const studentNames = new Set(groupStudents.map((s) => s.name));

      const groupReports = filteredHistory.filter((r) =>
        r.students.some((s) => studentIds.has(s.id) || studentNames.has(s.name))
      );

      const absents = groupReports.filter((r) => r.type === 'ABSENT').length;
      const violations = groupReports.filter((r) => r.type === 'VIOLATION').length;
      const commendations = groupReports.filter((r) => r.type === 'COMMENDATION').length;
      const score = Math.max(0, 100 + commendations * 5 - violations * 3 - absents * 2);

      return {
        groupNumber: gNum,
        studentCount: groupStudents.length,
        absentCount: absents,
        violationCount: violations,
        commendationCount: commendations,
        score,
      };
    });
  }, [config.students, filteredHistory]);

  // Top Violations Frequency
  const topViolations = useMemo(() => {
    const map = new Map<string, number>();
    filteredHistory
      .filter((h) => h.type === 'VIOLATION')
      .forEach((h) => {
        h.violationTags.forEach((tag) => {
          map.set(tag, (map.get(tag) || 0) + 1);
        });
      });
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredHistory]);

  // Top Commended Students
  const topStudents = useMemo(() => {
    const map = new Map<string, { count: number; student: any }>();
    filteredHistory
      .filter((h) => h.type === 'COMMENDATION')
      .forEach((h) => {
        h.students.forEach((s) => {
          const current = map.get(s.name) || { count: 0, student: s };
          current.count += 1;
          map.set(s.name, current);
        });
      });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredHistory]);

  // Max score for bar chart scaling
  const maxScore = Math.max(120, ...groupStats.map((g) => g.score));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Dashboard Trực Quan Nề Nếp & Thi Đua Lớp
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                  D3 Powered
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Lớp {config.className} • GVCN: {config.teacherName} • Thống kê tự động thời gian thực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="hidden sm:flex items-center bg-black/20 rounded-xl p-1 text-xs">
              <button
                onClick={() => setFilterRange('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterRange === 'ALL' ? 'bg-white text-blue-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Toàn kỳ
              </button>
              <button
                onClick={() => setFilterRange('30DAYS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterRange === '30DAYS' ? 'bg-white text-blue-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                30 ngày
              </button>
              <button
                onClick={() => setFilterRange('7DAYS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterRange === '7DAYS' ? 'bg-white text-blue-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                7 ngày qua
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold text-[11px]">Tổng lượt ghi nhận</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{totalReports}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Sự việc nề nếp đã lưu</div>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="font-semibold text-[11px]">Tuyên dương / Điểm 10</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">+{totalCommendations}</div>
              <div className="text-[10px] text-emerald-600/80 mt-0.5">+5 điểm thi đua / lượt</div>
            </div>

            <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200">
              <div className="flex items-center justify-between text-rose-700 mb-1">
                <span className="font-semibold text-[11px]">Vi phạm nội quy</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-extrabold text-rose-700">{totalViolations}</div>
              <div className="text-[10px] text-rose-600/80 mt-0.5">-3 điểm thi đua / lượt</div>
            </div>

            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <span className="font-semibold text-[11px]">Vắng học / Nghỉ tiết</span>
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-700">{totalAbsents}</div>
              <div className="text-[10px] text-amber-600/80 mt-0.5">-2 điểm thi đua / lượt</div>
            </div>
          </div>

          {/* D3 Styled Charts Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Chart 1: Group Comparison Bar Chart (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>Biểu Đồ Thi Đua Điểm Số 4 Tổ</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Thang điểm chuẩn 100 điểm ban đầu • Cập nhật tự động
                  </p>
                </div>
              </div>

              {/* Responsive SVG Bar Chart */}
              <div className="pt-4 pb-2">
                <div className="grid grid-cols-4 gap-3 items-end h-44 px-2 border-b border-slate-200">
                  {groupStats.map((g) => {
                    const heightPercent = Math.min(100, Math.max(15, (g.score / maxScore) * 100));
                    const isTop = g.score === Math.max(...groupStats.map((x) => x.score));

                    return (
                      <div key={g.groupNumber} className="flex flex-col items-center h-full justify-end group">
                        {/* Score Tag */}
                        <div
                          className={`text-xs font-extrabold mb-1 px-1.5 py-0.5 rounded-md transition transform group-hover:-translate-y-1 ${
                            isTop
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {g.score}đ
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[48px] rounded-t-xl transition-all duration-500 flex flex-col justify-end p-1 relative overflow-hidden ${
                            isTop
                              ? 'bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300 shadow-md shadow-amber-500/20'
                              : 'bg-gradient-to-t from-blue-600 to-indigo-500'
                          }`}
                        >
                          {isTop && (
                            <span className="text-center text-xs pb-1 select-none">👑</span>
                          )}
                        </div>

                        {/* Label */}
                        <div className="mt-2 text-center">
                          <span className="font-bold text-xs text-slate-800 block">
                            Tổ {g.groupNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {g.studentCount} bạn
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group Quick Summary Table */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[11px]">
                {groupStats.map((g) => (
                  <div key={g.groupNumber} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-emerald-600 font-bold">+{g.commendationCount}</span> khen /{' '}
                    <span className="text-rose-600 font-bold">{g.violationCount}</span> phạt
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Top Violations Breakdown (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-rose-600" />
                  <span>Điểm Nóng Vi Phạm Phổ Biến</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Các lỗi xuất hiện nhiều nhất cần GVCN và BCS nhắc nhở
                </p>
              </div>

              {topViolations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                  <span className="text-2xl block mb-1">🎉</span>
                  Chưa ghi nhận lỗi vi phạm nào trong giai đoạn này!
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {topViolations.map((v, idx) => {
                    const percent = Math.round((v.count / (totalViolations || 1)) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                            {idx + 1}. {v.tag}
                          </span>
                          <span className="font-bold text-slate-900">
                            {v.count} lượt <span className="text-slate-400 font-normal">({percent}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section: Top Commended Hall of Fame */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 p-4.5 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <span>🌟</span>
                  <span>Bảng Vàng Tuyên Dương - Top Cá Nhân Gương Mẫu</span>
                </h4>
                <p className="text-[11px] text-emerald-800/80">
                  Học sinh tích cực xây dựng bài, nhiều điểm tốt và cống hiến cho tập thể lớp
                </p>
              </div>
            </div>

            {topStudents.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Chưa có lượt tuyên dương nào trong danh sách.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                {topStudents.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white/90 backdrop-blur rounded-xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-700">#{idx + 1}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {item.count} lần
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-900 text-xs truncate" title={item.student.name}>
                        {item.student.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.student.group ? `Tổ ${item.student.group}` : 'Lớp ' + config.className}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Dữ liệu trực quan hóa theo tiêu chuẩn <strong>d3-visualization</strong>
          </div>
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
