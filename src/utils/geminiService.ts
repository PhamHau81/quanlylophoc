/**
 * Gemini API Service with Automatic Fallback & Retry
 * Complies with AI_INSTRUCTIONS.md:
 * - Default: gemini-3-flash-preview
 * - Fallback chain: gemini-3-flash-preview -> gemini-3-pro-preview -> gemini-2.5-flash
 * - Reads key from localStorage, falls back to env variable
 * - Verbatim error reporting on failure
 */

export const STORAGE_KEY_API_KEY = 'gemini_user_api_key';
export const STORAGE_KEY_MODEL = 'gemini_selected_model';

export const SUPPORTED_MODELS = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash (Mặc định)',
    tag: 'Khuyên dùng',
    description: 'Phản hồi siêu nhanh, tối ưu cho nhận xét học bạ và soạn tin Zalo.',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    tag: 'Nâng cao',
    description: 'Khả năng suy luận sư phạm sâu sắc cho các trường hợp cá biệt.',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tag: 'Dự phòng',
    description: 'Phiên bản ổn định cao, dự phòng khi các model preview bận.',
  },
];

export function getStoredApiKey(): string {
  try {
    const key = localStorage.getItem(STORAGE_KEY_API_KEY);
    if (key && key.trim()) return key.trim();
  } catch (e) {
    console.error('Error reading API key from localStorage', e);
  }
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
}

export function setStoredApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
  } catch (e) {
    console.error('Error saving API key to localStorage', e);
  }
}

export function removeStoredApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_API_KEY);
  } catch (e) {
    console.error('Error removing API key from localStorage', e);
  }
}

export function getStoredModel(): string {
  try {
    const model = localStorage.getItem(STORAGE_KEY_MODEL);
    if (model && SUPPORTED_MODELS.some(m => m.id === model)) return model;
  } catch (e) {
    console.error('Error reading model from localStorage', e);
  }
  return 'gemini-3-flash-preview';
}

export function setStoredModel(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODEL, modelId);
  } catch (e) {
    console.error('Error saving model to localStorage', e);
  }
}

/**
 * Calls Google Gemini REST API with automatic multi-model fallback.
 * If Step fails, automatically switches to next model in order.
 */
export async function generateContentWithFallback(
  prompt: string,
  systemInstruction?: string,
  onRetryNotification?: (currentModel: string, nextModel: string, error: string) => void
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key. Vui lòng nhấn vào "Settings (API Key)" trên thanh điều hướng để nhập Gemini API Key của bạn.');
  }

  const selectedModel = getStoredModel();
  
  // Construct fallback chain starting with the chosen model, followed by the rest
  const defaultChain = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash'];
  const chain = [selectedModel, ...defaultChain.filter(m => m !== selectedModel)];

  let lastError = '';

  for (let i = 0; i < chain.length; i++) {
    const currentModel = chain[i];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

      const requestBody: any = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const msg = errorData?.error?.message || response.statusText || 'Unknown error';
        const formattedErr = `${status} ${msg}`;
        throw new Error(formattedErr);
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('API trả về phản hồi rỗng.');
      }

      return {
        text: generatedText,
        modelUsed: currentModel,
      };
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[Gemini Fallback] Model ${currentModel} failed: ${lastError}`);

      // If there is another model in chain, notify and continue loop
      if (i < chain.length - 1) {
        const nextModel = chain[i + 1];
        if (onRetryNotification) {
          onRetryNotification(currentModel, nextModel, lastError);
        }
      }
    }
  }

  // If all models failed, throw verbatim error
  throw new Error(`Tất cả các model AI đều thất bại. Chi tiết lỗi từ API: ${lastError}`);
}
