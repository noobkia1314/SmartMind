
import React, { useState } from 'react';
import { LayoutDashboard, Target, Settings, LogOut, Smartphone, User, Key, Save, Check } from 'lucide-react';

interface SidebarProps {
  user: { name: string; isLoggedIn: boolean; provider: string | null };
  onLogout: () => void;
  onLogin: (provider: 'google' | 'anonymous') => void;
  activeView: string;
  setActiveView: (view: string) => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  onLogout, 
  onLogin, 
  activeView, 
  setActiveView,
  apiKey,
  onSaveApiKey
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);

  const navItems = [
    { id: 'home', icon: LayoutDashboard, label: '主頁' },
    { id: 'goals', icon: Target, label: '目標' },
    { id: 'settings', icon: Settings, label: '設定' },
  ];

  const handleSave = () => {
    onSaveApiKey(keyInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-slate-900 border-r border-slate-800 p-4 fixed left-0 top-0 overflow-y-auto custom-scrollbar z-40">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Smartphone className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">SmartMind</h1>
        </div>

        <nav className="space-y-1 mb-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Permanent API Key Section in Sidebar */}
        <div className="mb-8 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-widest">
            <Key size={14} className="text-indigo-500" />
            API Key 設定
          </div>
          <input 
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="輸入 Gemini API Key"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <button 
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
              isSaved ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white'
            }`}
          >
            {isSaved ? <Check size={16} /> : <Save size={16} />}
            {isSaved ? '已設定' : '儲存按鈕'}
          </button>
        </div>

        <div className="mt-auto pt-8 border-t border-slate-800">
          {!user.isLoggedIn ? (
            <div className="space-y-2">
              <button 
                onClick={() => onLogin('google')}
                className="w-full bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                Google 登入
              </button>
              <button 
                onClick={() => onLogin('anonymous')}
                className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                Anonymous 登入
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <User size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 uppercase">{user.provider}</p>
              </div>
              <button onClick={onLogout} className="text-slate-400 hover:text-rose-500">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Navigation (Bottom Nav) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-around items-center p-3 z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeView === item.id ? 'text-indigo-500' : 'text-slate-500'
            }`}
          >
            <item.icon size={24} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
        {/* Mobile quick settings for key */}
        <button
          onClick={() => setActiveView('settings')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeView === 'settings' ? 'text-indigo-500' : 'text-slate-500'
          }`}
        >
          <Key size={24} />
          <span className="text-[10px] font-bold">金鑰</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
