import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { langService } from '../services/langService.ts';

interface ApiKeyManagerProps {
  onKeyUpdate: (newKey: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeyUpdate }) => {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const t = (text: string) => langService.t(text);

  useEffect(() => {
    const savedKey = localStorage.getItem("GEMINI_API_KEY") || "";
    setKeyInput(savedKey);
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
    setTimeout(() => setSaveStatus('idle'), 5000);
  };

  const hasKey = keyInput.trim().length >= 10;

  return (
    <div className="fixed bottom-20 md:bottom-5 left-5 z-[9999] w-[320px] max-w-[90vw]" style={{ left: 'max(1.25rem, 5vw)' }}>
      <div className="bg-[#0f172a] border border-indigo-500/30 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
            <Key size={18} />
          </div>
          <h3 className="text-sm font-black text-white tracking-tight">{t('設定 API Key (Gemini / DeepSeek)')}</h3>
          {hasKey && <CheckCircle size={14} className="text-emerald-400 ml-auto" />}
        </div>
        <div className="space-y-4">
          <div className="relative">
            <input type={showKey ? "text" : "password"} value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder={t("貼上你的 API Key")} className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white" />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{showKey ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
          <button onClick={handleSave} className={`w-full py-3 rounded-xl text-xs font-black text-white ${saveStatus === 'success' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
            <Save size={14} className="inline mr-2" /> {saveStatus === 'success' ? t('已儲存並啟用') : t('儲存並啟用')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
