
import React, { useState } from 'react';
import { LayoutDashboard, Target, Settings, LogOut, Key, CheckCircle, Smartphone, User } from 'lucide-react';

interface SidebarProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  user: { name: string; isLoggedIn: boolean; provider: string | null };
  onLogout: () => void;
  onLogin: (provider: 'google' | 'anonymous') => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  apiKey, 
  setApiKey, 
  user, 
  onLogout, 
  onLogin, 
  activeView, 
  setActiveView 
}) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [saved, setSaved] = useState(!!apiKey);

  const handleSaveKey = () => {
    setApiKey(tempKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const navItems = [
    { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'goals', icon: Target, label: 'My Goals' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-slate-900 border-r border-slate-800 p-4 fixed left-0 top-0 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Smartphone className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">SmartMind</h1>
        </div>

        <nav className="flex-1 space-y-1">
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

        <div className="mt-8 pt-8 border-t border-slate-800">
          <div className="px-2 mb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Gemini API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="Enter API Key"
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button 
                onClick={handleSaveKey}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded transition-colors text-slate-300"
              >
                <Key size={14} />
              </button>
            </div>
            {saved && (
              <div className="flex items-center gap-1 mt-2 text-emerald-500 text-[10px] font-medium animate-pulse">
                <CheckCircle size={10} />
                <span>API Key Configured</span>
              </div>
            )}
          </div>

          {!user.isLoggedIn ? (
            <div className="space-y-2">
              <button 
                onClick={() => onLogin('google')}
                className="w-full bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-4 h-4" alt="G" />
                Google Login
              </button>
              <button 
                onClick={() => onLogin('anonymous')}
                className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                Guest Access
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

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-2 z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeView === item.id ? 'text-indigo-500' : 'text-slate-400'
            }`}
          >
            <item.icon size={24} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
