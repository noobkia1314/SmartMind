
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import CoachDashboard from './components/CoachDashboard';
import GoalList from './components/GoalList';
import { AppState, UserGoal } from './types';
import { GeminiService } from './services/geminiService';
import { Target, BrainCircuit, Rocket, AlertCircle, CheckCircle, RefreshCw, Info, PlusCircle, ListTodo } from 'lucide-react';

const INITIAL_STATE: AppState = {
  user: { name: 'Guest User', isLoggedIn: false, provider: null },
  goals: [],
  activeGoalId: null,
};

const App: React.FC = () => {
  // Debug log for key loading
  useEffect(() => {
    console.log("App loaded, key: " + localStorage.getItem("GEMINI_API_KEY"));
  }, []);

  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('smartmind_state');
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
      console.error("Failed to parse state", e);
      return INITIAL_STATE;
    }
  });

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [activeView, setActiveView] = useState('home');
  const [goalInput, setGoalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServiceBusy, setIsServiceBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem('smartmind_state', JSON.stringify(state));
  }, [state]);

  const gemini = useMemo(() => new GeminiService(), [apiKey]);

  const handleSaveApiKey = (newKey: string) => {
    localStorage.setItem('GEMINI_API_KEY', newKey);
    setApiKey(newKey);
    console.log("Key updated: " + newKey);
  };

  const handleLogin = (provider: 'google' | 'anonymous') => {
    setState(prev => ({
      ...prev,
      user: {
        name: provider === 'google' ? 'Simulated User' : 'Guest Traveler',
        isLoggedIn: true,
        provider
      }
    }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, user: INITIAL_STATE.user }));
  };

  const handleStartGoal = async () => {
    if (!goalInput.trim()) return;
    if (!apiKey) {
      setError("請先設定 Gemini API Key 以啟動教練模式。");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setIsServiceBusy(false);
    try {
      const data = await gemini.generateGoalStructure(goalInput);
      if (!data) throw new Error("Generation failed");

      const newGoal: UserGoal = {
        id: crypto.randomUUID(),
        title: goalInput,
        description: '',
        startDate: new Date().toISOString(),
        mindMap: data.mindMap,
        tasks: data.tasks.map((t: any) => ({
          id: crypto.randomUUID(),
          title: t.title,
          category: t.category,
          completed: false,
          date: new Date().toISOString().split('T')[0]
        })),
        foodLogs: [],
        exerciseLogs: [],
        readingLogs: [],
        financeLogs: []
      };

      setState(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal],
        activeGoalId: newGoal.id
      }));
      setActiveView('coach');
      setGoalInput('');
    } catch (err: any) {
      console.error(err);
      const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('Service Unavailable') || err?.message?.includes('overloaded');
      
      if (is503) {
        console.log("Gemini 503 detected, retry later");
        setIsServiceBusy(true);
      } else {
        setError("無法啟動 AI 教練。請確保您的 API Key 有效且具備存取權限。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGoal = (goalId: string) => {
    setState(prev => ({...prev, activeGoalId: goalId}));
    setActiveView('coach');
  };

  const updateActiveGoal = (updatedGoal: UserGoal) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
    }));
  };

  const activeGoal = state.goals.find(g => g.id === state.activeGoalId);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-200">
      <Sidebar 
        user={state.user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen overflow-x-hidden pb-32">
        {/* API Key Status Header */}
        <div className="max-w-4xl mx-auto mb-6">
          {!apiKey ? (
            <div className="flex items-center gap-3 p-4 bg-rose-500/20 border border-rose-500/50 rounded-2xl text-rose-400 animate-pulse">
              <AlertCircle size={24} className="shrink-0" />
              <div>
                <p className="font-black">請設定 Gemini API Key</p>
                <p className="text-xs opacity-80">在側邊欄輸入 API Key 以啟動 AI 教練模式。</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-500">
              <CheckCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">系統連線：穩定</p>
            </div>
          )}
        </div>

        {activeView === 'home' && (
          <div className="max-w-4xl mx-auto py-4 space-y-12">
            {/* 永遠顯示在頂部的目標清單卡片 */}
            {state.goals.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                  <h2 className="text-xl font-black text-white tracking-widest uppercase">當前執行中的任務</h2>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  <GoalList 
                    goals={state.goals} 
                    onSelectGoal={handleSelectGoal}
                  />
                </div>
              </div>
            )}

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-2">
                <BrainCircuit className="text-indigo-500 w-12 h-12" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Architect Your Best Self with <span className="text-indigo-500">SmartMind</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Define your vision, and let our generative AI coach build the roadmap.
              </p>
            </div>

            {/* 目標輸入區域 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32"></div>
              
              <div className="relative space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="text-white w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">啟動新的 AI 目標</h2>
                </div>

                <textarea
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="例如：'在 6 個月內精通 TypeScript 並啟動 SaaS 業務'..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-6 text-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-h-[140px] shadow-inner tracking-wide leading-relaxed"
                />

                {isServiceBusy && (
                  <div className="bg-sky-500/10 border-2 border-sky-500/30 text-sky-400 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-4">
                    <div className="p-3 bg-sky-500/20 rounded-full shrink-0 animate-pulse">
                      <RefreshCw size={24} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="font-black text-lg text-sky-300">AI 伺服器目前忙碌中</p>
                      <p className="text-sm opacity-90">目前請求量較大，請稍後重試。</p>
                    </div>
                    <button 
                      onClick={handleStartGoal}
                      className="shrink-0 flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                    >
                      <RefreshCw size={18} />
                      重試
                    </button>
                  </div>
                )}

                {error && !isServiceBusy && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <button 
                  onClick={handleStartGoal}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-4 rounded-2xl text-xl font-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      AI 分析中...
                    </>
                  ) : (
                    <>
                      <Rocket size={24} />
                      建立核心藍圖
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'goals' && (
          <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-3xl font-black text-white tracking-tight">所有任務存檔</h2>
               <button 
                onClick={() => setActiveView('home')}
                className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-indigo-500/30"
               >
                 <PlusCircle size={18} />
                 新目標
               </button>
            </div>
            
            <div className="pr-2">
              {state.goals.length === 0 ? (
                <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center">
                  <Target className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">尚無目標，快去主頁啟動你的第一個 AI 任務！</p>
                </div>
              ) : (
                <GoalList 
                  goals={state.goals} 
                  onSelectGoal={handleSelectGoal}
                />
              )}
            </div>
          </div>
        )}

        {activeView === 'coach' && activeGoal && (
          <CoachDashboard 
            goal={activeGoal} 
            gemini={gemini}
            onUpdateGoal={updateActiveGoal}
          />
        )}

        {activeView === 'settings' && (
          <div className="max-w-2xl mx-auto py-8">
            <h2 className="text-3xl font-black text-white mb-8 tracking-tight">系統偏好</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-2">資料安全</p>
                <p className="text-sm text-slate-400">所有目標與對話紀錄皆儲存於您的本地裝置 (localStorage)，不會上傳至中央伺服器。</p>
              </div>
              <button 
                onClick={() => { if(confirm('確定要清除所有本地資料與 API 金鑰嗎？此動作無法復原。')) { localStorage.clear(); window.location.reload(); } }}
                className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-6 py-4 rounded-xl text-sm font-bold transition-all border border-rose-500/30"
              >
                清除所有本地快存
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
