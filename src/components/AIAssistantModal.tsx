import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Copy,
  Check,
  RefreshCw,
  BookOpen,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  Key,
  ExternalLink,
} from 'lucide-react';
import { ClassConfig, ReportItem, Student } from '../types';
import {
  getStoredApiKey,
  getStoredModel,
  generateContentWithFallback,
} from '../utils/geminiService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  history: ReportItem[];
  onShowToast: (msg: string, icon?: string) => void;
  onOpenApiKey: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  config,
  history,
  onShowToast,
  onOpenApiKey,
}) => {
  const [activeTab, setActiveTab] = useState<'EVALUATION' | 'ZALO_REWRITE' | 'INTERVENTION' | 'PEDAGOGICAL_CHAT' | 'WEEKLY_SPEECH'>('EVALUATION');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(config.students[0]?.id || '');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Fallback & Error states complying with AI_INSTRUCTIONS.md
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);
  const [activeModelUsed, setActiveModelUsed] = useState<string | null>(null);

  // Tab 1 state: Generated Evaluations
  const [evaluationResults, setEvaluationResults] = useState<{ label: string; text: string }[]>([]);

  // Tab 2 state: Zalo Rewrite
  const [draftMessage, setDraftMessage] = useState<string>('Em hôm nay lại đi muộn và quên sách vở, phụ huynh chú ý nhắc nhở em.');
  const [zaloTone, setZaloTone] = useState<'GENTLE' | 'FORMAL' | 'STRICT'>('GENTLE');
  const [rewrittenMessage, setRewrittenMessage] = useState<string>('');

  // Tab 3 state: Intervention Advice
  const [behaviorIssue, setBehaviorIssue] = useState<string>('Học sinh thường xuyên sử dụng điện thoại và nói chuyện riêng trong giờ học');
  const [interventionAdvice, setInterventionAdvice] = useState<string>('');

  // Tab 4: Chatbot Sư Phạm State
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string; model?: string }[]>([
    {
      role: 'model',
      text: `Xin chào Thầy ${config.teacherName}! Tôi là Trợ lý Cố vấn Sư phạm AI của Thầy. Thầy có thể tham khảo ý kiến tôi về xử lý tình huống học sinh cá biệt, xung đột học đường, cách trao đổi khéo léo với phụ huynh hoặc các quy định của Bộ GD&ĐT. Thầy đang băn khoăn về vấn đề gì hôm nay ạ?`,
    },
  ]);

  // Tab 5: Weekly Speech State
  const [weeklySpeech, setWeeklySpeech] = useState<string>('');

  if (!isOpen) return null;

  const currentStudent = config.students.find((s) => s.id === selectedStudentId);

  // Get student history
  const studentReports = history.filter((h) =>
    h.students.some((s) => s.id === selectedStudentId || s.name === currentStudent?.name)
  );

  const absents = studentReports.filter((r) => r.type === 'ABSENT');
  const violations = studentReports.filter((r) => r.type === 'VIOLATION');
  const commendations = studentReports.filter((r) => r.type === 'COMMENDATION');
  const apiKey = getStoredApiKey();

  // Tab 1: AI Generate Evaluation
  const handleGenerateEvaluation = async () => {
    if (!apiKey) {
      setApiError('Chưa cấu hình API Key. Vui lòng bấm nút đỏ "Lấy API key để sử dụng app" bên dưới để nhập key.');
      return;
    }

    setIsGenerating(true);
    setApiError(null);
    setRetryNotice(null);
    setActiveModelUsed(null);

    const studentName = currentStudent?.name || 'Học sinh';
    const roleText = currentStudent?.role && currentStudent.role !== 'Thành viên' ? ` với vai trò ${currentStudent.role}` : '';

    const prompt = `Bạn là Trợ lý AI của Thầy Phạm Hậu, Giáo viên chủ nhiệm lớp ${config.className} trường ${config.schoolName}.
Hãy viết lời nhận xét đánh giá rèn luyện học bạ cho học sinh: ${studentName}${roleText} (Tổ: ${currentStudent?.group || 1}).
Dữ liệu thực tế của học sinh trong học kỳ:
- Số lần vắng/muộn: ${absents.length}
- Số lần vi phạm nề nếp: ${violations.length} (${violations.flatMap(v => v.violationTags).join(', ') || 'Không có vi phạm'})
- Số lần khen thưởng/thành tích: ${commendations.length} (${commendations.flatMap(c => c.commendationTags).join(', ') || 'Chăm ngoan'})

Hãy tạo 3 đoạn nhận xét bằng tiếng Việt mang tính sư phạm:
1. Chuẩn mực & Khách quan (Phù hợp ghi sổ học bạ / hệ thống vnEdu)
2. Động viên & Khích lệ tâm lý tiến bộ
3. Nhắc nhở & Định hướng rèn luyện
Trả về định dạng JSON thuần túy (không kèm markdown ngoài) theo cấu trúc:
[
  {"label": "🏛️ Chuẩn mực & Khách quan (Vào Sổ học bạ / vnEdu)", "text": "..."},
  {"label": "🌱 Động viên & Khích lệ tâm lý", "text": "..."},
  {"label": "🎯 Nhắc nhở & Định hướng rèn luyện", "text": "..."}
]`;

    try {
      const res = await generateContentWithFallback(
        prompt,
        'Bạn là chuyên gia sư phạm cao cấp và trợ lý đắc lực cho Giáo viên chủ nhiệm.',
        (cur, next, err) => {
          setRetryNotice(`Model ${cur} lỗi: ${err}. Đang tự động chuyển sang model dự phòng ${next}...`);
        }
      );

      let text = res.text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```json|^```/i, '').replace(/```$/i, '').trim();
      }

      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvaluationResults(parsed);
        } else {
          setEvaluationResults([{ label: 'Nhận xét từ AI', text: res.text }]);
        }
      } catch {
        setEvaluationResults([{ label: 'Nhận xét từ AI', text: res.text }]);
      }

      setActiveModelUsed(res.modelUsed);
      setRetryNotice(null);
      onShowToast(`Đã tạo thành công qua ${res.modelUsed}!`, '✨');
    } catch (err: any) {
      setApiError(err?.message || String(err));
      onShowToast('Đã dừng do lỗi API!', '❌');
    } finally {
      setIsGenerating(false);
    }
  };

  // Tab 2: AI Rewrite Zalo
  const handleRewriteZalo = async () => {
    if (!apiKey) {
      setApiError('Chưa cấu hình API Key. Vui lòng bấm nút đỏ "Lấy API key để sử dụng app" bên dưới để nhập key.');
      return;
    }

    setIsGenerating(true);
    setApiError(null);
    setRetryNotice(null);
    setActiveModelUsed(null);

    const toneDesc =
      zaloTone === 'GENTLE'
        ? 'Tế nhị, khéo léo, đồng hành và thấu hiểu gia đình'
        : zaloTone === 'FORMAL'
        ? 'Trang trọng, chuẩn mực sư phạm'
        : 'Nghiêm túc, dứt khoát, yêu cầu gia đình phối hợp gặp trực tiếp';

    const prompt = `Bạn là Trợ lý AI của Thầy Phạm Hậu - Giáo viên chủ nhiệm lớp ${config.className}.
Nội dung thông báo phác thảo gửi Phụ huynh: "${draftMessage}".
Phong cách truyền đạt mong muốn: "${toneDesc}".
Hãy viết lại tin nhắn Zalo gửi phụ huynh thật chỉn chu, có lời chào kính gửi, nêu rõ sự việc và lời cảm ơn, phù hợp gửi qua Zalo riêng cho bố mẹ học sinh. Chỉ trả về nội dung tin nhắn.`;

    try {
      const res = await generateContentWithFallback(
        prompt,
        'Bạn là chuyên gia giao tiếp sư phạm và cố vấn trao đổi với phụ huynh.',
        (cur, next, err) => {
          setRetryNotice(`Model ${cur} lỗi: ${err}. Đang tự động thử lại bằng ${next}...`);
        }
      );

      setRewrittenMessage(res.text.trim());
      setActiveModelUsed(res.modelUsed);
      setRetryNotice(null);
      onShowToast(`Đã tinh chỉnh qua ${res.modelUsed}!`, '✨');
    } catch (err: any) {
      setApiError(err?.message || String(err));
      onShowToast('Đã dừng do lỗi API!', '❌');
    } finally {
      setIsGenerating(false);
    }
  };

  // Tab 3: Pedagogical Intervention Advice
  const handleGetIntervention = async () => {
    if (!apiKey) {
      setApiError('Chưa cấu hình API Key. Vui lòng bấm nút đỏ "Lấy API key để sử dụng app" bên dưới để nhập key.');
      return;
    }

    setIsGenerating(true);
    setApiError(null);
    setRetryNotice(null);
    setActiveModelUsed(null);

    const prompt = `Bạn là chuyên gia tâm lý học đường và cố vấn sư phạm cho Thầy Phạm Hậu (GVCN lớp ${config.className}).
Vấn đề học sinh đang gặp phải: "${behaviorIssue}".
Hãy đưa ra kế hoạch can thiệp sư phạm 3 bước rõ ràng:
1. Phân tích nguyên nhân tâm lý đằng sau hành vi.
2. 3 bước can thiệp cụ thể ngay tại lớp học (khích lệ, giao việc, thay đổi môi trường).
3. Cách thức phối hợp hiệu quả và tế nhị với gia đình.
Trình bày rõ ràng, thực tiễn và dễ áp dụng.`;

    try {
      const res = await generateContentWithFallback(
        prompt,
        'Bạn là chuyên gia tâm lý giáo dục và sư phạm thực hành.',
        (cur, next, err) => {
          setRetryNotice(`Model ${cur} lỗi: ${err}. Đang thử lại bằng ${next}...`);
        }
      );

      setInterventionAdvice(res.text.trim());
      setActiveModelUsed(res.modelUsed);
      setRetryNotice(null);
      onShowToast(`Đã hoàn thành kế hoạch qua ${res.modelUsed}!`, '💡');
    } catch (err: any) {
      setApiError(err?.message || String(err));
      onShowToast('Đã dừng do lỗi API!', '❌');
    } finally {
      setIsGenerating(false);
    }
  };

  // Tab 4: Send chat message (Multi-turn Pedagogical Copilot)
  const handleSendMessageChat = async (presetPrompt?: string) => {
    const messageToSend = presetPrompt || chatInput.trim();
    if (!messageToSend) return;

    if (!apiKey) {
      setApiError('Chưa cấu hình API Key. Vui lòng bấm "Lấy API key để sử dụng app" bên dưới để nhập key.');
      return;
    }

    const newMessages = [...chatMessages, { role: 'user' as const, text: messageToSend }];
    setChatMessages(newMessages);
    if (!presetPrompt) setChatInput('');

    setIsGenerating(true);
    setApiError(null);
    setRetryNotice(null);

    const systemInstruction = `Bạn là Trợ lý Cố vấn Sư phạm cao cấp chuyên sâu về Giáo dục phổ thông Việt Nam, đồng hành cùng Thầy ${config.teacherName}, Giáo viên chủ nhiệm lớp ${config.className} trường ${config.schoolName}.
Phong cách của bạn:
- Thấu hiểu tâm lý lứa tuổi học sinh, tôn trọng và giàu lòng nhân ái.
- Luôn bám sát quy chế giáo dục, Thông tư 32/2020/TT-BGDĐT của Bộ Giáo dục & Đào tạo về khen thưởng, kỷ luật học sinh.
- Đưa ra giải pháp thực tế, khéo léo trong giao tiếp với phụ huynh để tạo sự đồng thuận.
- Câu trả lời rõ ràng, có các bước hành động cụ thể cho thầy cô.`;

    const conversationContext = newMessages
      .map((m) => `${m.role === 'user' ? 'Thầy cô' : 'Cố vấn AI'}: ${m.text}`)
      .join('\n\n');

    try {
      const res = await generateContentWithFallback(
        conversationContext,
        systemInstruction,
        (cur, next, err) => {
          setRetryNotice(`Model ${cur} lỗi: ${err}. Đang chuyển sang ${next}...`);
        }
      );

      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: res.text.trim(), model: res.modelUsed },
      ]);
      setActiveModelUsed(res.modelUsed);
      setRetryNotice(null);
    } catch (err: any) {
      setApiError(err?.message || String(err));
      onShowToast('Đã dừng do lỗi API!', '❌');
    } finally {
      setIsGenerating(false);
    }
  };

  // Tab 5: Generate Weekly Speech
  const handleGenerateWeeklySpeech = async () => {
    if (!apiKey) {
      setApiError('Chưa cấu hình API Key. Vui lòng bấm "Lấy API key để sử dụng app" bên dưới để nhập key.');
      return;
    }

    setIsGenerating(true);
    setApiError(null);
    setRetryNotice(null);

    const totalViolations = history.filter((h) => h.type === 'VIOLATION').length;
    const totalCommendations = history.filter((h) => h.type === 'COMMENDATION').length;
    const totalAbsents = history.filter((h) => h.type === 'ABSENT').length;
    const violationSummary = history
      .filter((h) => h.type === 'VIOLATION')
      .flatMap((h) => h.violationTags)
      .slice(0, 10)
      .join(', ') || 'Không có vi phạm nghiêm trọng';

    const prompt = `Bạn là Trợ lý AI của Thầy ${config.teacherName}, GVCN lớp ${config.className} trường ${config.schoolName}.
Hãy soạn giúp Thầy một bài phát biểu và kịch bản chủ trì 15 phút cho TIẾT SINH HOẠT LỚP CUỐI TUẦN.
Dữ liệu nề nếp thực tế của lớp tuần qua:
- Sĩ số lớp: ${config.students.length} học sinh
- Số lượt khen thưởng / tuyên dương: ${totalCommendations}
- Số lượt vi phạm / nhắc nhở nề nếp: ${totalViolations} (${violationSummary})
- Số lượt vắng / muộn: ${totalAbsents}

Cấu trúc bài phát biểu cần:
1. Lời mở đầu thân thiện, tạo không khí cởi mở, gắn kết.
2. Sơ kết ngắn gọn, biểu dương các Tổ và cá nhân chăm ngoan, tích cực.
3. Nhắc nhở khéo léo các tồn tại (muộn giờ, quên bài) mà không làm học sinh bị tổn thương hay mất động lực.
4. Triển khai phương hướng, mục tiêu và giao nhiệm vụ tuần mới cho Ban cán sự.
5. Lời chúc và thông điệp truyền cảm hứng kết thúc tiết sinh hoạt.
Giọng văn: Sư phạm ấm áp, chuẩn mực, khích lệ, vừa nghiêm túc vừa gần gũi.`;

    try {
      const res = await generateContentWithFallback(
        prompt,
        'Bạn là chuyên gia sư phạm và cố vấn kỹ năng chủ nhiệm lớp xuất sắc.',
        (cur, next, err) => {
          setRetryNotice(`Model ${cur} lỗi: ${err}. Đang chuyển sang ${next}...`);
        }
      );

      setWeeklySpeech(res.text.trim());
      setActiveModelUsed(res.modelUsed);
      setRetryNotice(null);
      onShowToast(`Đã soạn kịch bản sinh hoạt qua ${res.modelUsed}!`, '📢');
    } catch (err: any) {
      setApiError(err?.message || String(err));
      onShowToast('Đã dừng do lỗi API!', '❌');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    onShowToast('Đã sao chép vào bộ nhớ tạm!', '📋');
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              <Bot className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>Trợ Lý AI Chủ Nhiệm</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/25 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-300" /> Gemini Powered
                </span>
              </h3>
              <p className="text-xs text-purple-200">
                Viết nhận xét học bạ, tinh chỉnh tin nhắn Zalo phụ huynh &amp; tư vấn sư phạm cho Thầy Phạm Hậu
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

        {/* Missing API Key Warning Callout */}
        {!apiKey && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Chưa có API Key:</strong> Người dùng cần nhập API Key để sử dụng các tính năng AI.
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenApiKey}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shrink-0 transition"
            >
              Nhập API Key ngay
            </button>
          </div>
        )}

        {/* Retry Notification (Complying with AI_INSTRUCTIONS) */}
        {retryNotice && (
          <div className="p-2.5 bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>{retryNotice}</span>
          </div>
        )}

        {/* Verbatim Red Error Box (Complying with AI_INSTRUCTIONS) */}
        {apiError && (
          <div className="p-3.5 m-4 mb-0 bg-rose-50 border-2 border-rose-500 rounded-2xl text-xs text-rose-950 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-sm text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Đã dừng do lỗi</span>
              </div>
              <button
                type="button"
                onClick={onOpenApiKey}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition text-[11px]"
              >
                Đổi API Key khác
              </button>
            </div>
            <div className="p-2 bg-white rounded-xl border border-rose-200 font-mono text-[11px] text-rose-800 break-all select-all">
              {apiError}
            </div>
            <p className="text-[11px] text-slate-600">
              💡 <em>Mẹo:</em> Nếu gặp lỗi <code>429 RESOURCE_EXHAUSTED</code>, hạn mức miễn phí của key hiện tại đã hết. Vui lòng lấy key mới tại{' '}
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 font-bold underline inline-flex items-center gap-0.5"
              >
                aistudio.google.com <ExternalLink className="w-3 h-3" />
              </a>{' '}
              và dán vào nút Settings trên Header.
            </p>
          </div>
        )}

        {/* Active Model Badge */}
        {activeModelUsed && (
          <div className="px-5 pt-2 flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Phản hồi thành công từ model: <code className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{activeModelUsed}</code></span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 flex gap-3 overflow-x-auto bg-slate-50 text-xs font-bold scrollbar-none">
          <button
            onClick={() => {
              setActiveTab('EVALUATION');
              setApiError(null);
            }}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'EVALUATION'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Nhận Xét Học Bạ</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ZALO_REWRITE');
              setApiError(null);
            }}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'ZALO_REWRITE'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Tinh Chỉnh Tin Zalo PH</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('INTERVENTION');
              setApiError(null);
            }}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'INTERVENTION'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Can Thiệp Sư Phạm</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('PEDAGOGICAL_CHAT');
              setApiError(null);
            }}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'PEDAGOGICAL_CHAT'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>💬 Cố Vấn Sư Phạm (Chat)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('WEEKLY_SPEECH');
              setApiError(null);
            }}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'WEEKLY_SPEECH'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>📢 Kịch Bản Sinh Hoạt Tuần</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'EVALUATION' && (
            <div className="space-y-4">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn học sinh cần viết nhận xét rèn luyện:
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setEvaluationResults([]);
                    }}
                    className="flex-1 p-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-purple-500 outline-hidden"
                  >
                    {config.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        STT {s.stt} - {s.name} {s.group ? `(Tổ ${s.group})` : ''} {s.role ? `• ${s.role}` : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleGenerateEvaluation}
                    disabled={isGenerating}
                    className={`px-4 py-2.5 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer ${
                      isGenerating
                        ? 'bg-purple-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700'
                    }`}
                  >
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isGenerating ? 'AI đang viết...' : 'AI Soạn Nhận Xét'}</span>
                  </button>
                </div>
              </div>

              {/* Student Summary badge */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-slate-700">
                <span className="font-bold text-slate-900">
                  Dữ liệu thực tế: {currentStudent?.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-semibold">Tuyên dương: {commendations.length}</span>
                  <span className="text-rose-700 font-semibold">Vi phạm: {violations.length}</span>
                  <span className="text-amber-700 font-semibold">Vắng: {absents.length}</span>
                </div>
              </div>

              {/* Generated Results */}
              {evaluationResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  {evaluationResults.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900 text-[11px]">{res.label}</span>
                        <button
                          onClick={() => copyText(res.text, idx)}
                          className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 font-semibold rounded-lg border border-purple-200 shadow-2xs flex items-center gap-1 transition"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-slate-800 text-xs leading-relaxed font-medium bg-white p-2.5 rounded-xl border border-purple-100 whitespace-pre-wrap">
                        {res.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ZALO_REWRITE' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhập nội dung phác thảo ban đầu:
                </label>
                <textarea
                  rows={3}
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
                  placeholder="Nhập nội dung bạn muốn gửi..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn phong cách truyền đạt mong muốn:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setZaloTone('GENTLE')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      zaloTone === 'GENTLE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    🌱 Tế nhị &amp; Thấu hiểu
                  </button>

                  <button
                    type="button"
                    onClick={() => setZaloTone('FORMAL')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      zaloTone === 'FORMAL'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    🏛️ Chuẩn mực sư phạm
                  </button>

                  <button
                    type="button"
                    onClick={() => setZaloTone('STRICT')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      zaloTone === 'STRICT'
                        ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    ⚠️ Nghiêm túc, cần gặp
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRewriteZalo}
                disabled={isGenerating}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGenerating ? 'AI đang tinh chỉnh...' : 'Viết Lại Tin Nhắn Zalo'}</span>
              </button>

              {rewrittenMessage && (
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-xs">Tin nhắn hoàn thiện sẵn sàng gửi Zalo:</span>
                    <button
                      onClick={() => copyText(rewrittenMessage, 99)}
                      className="px-3 py-1 bg-white hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-200 shadow-2xs flex items-center gap-1"
                    >
                      {copiedIndex === 99 ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100 text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                    {rewrittenMessage}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'INTERVENTION' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả hành vi hoặc khó khăn của học sinh:
                </label>
                <textarea
                  rows={2}
                  value={behaviorIssue}
                  onChange={(e) => setBehaviorIssue(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
                  placeholder="Ví dụ: Thường xuyên trốn học tiết 5, nói năng bỗ bã với bạn..."
                />
              </div>

              <button
                type="button"
                onClick={handleGetIntervention}
                disabled={isGenerating}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                <span>{isGenerating ? 'AI đang tư vấn...' : 'Tạo Giải Pháp Can Thiệp Sư Phạm'}</span>
              </button>

              {interventionAdvice && (
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-xs">Chiến lược giáo dục đề xuất:</span>
                    <button
                      onClick={() => copyText(interventionAdvice, 100)}
                      className="px-3 py-1 bg-white hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-200 shadow-2xs flex items-center gap-1"
                    >
                      {copiedIndex === 100 ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5 bg-white rounded-xl border border-purple-100 text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {interventionAdvice}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PEDAGOGICAL COPILOT CHAT */}
          {activeTab === 'PEDAGOGICAL_CHAT' && (
            <div className="space-y-4 flex flex-col h-[480px]">
              {/* Preset quick question pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <span className="font-bold text-slate-500 shrink-0">Gợi ý hỏi nhanh:</span>
                {[
                  'Xử lý học sinh hay trốn tiết chơi game?',
                  'Học sinh có biểu hiện bị cô lập trong lớp?',
                  'Quy trình kỷ luật theo Thông tư 32?',
                  'Cách trao đổi khi phụ huynh không hợp tác?',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessageChat(preset)}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg border border-purple-200 shrink-0 cursor-pointer font-medium"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Chat message history container */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 mb-0.5 px-1 font-semibold">
                      {msg.role === 'user' ? `Thầy ${config.teacherName}` : 'Cố vấn Sư phạm AI'}
                      {msg.model && ` (${msg.model})`}
                    </div>
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex items-center gap-2 text-slate-400 italic text-xs p-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>AI đang phân tích và soạn câu trả lời sư phạm...</span>
                  </div>
                )}
              </div>

              {/* Chat input box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessageChat();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhập tình huống sư phạm cần tư vấn..."
                  className="flex-1 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden bg-white"
                />
                <button
                  type="submit"
                  disabled={isGenerating || !chatInput.trim()}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Gửi
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: WEEKLY SPEECH SCRIPT */}
          {activeTab === 'WEEKLY_SPEECH' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl text-purple-900 leading-relaxed">
                📢 <strong>Tự động đọc số liệu tuần:</strong> AI sẽ tổng hợp toàn bộ các ca vắng, vi phạm và tuyên dương của <strong>Lớp {config.className}</strong> để soạn sẵn bài phát biểu sinh hoạt 15 phút tràn đầy cảm hứng cho <strong>Thầy {config.teacherName}</strong>.
              </div>

              <button
                type="button"
                onClick={handleGenerateWeeklySpeech}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300" />}
                <span>{isGenerating ? 'AI đang tổng hợp và soạn bài...' : 'Tạo Kịch Bản Sinh Hoạt Tuần Này'}</span>
              </button>

              {weeklySpeech && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Kịch bản chi tiết:</span>
                    <button
                      onClick={() => copyText(weeklySpeech, 200)}
                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-200 shadow-2xs flex items-center gap-1"
                    >
                      {copiedIndex === 200 ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-sans whitespace-pre-wrap max-h-[380px] overflow-y-auto">
                    {weeklySpeech}
                  </div>
                </div>
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
