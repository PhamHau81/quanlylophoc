import React, { useState, useRef, useEffect } from 'react';
import { X, Play, RotateCcw, Volume2, VolumeX, Sparkles, Users, Award } from 'lucide-react';
import { Student } from '../types';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  students,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<number | 'ALL'>('ALL');
  const [isSpinning, setIsSpinning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [winner, setWinner] = useState<Student | null>(null);
  const [pickedHistory, setPickedHistory] = useState<Student[]>([]);
  const [excludePicked, setExcludePicked] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Filter candidate pool
  const candidates = students.filter((s) => {
    if (selectedGroup !== 'ALL' && s.group !== selectedGroup) return false;
    if (excludePicked && pickedHistory.some((p) => p.id === s.id)) return false;
    return true;
  });

  // Sound generator via Web Audio API
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  const playFanfare = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.1);
        osc.stop(audioCtx.currentTime + idx * 0.1 + 0.35);
      });
    } catch {}
  };

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
    '#6366f1', '#84cc16', '#f97316', '#a855f7'
  ];

  // Draw wheel on canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 12;

    ctx.clearRect(0, 0, width, height);

    const count = candidates.length;
    if (count === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Không có học sinh trong tổ này', centerX, centerY);
      return;
    }

    const arc = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
      const angle = currentAngleRef.current + i * arc;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw student text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = count > 20 ? 'bold 11px sans-serif' : 'bold 13px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;

      // Truncate name if long
      let displayName = candidates[i].name;
      if (displayName.length > 15) {
        displayName = displayName.substring(0, 14) + '...';
      }
      ctx.fillText(displayName, radius - 20, 4);
      ctx.restore();
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', centerX, centerY);
  };

  useEffect(() => {
    if (isOpen) {
      drawWheel();
    }
  }, [isOpen, selectedGroup, excludePicked, candidates.length]);

  const spin = () => {
    if (isSpinning || candidates.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    const count = candidates.length;
    const arc = (2 * Math.PI) / count;

    // Pick random index
    const winningIndex = Math.floor(Math.random() * count);

    // Calculate rotation: spins (5 to 8 full turns) + offset to align top pointer
    const fullSpins = 6 + Math.floor(Math.random() * 3);
    const pointerAngle = (3 * Math.PI) / 2; // top 12 o'clock pointer
    const targetSliceAngle = pointerAngle - (winningIndex * arc + arc / 2);

    const totalAngle = fullSpins * 2 * Math.PI + targetSliceAngle - (currentAngleRef.current % (2 * Math.PI));
    const duration = 4000; // 4 seconds
    const startAngle = currentAngleRef.current;
    const startTime = performance.now();

    let lastTickAngle = startAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      currentAngleRef.current = startAngle + totalAngle * easeOut;

      // Check for tick sound
      if (Math.abs(currentAngleRef.current - lastTickAngle) >= arc) {
        playTickSound();
        lastTickAngle = currentAngleRef.current;
      }

      drawWheel();

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const winningStudent = candidates[winningIndex];
        setWinner(winningStudent);
        setPickedHistory((prev) => [winningStudent, ...prev]);
        playFanfare();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              🎯
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>Vòng Quay May Mắn</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/25">Gọi Tên Ngẫu Nhiên</span>
              </h3>
              <p className="text-xs text-amber-100">
                Phục vụ gọi học sinh kiểm tra bài cũ, phát biểu hoặc phân công nhật vụ
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

        {/* Controls & Filter */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Tổ:
            </span>
            <div className="inline-flex rounded-xl p-0.5 bg-slate-200">
              {(['ALL', 1, 2, 3, 4] as const).map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  disabled={isSpinning}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    selectedGroup === grp
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {grp === 'ALL' ? 'Tất cả' : `Tổ ${grp}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={excludePicked}
                onChange={(e) => setExcludePicked(e.target.checked)}
                disabled={isSpinning}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span>Trừ bạn đã gọi</span>
            </label>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-200 text-slate-700 transition"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
            </button>
          </div>
        </div>

        {/* Wheel Viewport */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-amber-50/30 to-slate-50">
          <div className="relative">
            {/* Top Pointer Arrow */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-rose-600 filter drop-shadow-md"></div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="rounded-full shadow-xl border-4 border-amber-400/50 bg-white"
            />
          </div>

          {/* Winner Callout Banner */}
          {winner && (
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white rounded-2xl shadow-xl text-center animate-in zoom-in-95 duration-200 max-w-md w-full">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-100 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-yellow-200" />
                Chúc mừng bạn may mắn
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1">
                {winner.name}
              </div>
              <div className="text-xs text-white/90 font-medium mt-0.5">
                {winner.group ? `Tổ ${winner.group}` : ''} • STT: {winner.stt} {winner.role ? `• ${winner.role}` : ''}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={spin}
              disabled={isSpinning || candidates.length === 0}
              className={`px-8 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base text-white shadow-xl flex items-center gap-2 transition active:scale-95 ${
                isSpinning || candidates.length === 0
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:brightness-105 shadow-orange-500/30 cursor-pointer animate-pulse'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{isSpinning ? 'Đang quay...' : 'QUAY NGAY 🎯'}</span>
            </button>

            {pickedHistory.length > 0 && (
              <button
                onClick={() => setPickedHistory([])}
                className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl transition cursor-pointer"
                title="Xóa danh sách đã gọi"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Picked History List */}
        {pickedHistory.length > 0 && (
          <div className="p-3 bg-slate-100 border-t border-slate-200 text-xs flex items-center gap-2 overflow-x-auto">
            <span className="font-bold text-slate-700 shrink-0 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Đã gọi ({pickedHistory.length}):
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {pickedHistory.map((p, idx) => (
                <span
                  key={`${p.id}-${idx}`}
                  className="px-2 py-0.5 bg-white rounded-md text-slate-800 border border-slate-200 font-medium shrink-0"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
