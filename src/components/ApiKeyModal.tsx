import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, Eye, EyeOff, Sparkles, ShieldCheck, Trash2 } from 'lucide-react';
import {
  getStoredApiKey,
  setStoredApiKey,
  removeStoredApiKey,
  getStoredModel,
  setStoredModel,
  SUPPORTED_MODELS,
} from '../utils/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setSelectedModel(getStoredModel());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) {
      onShowToast('Vui lòng nhập API Key hợp lệ!', '⚠️');
      return;
    }
    setStoredApiKey(trimmed);
    setStoredModel(selectedModel);
    setIsSaved(true);
    onShowToast('Đã lưu cấu hình API Key & Model thành công!', '✅');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClear = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa API Key đã lưu?')) {
      removeStoredApiKey();
      setApiKey('');
      onShowToast('Đã xóa API Key khỏi trình duyệt.', '🗑️');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
              <Key className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>Thiết Lập Model &amp; Gemini API Key</span>
              </h3>
              <p className="text-xs text-blue-100">
                Lưu trực tiếp trong trình duyệt của bạn (LocalStorage) - An toàn và riêng tư
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
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Guide callout */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 leading-relaxed">
            <div className="font-bold text-sm text-amber-950 flex items-center gap-1.5 mb-1">
              <span>🔑</span> Hướng dẫn lấy Gemini API Key miễn phí:
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-700 text-xs">
              <li>
                Truy cập cổng Google AI Studio:{' '}
                <a
                  href="https://aistudio.google.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                >
                  https://aistudio.google.com/api-keys
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Đăng nhập bằng tài khoản Google cá nhân của bạn.</li>
              <li>Bấm nút <strong>"Create API key"</strong>, sao chép chuỗi ký tự và dán vào ô bên dưới.</li>
            </ol>
          </div>

          {/* 1. MODEL SELECTION CARDS */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              1. Chọn Model AI ưu tiên (Có tự động Fallback chuyển đổi khi bận):
            </label>
            <div className="space-y-2">
              {SUPPORTED_MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{m.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.id === 'gemini-3-flash-preview'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.tag}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{m.description}</p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic mt-1.5">
              🔄 <strong>Cơ chế tự động:</strong> Nếu model được chọn gặp lỗi hoặc hết hạn mức (429), hệ thống sẽ tự động thử lại ngay với các model dự phòng tiếp theo.
            </p>
          </div>

          {/* 2. API KEY INPUT */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              2. Nhập Gemini API Key của bạn:
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán chuỗi API Key bắt đầu bằng AIzaSy..."
                className="w-full text-xs sm:text-sm pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono bg-slate-50/60"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showKey ? 'Ẩn' : 'Hiện'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Key chỉ được lưu cục bộ trong trình duyệt này, không bao giờ gửi về máy chủ trung gian.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Key</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Cấu Hình</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
