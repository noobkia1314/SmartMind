
import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle, AlertCircle } from 'lucide-react';

const ApiKeyManager: React.FC = () => {
  const [keyInput, setKeyInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("GEMINI_API_KEY") || "";
    setKeyInput(savedKey);
    console.log("API Key input box forced rendered, current key: " + (savedKey ? savedKey.slice(0, 10) + "..." : "none"));
  }, []);

  const handleSave = () => {
    localStorage.setItem("GEMINI_API_KEY", keyInput.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    // Refresh the page to ensure all services pick up the new key
    window.location.reload();
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[99999] w-[90vw] md:w-[320px] animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
            <Key size={18} />
          </div>
          <h3 className="text-sm font-black text-white tracking-tight">設定 Gemini API Key</h3>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="輸入您的 Gemini API Key"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
          />

          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
              isSaved 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isSaved ? (
              <><CheckCircle size={14} /> 已儲存並啟用</>
            ) : (
              <><Save size={14} /> 儲存並啟用</>
            )}
          </button>

          {isSaved && (
            <p className="text-[10px] text-emerald-400 font-bold text-center animate-in fade-in duration-300">
              API Key 已設定，頁面將自動刷新。
            </p>
          )}

          {!localStorage.getItem("GEMINI_API_KEY") && !process.env.API_KEY && (
            <div className="flex items-center gap-2 text-[9px] text-rose-400 font-bold bg-rose-500/10 p-2 rounded-lg">
              <AlertCircle size={12} />
              請輸入 Key 以啟用 AI 教練功能
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
