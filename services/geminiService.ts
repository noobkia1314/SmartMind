
import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ApiKeyManagerProps {
  onKeyUpdate: (newKey: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeyUpdate }) => {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const savedKey = localStorage.getItem("GEMINI_API_KEY") || "";
    setKeyInput(savedKey);
    console.log("API Key input moved to left side, key present: " + !!savedKey);
  }, []);

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (trimmed.length > 0 && trimmed.length < 10) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    localStorage.setItem("GEMINI_API_KEY", trimmed);
    onKeyUpdate(trimmed);
    setSaveStatus('success');
    
    // Auto reset success message after 5 seconds
    setTimeout(() => setSaveStatus('idle'), 5000);
  };

  const hasKey = keyInput.trim().length >= 10;

  return (
    <div className="fixed bottom-20 md:bottom-5 left-5 z-[9999] w-[320px] max-w-[90vw] animate-in slide-in-from-bottom-5 duration-500" style={{ left: 'max(1.25rem, 5vw)' }}>
      <div className="bg-[#0f172a] border border-indigo-500/30 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
            <Key size={18} />
          </div>
          <h3 className="text-sm font-black text-white tracking-tight">設定 API Key (Gemini / DeepSeek)</h3>
          {hasKey && (
            <CheckCircle size={14} className="text-emerald-400 ml-auto animate-pulse" />
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="貼上你的 API Key"
              className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 pr-10"
            />
            <button 
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg ${
              saveStatus === 'success' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            <Save size={14} /> 
            {saveStatus === 'success' ? '已儲存並啟用' : '儲存並啟用'}
          </button>

          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold justify-center animate-in fade-in zoom-in duration-300">
              <CheckCircle size={12} />
              API Key 已儲存並啟用
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-[10px] text-rose-400 font-bold justify-center animate-in shake duration-300">
              <AlertCircle size={12} />
              Key 長度不足，請確認格式
            </div>
          )}

          {!hasKey && (
            <p className="text-[9px] text-slate-500 text-center font-medium leading-relaxed">
              * 需要 API Key 才能使用 AI 教練功能。<br/>
              Key 僅存於瀏覽器本地，不會上傳至伺服器。
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
