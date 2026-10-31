import React, { useMemo } from 'react';
import { X, Trophy, Medal, Award, Flame, TrendingUp, Copy, Check, Users } from 'lucide-react';
import { ClassConfig, ReportItem, GroupStat } from '../types';

interface GroupLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  history: ReportItem[];
  onShowToast: (msg: string, icon?: string) => void;
}

export const GroupLeaderboardModal: React.FC<GroupLeaderboardModalProps> = ({
  isOpen,
  onClose,
  config,
  history,
  onShowToast,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Compute Group Stats
  const groupStats = useMemo<GroupStat[]>(() => {
    const groups: { [key: number]: GroupStat } = {
      1: { groupNumber: 1, studentCount: 0, absentCount: 0, violationCount: 0, commendationCount: 0, score: 100 },
      2: { groupNumber: 2, studentCount: 0, absentCount: 0, violationCount: 0, commendationCount: 0, score: 100 },
      3: { groupNumber: 3, studentCount: 0, absentCount: 0, violationCount: 0, commendationCount: 0, score: 100 },
      4: { groupNumber: 4, studentCount: 0, absentCount: 0, violationCount: 0, commendationCount: 0, score: 100 },
    };

    // Count students per group
    config.students.forEach((s) => {
      const g = s.group || 1;
      if (groups[g]) {
        groups[g].studentCount++;
      }
    });

    // Count events from history
    history.forEach((item) => {
      item.students.forEach((s) => {
        // match student in config to get current group
        const matched = config.students.find((c) => c.id === s.id || c.name === s.name);
        const g = matched?.group || s.group || 1;
        if (!groups[g]) return;

        if (item.type === 'ABSENT') {
          groups[g].absentCount++;
          groups[g].score -= 2;
        } else if (item.type === 'VIOLATION') {
          groups[g].violationCount += Math.max(1, item.violationTags.length);
          groups[g].score -= item.violationTags.length * 3;
        } else if (item.type === 'COMMENDATION') {
          groups[g].commendationCount += Math.max(1, item.commendationTags.length);
          groups[g].score += item.commendationTags.length * 5;
        }
      });
    });

    return Object.values(groups).sort((a, b) => b.score - a.score);
  }, [config.students, history]);

  if (!isOpen) return null;

  const handleCopyZaloSummary = () => {
    let msg = `🏆 BẢNG XẾP HẠNG THI ĐUA NỀ NẾP CÁC TỔ - LỚP ${config.className}\n`;
    msg += `👨‍🏫 GVCN: ${config.teacherName}\n`;
    msg += `📅 Cập nhật: ${new Date().toLocaleDateString('vi-VN')}\n`;
    msg += `----------------------------------------\n`;

    groupStats.forEach((g, idx) => {
      const medals = ['🥇', '🥈', '🥉', '🎗️'];
      msg += `${medals[idx] || '🔹'} HẠNG ${idx + 1}: TỔ ${g.groupNumber} (${g.score} điểm)\n`;
      msg += `   • Sĩ số: ${g.studentCount} bạn\n`;
      msg += `   • Điểm cộng/Khen thưởng: +${g.commendationCount} lượt\n`;
      msg += `   • Vi phạm: -${g.violationCount} lượt | Vắng: -${g.absentCount} lượt\n\n`;
    });

    msg += `👏 Thầy chúc mừng các tổ đạt thành tích tốt và đề nghị các bạn tiếp tục giữ vững nề nếp kỷ cương!`;

    navigator.clipboard.writeText(msg);
    setCopied(true);
    onShowToast('Đã sao chép bảng xếp hạng thi đua gửi Zalo!', '🏆');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              🏆
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>Bảng Thi Đua Nề Nếp Các Tổ</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/25">Lớp {config.className}</span>
              </h3>
              <p className="text-xs text-blue-200">
                Tự động tính điểm thi đua Tổ 1 - Tổ 4 từ lịch sử chuyên cần & nề nếp
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {groupStats.map((group, rank) => {
              const rankThemes = [
                {
                  badge: '🥇 Quán quân (Hạng 1)',
                  bg: 'from-amber-500/15 to-yellow-500/10 border-amber-300',
                  badgeColor: 'bg-amber-500 text-white',
                  icon: <Trophy className="w-5 h-5 text-amber-500" />,
                },
                {
                  badge: '🥈 Á quân (Hạng 2)',
                  bg: 'from-slate-400/15 to-slate-300/10 border-slate-300',
                  badgeColor: 'bg-slate-500 text-white',
                  icon: <Medal className="w-5 h-5 text-slate-500" />,
                },
                {
                  badge: '🥉 Hạng 3',
                  bg: 'from-orange-500/15 to-amber-700/10 border-orange-300',
                  badgeColor: 'bg-amber-700 text-white',
                  icon: <Award className="w-5 h-5 text-amber-700" />,
                },
                {
                  badge: '🎗️ Hạng 4',
                  bg: 'from-slate-100 to-slate-50 border-slate-200',
                  badgeColor: 'bg-slate-400 text-white',
                  icon: <Flame className="w-5 h-5 text-slate-400" />,
                },
              ];

              const theme = rankThemes[rank] || rankThemes[3];

              return (
                <div
                  key={group.groupNumber}
                  className={`p-4 rounded-2xl border bg-gradient-to-br ${theme.bg} shadow-xs relative overflow-hidden flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${theme.badgeColor}`}>
                        {theme.badge}
                      </span>
                      <div className="text-xl font-black text-slate-900 flex items-center gap-1">
                        {theme.icon}
                        <span>{group.score} <span className="text-xs font-semibold text-slate-500">điểm</span></span>
                      </div>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-800">
                      TỔ {group.groupNumber}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      {group.studentCount} thành viên
                    </p>
                  </div>

                  {/* Breakdown metrics */}
                  <div className="mt-3.5 pt-3 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/80 p-1.5 rounded-xl border border-slate-200/60">
                      <div className="text-[10px] text-emerald-700 font-bold uppercase">Khen thưởng</div>
                      <div className="font-extrabold text-emerald-600">+{group.commendationCount}</div>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-xl border border-slate-200/60">
                      <div className="text-[10px] text-rose-700 font-bold uppercase">Vi phạm</div>
                      <div className="font-extrabold text-rose-600">-{group.violationCount}</div>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-xl border border-slate-200/60">
                      <div className="text-[10px] text-amber-700 font-bold uppercase">Vắng/Muộn</div>
                      <div className="font-extrabold text-amber-600">-{group.absentCount}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scoring rule notice */}
          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
            <strong>📌 Quy tắc tính điểm thi đua:</strong> Điểm khởi đầu mỗi tổ là <strong>100 điểm</strong>. Mỗi lượt tuyên dương: <strong>+5 điểm</strong>. Mỗi lỗi vi phạm: <strong>-3 điểm</strong>. Mỗi lượt vắng học/muộn: <strong>-2 điểm</strong>.
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopyZaloSummary}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép tin nhắn!' : 'Sao chép tin Zalo Bảng Thi Đua'}</span>
          </button>

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
