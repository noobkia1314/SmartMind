
import React from 'react';
import { LayoutDashboard, Target, Settings, LogOut, Smartphone, UserCircle, LogIn, Cloud } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface SidebarProps {
  user: UserProfile;
  onLogout: () => void;
  onLogin: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  onLogout, 
  onLogin, 
  activeView, 
  setActiveView,
}) => {
  const navItems = [
    { id: 'home', icon: LayoutDashboard, label: '主頁' },
    { id: 'goals', icon: Target, label: '目標庫' },
    { id: 'settings', icon: Settings, label: '設定' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-slate-900 border-r border-slate-800 p-4 fixed left-0 top-0 overflow-y-auto custom-scrollbar z-40">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Smartphone className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white italic">SmartMind</h1>
        </div>

        <nav className="space-y-1 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={activeView === item.id ? 'animate-pulse' : ''} />
                <span className="font-black text-sm tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800 space-y-4">
          {!user.isLoggedIn ? (
            <button 
              onClick={onLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95"
            >
              <LogIn size={16} />
              用 Google 登入
            </button>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-2xl border border-slate-800 transition-all hover:border-indigo-500/30">
              <div className="shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full border border-indigo-500/30 shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <UserCircle size={22} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate leading-tight">{user.name || 'Explorer'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className={`text-[8px] uppercase tracking-widest font-black ${user.provider === 'google' ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {user.provider === 'google' ? 'Cloud Sync' : 'Guest Mode'}
                  </p>
                  {user.provider === 'google' && <Cloud size={8} className="text-emerald-500" />}
                </div>
              </div>
              <button onClick={onLogout} className="text-slate-600 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-500/5">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Navigation (Bottom Nav) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-around items-center p-3 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeView === item.id ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              <Icon size={22} />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          );
        })}
        {user.isLoggedIn && (
          <button
            onClick={() => setActiveView('settings')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeView === 'settings' ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full border border-indigo-500/30" />
            ) : (
              <UserCircle size={22} />
            )}
            <span className="text-[9px] font-black uppercase tracking-widest">設定</span>
          </button>
        )}
      </nav>
    </>
  );
};

export default Sidebar;
