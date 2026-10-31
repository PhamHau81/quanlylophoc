import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Award,
  Gift,
  HelpCircle,
  Gamepad2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Student } from '../types';

interface ClassGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onShowToast?: (msg: string, icon?: string) => void;
}

const QUIZ_QUESTIONS = [
  {
    question: 'Khi phát hiện bạn trong lớp có dấu hiệu bị bạo lực học đường hoặc cô lập, em nên làm gì?',
    options: [
      'Im lặng vì không liên quan đến mình',
      'Báo ngay cho GVCN, Ban cán sự hoặc phòng tư vấn tâm lý',
      'Đứng xem và quay video đăng lên mạng xã hội',
      'Cổ vũ nhóm bắt nạt',
    ],
    correctIndex: 1,
    explanation: 'Báo ngay cho GVCN và người có trách nhiệm là hành động dũng cảm và bảo vệ bạn an toàn.',
  },
  {
    question: 'Quy định nào sau đây là BẮT BUỘC khi tham gia giao thông đến trường?',
    options: [
      'Đi xe dàn hàng 3, hàng 4 trò chuyện',
      'Đội mũ bảo hiểm cài quai đúng quy cách khi đi xe máy/xe đạp điện',
      'Vừa đi xe vừa bấm điện thoại',
      'Không cần đội mũ nếu trường ở gần nhà',
    ],
    correctIndex: 1,
    explanation: '100% học sinh đi xe máy điện/xe gắn máy phải đội mũ bảo hiểm đạt chuẩn để bảo vệ tính mạng.',
  },
  {
    question: 'Trong giờ học, khi nào học sinh được phép sử dụng điện thoại di động?',
    options: [
      'Bất cứ khi nào thích lướt mạng',
      'Khi làm bài tập trắc nghiệm riêng tư',
      'Chỉ khi có yêu cầu và sự cho phép của giáo viên bộ môn',
      'Khi thấy buồn ngủ trong tiết học',
    ],
    correctIndex: 2,
    explanation: 'Theo Thông tư 32/2020/TT-BGDĐT, chỉ sử dụng điện thoại khi phục vụ học tập và được giáo viên cho phép.',
  },
  {
    question: 'Nhiệm vụ hàng đầu của học sinh khi bước vào tiết 1 mỗi buổi sáng là gì?',
    options: [
      'Đến đúng giờ, chỉnh đốn trang phục, phù hiệu và chuẩn bị sách vở sẵn sàng',
      'Ăn sáng trong lớp và làm bài tập về nhà của môn khác',
      'Bật quạt số to nhất rồi gục đầu ngủ',
      'Đi sang các lớp khác để mượn đồ',
    ],
    correctIndex: 0,
    explanation: 'Đến đúng giờ và chuẩn bị tâm thế nghiêm túc giúp khởi đầu ngày học tập hiệu quả nhất.',
  },
];

const MYSTERY_REWARDS = [
  { label: '🌟 1 Điểm Cộng Miệng', desc: 'Được cộng 1 điểm vào lần kiểm tra bài cũ gần nhất!' },
  { label: '🎁 Một Tràng Pháo Tay Cả Lớp', desc: 'Nhận sự cổ vũ nhiệt liệt từ toàn thể thầy cô và bạn bè!' },
  { label: '🎤 Hát / Kể Một Câu Chuyện Vui', desc: 'Biểu diễn một tiết mục văn nghệ hoặc kể chuyện hài 1 phút!' },
  { label: '🍫 Một Phần Quà Bất Ngờ Từ Thầy Hậu', desc: 'Nhận phần quà khích lệ từ Giáo viên chủ nhiệm!' },
  { label: '👑 Miễn Trực Nhật 1 Ngày', desc: 'Được đặc cách không phải quét lớp trong ngày tiếp theo!' },
  { label: '📖 Trả Lời Câu Hỏi Kiểm Tra Bài Cũ', desc: 'Cơ hội ghi điểm 10 nếu thuộc bài xuất sắc hôm nay!' },
];

export const ClassGamesModal: React.FC<ClassGamesModalProps> = ({
  isOpen,
  onClose,
  students,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'WHEEL' | 'BOXES' | 'QUIZ'>('WHEEL');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Wheel state
  const [selectedGroup, setSelectedGroup] = useState<number | 'ALL'>('ALL');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Student | null>(null);
  const [pickedHistory, setPickedHistory] = useState<Student[]>([]);
  const [excludePicked, setExcludePicked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Mystery Box State
  const [openedBoxes, setOpenedBoxes] = useState<number[]>([]);
  const [boxWinnerStudent, setBoxWinnerStudent] = useState<Student | null>(null);

  // Quiz State
  const [currentQuizIdx, setCurrentQuizIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  const candidates = students.filter((s) => {
    if (selectedGroup !== 'ALL' && s.group !== selectedGroup) return false;
    if (excludePicked && pickedHistory.some((p) => p.id === s.id)) return false;
    return true;
  });

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
    '#6366f1', '#84cc16', '#f97316', '#a855f7'
  ];

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
    } catch {}
  };

  const playFanfare = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5];
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

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;

    ctx.clearRect(0, 0, size, size);

    if (candidates.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Không có học sinh trong danh sách', centerX, centerY);
      return;
    }

    const count = candidates.length;
    const arc = (2 * Math.PI) / count;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngleRef.current);

    candidates.forEach((student, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = count > 25 ? 'bold 10px sans-serif' : 'bold 12px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;

      const maxLen = count > 25 ? 12 : 16;
      const displayName = student.name.length > maxLen ? student.name.slice(0, maxLen) + '…' : student.name;
      ctx.fillText(displayName, radius - 20, 4);
      ctx.restore();
    });

    ctx.restore();

    // Center pin
    ctx.beginPath();
    ctx.arc(centerX, centerY, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', centerX, centerY);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'WHEEL') {
      setTimeout(drawWheel, 50);
    }
  }, [isOpen, activeTab, selectedGroup, excludePicked, candidates.length]);

  const spin = () => {
    if (isSpinning || candidates.length === 0) return;
    setIsSpinning(true);
    setWinner(null);

    const count = candidates.length;
    const arc = (2 * Math.PI) / count;
    const winningIndex = Math.floor(Math.random() * count);

    const fullSpins = 6 + Math.floor(Math.random() * 3);
    const pointerAngle = (3 * Math.PI) / 2;
    const targetSliceAngle = pointerAngle - (winningIndex * arc + arc / 2);

    const totalAngle = fullSpins * 2 * Math.PI + targetSliceAngle - (currentAngleRef.current % (2 * Math.PI));
    const duration = 4000;
    const startAngle = currentAngleRef.current;
    const startTime = performance.now();

    let lastTickAngle = startAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startAngle + totalAngle * easeOut;
      currentAngleRef.current = current;

      if (Math.abs(current - lastTickAngle) > arc / 2) {
        playTickSound();
        lastTickAngle = current;
      }

      drawWheel();

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const win = candidates[winningIndex];
        setWinner(win);
        setPickedHistory((prev) => [win, ...prev]);
        playFanfare();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const handleOpenBox = (boxIdx: number) => {
    if (openedBoxes.includes(boxIdx)) return;
    if (candidates.length === 0) return;

    // Pick a random student for this mystery box
    const randomStudent = candidates[Math.floor(Math.random() * candidates.length)];
    setBoxWinnerStudent(randomStudent);
    setOpenedBoxes((prev) => [...prev, boxIdx]);
    playFanfare();
  };

  const handleAnswerQuiz = (optionIdx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIdx);
    setShowExplanation(true);
    if (optionIdx === QUIZ_QUESTIONS[currentQuizIdx].correctIndex) {
      setQuizScore((prev) => prev + 1);
      playFanfare();
    }
  };

  const nextQuizQuestion = () => {
    if (currentQuizIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      onShowToast?.(`Đã hoàn thành Quiz! Bạn đạt ${quizScore + (selectedAnswer === QUIZ_QUESTIONS[currentQuizIdx].correctIndex ? 1 : 0)}/${QUIZ_QUESTIONS.length} điểm!`, '🏆');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              🎮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Khu Trò Chơi Lớp Học (Game &amp; Quiz)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                  Game Dev Skill
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Gọi tên ngẫu nhiên, hộp quà may mắn và đố vui khởi động tiết sinh hoạt lớp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={soundEnabled ? 'Tắt âm' : 'Bật âm'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-300" />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 border-b border-slate-200 flex gap-4 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('WHEEL')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'WHEEL'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🎡 Vòng Quay May Mắn</span>
          </button>

          <button
            onClick={() => setActiveTab('BOXES')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'BOXES'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🎁 Hộp Quà Bí Mật</span>
          </button>

          <button
            onClick={() => setActiveTab('QUIZ')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'QUIZ'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🧠 Mini Quiz Khởi Động (5p)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700">
          {activeTab === 'WHEEL' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Left: Canvas Wheel (7 cols) */}
              <div className="md:col-span-7 flex flex-col items-center justify-center">
                <div className="relative">
                  {/* Top Pointer */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-500 drop-shadow-md" />
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={340}
                    className="max-w-full h-auto drop-shadow-xl"
                  />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={spin}
                    disabled={isSpinning || candidates.length === 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isSpinning ? 'Đang quay...' : 'QUAY NGAY'}</span>
                  </button>
                </div>
              </div>

              {/* Right: Controls & Winner Card (5 cols) */}
              <div className="md:col-span-5 space-y-3">
                {/* Winner Card */}
                {winner && (
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl text-center shadow-lg animate-in zoom-in-95 duration-200">
                    <span className="text-3xl block mb-1">🎉</span>
                    <div className="text-[11px] font-bold text-amber-700 uppercase">
                      HỌC SINH ĐƯỢC CHỌN
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">
                      {winner.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      STT {winner.stt} {winner.group ? `• Tổ ${winner.group}` : ''}
                    </div>
                  </div>
                )}

                {/* Filter controls */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-700">Lọc theo Tổ:</div>
                  <div className="grid grid-cols-5 gap-1 text-[11px]">
                    {(['ALL', 1, 2, 3, 4] as const).map((grp) => (
                      <button
                        key={grp}
                        onClick={() => setSelectedGroup(grp)}
                        disabled={isSpinning}
                        className={`p-1.5 rounded-lg font-bold transition ${
                          selectedGroup === grp
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {grp === 'ALL' ? 'Tất cả' : `Tổ ${grp}`}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={excludePicked}
                      onChange={(e) => setExcludePicked(e.target.checked)}
                      disabled={isSpinning}
                      className="rounded text-amber-600"
                    />
                    <span>Loại trừ bạn đã được gọi</span>
                  </label>
                </div>

                {/* History */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-bold text-slate-700 mb-1.5 flex justify-between">
                    <span>Đã gọi ({pickedHistory.length}):</span>
                    {pickedHistory.length > 0 && (
                      <button
                        onClick={() => setPickedHistory([])}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Xóa lịch sử
                      </button>
                    )}
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {pickedHistory.map((p, idx) => (
                      <div key={idx} className="text-[11px] text-slate-600 flex justify-between">
                        <span>{idx + 1}. {p.name}</span>
                        <span className="text-slate-400">Tổ {p.group || 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'BOXES' ? (
            /* TAB: MYSTERY BOXES */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 leading-relaxed text-center">
                🎁 <strong>Hộp Quà May Mắn:</strong> Mời 1 bạn học sinh lên bảng chọn một chiếc hộp bí mật để khám phá phần quà hoặc thử thách thú vị trong tiết sinh hoạt!
              </div>

              {boxWinnerStudent && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-center font-bold text-emerald-800">
                  Học sinh tham gia mở hộp: <span className="text-emerald-950 font-extrabold text-sm">{boxWinnerStudent.name}</span> (Tổ {boxWinnerStudent.group || 1})
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
                {MYSTERY_REWARDS.map((rew, idx) => {
                  const isOpened = openedBoxes.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOpenBox(idx)}
                      className={`p-4 rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
                        isOpened
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 shadow-md scale-98'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-4xl mb-2 transition transform hover:scale-110">
                        {isOpened ? '✨' : '🎁'}
                      </div>
                      <div className="font-extrabold text-xs text-slate-800">
                        Hộp Quà Số {idx + 1}
                      </div>

                      {isOpened ? (
                        <div className="mt-2 space-y-1 animate-in fade-in duration-300">
                          <div className="font-bold text-amber-800 text-xs">{rew.label}</div>
                          <div className="text-[10px] text-slate-500">{rew.desc}</div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-600 font-bold mt-1">
                          Bấm để mở hộp!
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenedBoxes([]);
                    setBoxWinnerStudent(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Đóng lại toàn bộ hộp quà
                </button>
              </div>
            </div>
          ) : (
            /* TAB: MINI QUIZ */
            <div className="space-y-4 max-w-xl mx-auto py-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Câu hỏi {currentQuizIdx + 1} / {QUIZ_QUESTIONS.length}</span>
                <span className="text-amber-600">Điểm số: {quizScore} câu đúng</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                  {QUIZ_QUESTIONS[currentQuizIdx].question}
                </h4>
              </div>

              <div className="space-y-2">
                {QUIZ_QUESTIONS[currentQuizIdx].options.map((opt, optIdx) => {
                  const isChosen = selectedAnswer === optIdx;
                  const isCorrect = optIdx === QUIZ_QUESTIONS[currentQuizIdx].correctIndex;

                  let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                  if (selectedAnswer !== null) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    } else if (isChosen) {
                      btnStyle = 'bg-rose-50 border-rose-500 text-rose-900';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={selectedAnswer !== null}
                      onClick={() => handleAnswerQuiz(optIdx)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${btnStyle} cursor-pointer`}
                    >
                      <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                      {selectedAnswer !== null && (
                        <span>
                          {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : isChosen ? <XCircle className="w-4 h-4 text-rose-600" /> : null}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {showExplanation && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 animate-in fade-in">
                  <strong>💡 Lời giải thích từ GVCN:</strong> {QUIZ_QUESTIONS[currentQuizIdx].explanation}
                </div>
              )}

              {selectedAnswer !== null && currentQuizIdx < QUIZ_QUESTIONS.length - 1 && (
                <button
                  type="button"
                  onClick={nextQuizQuestion}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Sang câu hỏi tiếp theo ➔
                </button>
              )}
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
