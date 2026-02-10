
import React, { useState, useEffect } from 'react';
import { Key, CheckCircle } from 'lucide-react';

interface ApiKeyOverlayProps {
  apiKey: string;
  onSave: (key: string) => void;
}

const ApiKeyOverlay: React.FC<ApiKeyOverlayProps> = ({ apiKey, onSave }) => {
  const [inputValue, setInputValue] = useState(apiKey);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setInputValue(apiKey);
    console.log("Key input forced visible - Current state:", apiKey ? "Set" : "Empty");
  }, [apiKey]);

  const handleSave = () => {
    if (!inputValue.trim()) {
      alert("請輸入有效的 API Key");
      return;
    }
    onSave(inputValue);
    setShowSuccess(true);
    alert("API Key 已成功儲存！");
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[99999] animate-in slide-in-from-right-10 duration-500">
      <div className="bg-gradient-to-br from-indigo-700 to-violet-900 p-4 rounded-2xl shadow-2xl border border-indigo-400/30 w-72 md:w-80 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <Key className="text-indigo-200 w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">設定 Gemini API Key</h3>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="貼上你的 API Key..."
              className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            />
          </div>
          
          <button
            onClick={handleSave}
            className="w-full bg-white text-indigo-900 font-bold py-2 rounded-xl text-sm hover:bg-indigo-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            儲存 API Key
          </button>
          
          {apiKey && (
            <div className={`flex items-center justify-center gap-1.5 transition-opacity duration-300 ${showSuccess || apiKey ? 'opacity-100' : 'opacity-0'}`}>
              <CheckCircle className="text-emerald-400 w-3.5 h-3.5" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">已設定完成</span>
            </div>
          )}
        </div>
        
        <p className="mt-2 text-[10px] text-indigo-200/60 text-center leading-tight">
          密鑰僅儲存於本地瀏覽器 (LocalStorage)
        </p>
      </div>
    </div>
  );
};

export default ApiKeyOverlay;
