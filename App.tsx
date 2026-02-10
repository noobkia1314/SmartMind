
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import CoachDashboard from './components/CoachDashboard';
import GoalList from './components/GoalList';
import { AppState, UserGoal } from './types';
import { GeminiService } from './services/geminiService';
import { Target, BrainCircuit, Rocket, AlertCircle, CheckCircle, RefreshCw, Info, PlusCircle, UserCircle } from 'lucide-react';

const INITIAL_STATE: AppState = {
  user: { name: 'Guest User', isLoggedIn: false, provider: null },
  goals: [],
  activeGoalId: null,
};

const DEMO_GOAL_TEMPLATE = {
  title: "減重 5kg 健康轉型 (示範)",
  mindMap: {
    id: "root",
    label: "減重 5kg 核心計畫",
    children: [
      { id: "c1", label: "熱量赤字管理" },
      { id: "c2", label: "高強度間歇訓練" },
      { id: "c3", label: "睡眠與恢復優化" },
      { id: "c4", label: "水分攝取監控" }
    ]
  },
  tasks: [
    { title: "晨起空腹飲水 500cc", category: "Diet" },
    { title: "完成 30 分鐘有氧運動", category: "Exercise" },
    { title: "記錄今日所有飲食熱量", category: "Diet" },
    { title: "閱讀一篇減脂相關文獻", category: "Reading" },
    { title: "晚上 11 點前就寢", category: "Health" },
    { title: "準備明天的健康午餐便當", category: "Finance" },
    { title: "睡前進行 5 分鐘冥想", category: "Health" }
  ]
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('smartmind_state');
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
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
    setError(null);
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
    if (!goalInput.trim() && apiKey) return;
    
    setIsLoading(true);
    setError(null);
    setIsServiceBusy(false);

    try {
      let goalData;
      let isDemo = false;

      if (!apiKey) {
        // Guest Mode Logic
        goalData = DEMO_GOAL_TEMPLATE;
        isDemo = true;
      } else {
        // Real AI Logic
        goalData = await gemini.generateGoalStructure(goalInput);
      }

      if (!goalData) throw new Error("Generation failed");

      const newGoal: UserGoal = {
        id: crypto.randomUUID(),
        title: isDemo ? goalData.title : goalInput,
        description: '',
        startDate: new Date().toISOString(),
        mindMap: goalData.mindMap,
        isDemo: isDemo,
        tasks: goalData.tasks.map((t: any) => ({
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
      const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('overloaded');
      if (is503) setIsServiceBusy(true);
      else setError("無法啟動。請確保您的 API Key 有效。");
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
        <div className="max-w-4xl mx-auto mb-6">
          {!apiKey ? (
            <div className="flex items-center gap-3 p-4 bg-amber-500/20 border border-amber-500/50 rounded-2xl text-amber-400">
              <UserCircle size={24} className="shrink-0" />
              <div>
                <p className="font-black text-sm">訪客體驗模式</p>
                <p className="text-[10px] opacity-80 uppercase tracking-wider font-bold">目前使用示範資料，設定 API Key 以解鎖無限 AI 教練建議。</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-500">
              <CheckCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">AI Core 已連線</p>
            </div>
          )}
        </div>

        {activeView === 'home' && (
          <div className="max-w-4xl mx-auto py-4 space-y-12">
            {state.goals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest">任務核心庫</h2>
                </div>
                <GoalList goals={state.goals} onSelectGoal={handleSelectGoal} />
              </div>
            )}

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl">
                <BrainCircuit className="text-indigo-500 w-12 h-12" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Architect Your Best Self with <span className="text-indigo-500">SmartMind</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto italic">
                {apiKey ? "Define your vision, and let our generative AI coach build the roadmap." : "探索 AI 教練如何引領您的成長。點擊下方按鈕體驗訪客示範。"}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32"></div>
              
              <div className="relative space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="text-white w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{apiKey ? '啟動新目標' : '體驗 AI 教練'}</h2>
                </div>

                {apiKey ? (
                  <textarea
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="例如：'在 6 個月內精通 TypeScript 並啟動 SaaS 業務'..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-6 text-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none min-h-[140px]"
                  />
                ) : (
                  <div className="p-6 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl text-center">
                    <p className="text-slate-500 text-sm font-medium mb-2">訪客模式將會使用「減重 5kg」作為範例目標</p>
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">無須輸入，直接點擊下方按鈕</p>
                  </div>
                )}

                {isServiceBusy && (
                  <div className="bg-sky-500/10 border border-sky-500/30 text-sky-400 p-4 rounded-xl flex items-center gap-3">
                    <RefreshCw size={18} className="animate-spin" />
                    <p className="text-xs font-bold">AI 目前忙碌中，請稍後重試。</p>
                  </div>
                )}

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs font-bold">
                    {error}
                  </div>
                )}

                <button 
                  onClick={handleStartGoal}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-4 rounded-2xl text-xl font-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <><RefreshCw className="animate-spin" /> 載入中...</>
                  ) : (
                    <>
                      <Rocket size={24} />
                      {apiKey ? '建立核心藍圖' : '訪客模式體驗'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'coach' && activeGoal && (
          <CoachDashboard 
            goal={activeGoal} 
            gemini={apiKey ? gemini : null}
            onUpdateGoal={updateActiveGoal}
          />
        )}

        {/* Other views omitted for brevity, but they should persist in the final file */}
        {activeView === 'goals' && (
           <div className="max-w-4xl mx-auto py-8">
             <h2 className="text-3xl font-black text-white mb-8 tracking-tight">任務核心庫</h2>
             <GoalList goals={state.goals} onSelectGoal={handleSelectGoal} />
           </div>
        )}
        
        {activeView === 'settings' && (
          <div className="max-w-2xl mx-auto py-8">
            <h2 className="text-3xl font-black text-white mb-8 tracking-tight">系統設定</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
              <button 
                onClick={() => { if(confirm('確定清除？')) { localStorage.clear(); window.location.reload(); } }}
                className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-6 py-4 rounded-xl text-sm font-bold transition-all border border-rose-500/30"
              >
                清除所有本地資料
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
