import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';

interface ApiKeyManagerProps {
  onKeyUpdate: (newKey: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeyUpdate }) => {
  const [keyInput, setKeyInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("GEMINI_API_KEY") || "";
    setKeyInput(savedKey);
    if (!savedKey) setIsEditing(true);
  }, []);

  const handleSave = () => {
    const trimmed = keyInput.trim();
    localStorage.setItem("GEMINI_API_KEY", trimmed);
    console.log("Gemini Key saved: " + (trimmed ? trimmed.slice(0, 10) + "..." : "empty"));
    onKeyUpdate(trimmed);
    setIsSaved(true);
    setIsEditing(false);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const hasStoredKey = !!localStorage.getItem("GEMINI_API_KEY");

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[99999] w-[90vw] md:w-[320px] animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
              <Key size={18} />
            </div>
            <h3 className="text-sm font-black text-white tracking-tight">Gemini API Key</h3>
          </div>
          {hasStoredKey && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
              title="修改 Key"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {isEditing ? (
            <>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="輸入您的 Gemini API Key"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
              />
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                <Save size={14} /> 儲存並啟用
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                <CheckCircle size={16} />
                <span>Gemini Key 已設定</span>
              </div>
            </div>
          )}

          {isSaved && (
            <p className="text-[10px] text-emerald-400 font-bold text-center animate-in fade-in duration-300">
              設定已更新，立即可用。
            </p>
          )}

          {!hasStoredKey && !isEditing && (
            <div className="flex items-center gap-2 text-[9px] text-rose-400 font-bold bg-rose-500/10 p-2 rounded-lg">
              <AlertCircle size={12} />
              請設定 Key 以啟動教練模式
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
