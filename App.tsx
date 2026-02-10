
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import CoachDashboard from './components/CoachDashboard';
import ApiKeyOverlay from './components/ApiKeyOverlay';
import { AppState, UserGoal, UserProfile } from './types';
import { GeminiService } from './services/geminiService';
import { Target, PlusCircle, LayoutDashboard, BrainCircuit, Rocket } from 'lucide-react';

const INITIAL_STATE: AppState = {
  apiKey: '',
  user: { name: 'Guest User', isLoggedIn: false, provider: null },
  goals: [],
  activeGoalId: null,
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('smartmind_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [activeView, setActiveView] = useState('home');
  const [goalInput, setGoalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('smartmind_state', JSON.stringify(state));
  }, [state]);

  const gemini = useMemo(() => state.apiKey ? new GeminiService(state.apiKey) : null, [state.apiKey]);

  const handleLogin = (provider: 'google' | 'anonymous') => {
    setState(prev => ({
      ...prev,
      user: {
        name: provider === 'google' ? 'Simulated Google User' : 'Guest Traveler',
        isLoggedIn: true,
        provider
      }
    }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, user: INITIAL_STATE.user }));
  };

  const setApiKey = (apiKey: string) => {
    setState(prev => ({ ...prev, apiKey }));
  };

  const handleStartGoal = async () => {
    if (!goalInput.trim()) return;
    if (!state.apiKey) {
      setError("請先在畫面右下角的設定框中輸入 Gemini API Key");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await gemini?.generateGoalStructure(goalInput);
      if (!data) throw new Error("生成失敗");

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
      setError("無法啟動 AI 教練。請檢查 API Key 是否正確且具備 Gemini 存取權限。");
    } finally {
      setIsLoading(false);
    }
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
        apiKey={state.apiKey}
        setApiKey={setApiKey}
        user={state.user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Persistent API Key Control */}
      <ApiKeyOverlay apiKey={state.apiKey} onSave={setApiKey} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen overflow-x-hidden">
        {activeView === 'home' && (
          <div className="max-w-4xl mx-auto py-12 space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-2">
                <BrainCircuit className="text-indigo-500 w-12 h-12" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Architect Your Best Self with <span className="text-indigo-500">SmartMind</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Define your vision, and let our generative AI coach build the roadmap, track your health, and optimize your finances.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32"></div>
              
              <div className="relative space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="text-white w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">你想達成什麼目標？</h2>
                </div>

                <textarea
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="例如：'在 6 個月內精通 TypeScript 並啟動 SaaS 業務' 或 '徹底改善健康並跑完馬拉松'..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-6 text-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-h-[160px] shadow-inner"
                />

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium animate-pulse">
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
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      正在啟動 AI 教練...
                    </>
                  ) : (
                    <>
                      <Rocket size={24} />
                      啟動 AI 教練模式
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: '生成式路線圖', desc: 'AI 生成的思維導圖將複雜目標分解為可管理的階段。', icon: BrainCircuit },
                { title: '適應性追蹤', desc: '包含健康、營養、閱讀與財務監督的動態日常運作。', icon: LayoutDashboard },
                { title: '戰略洞察', desc: '由 Gemini 驅動的高階 AI 顧問進行績效評估與建議。', icon: Target },
              ].map((feature, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
                  <feature.icon className="text-indigo-400 mb-4" size={32} />
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeView === 'goals' || (activeView === 'coach' && !activeGoal)) && (
          <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-white">活躍中的任務</h2>
              <button onClick={() => setActiveView('home')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                <PlusCircle size={18} /> 新目標
              </button>
            </div>
            {state.goals.length === 0 ? (
              <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center">
                <Target className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">尚未有活躍目標。從儀表板開始你的第一個任務吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.goals.map(goal => (
                  <div 
                    key={goal.id} 
                    onClick={() => { setState(prev => ({...prev, activeGoalId: goal.id})); setActiveView('coach'); }}
                    className="group bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <Target size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(goal.startDate).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2">{goal.title}</h3>
                    <div className="flex gap-4 mt-6">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 font-bold uppercase">任務數</p>
                        <p className="text-lg font-black text-white">{goal.tasks.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 font-bold uppercase">進度</p>
                        <p className="text-lg font-black text-white">{Math.round((goal.tasks.filter(t => t.completed).length / (goal.tasks.length || 1)) * 100)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <h2 className="text-3xl font-black text-white mb-8">系統設定</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white">API 設定</h3>
                <p className="text-sm text-slate-400">目前也可以透過右下角的浮動視窗快速更新 API Key。</p>
              </section>

              <div className="h-px bg-slate-800"></div>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white">危險區域</h3>
                <button 
                  onClick={() => { if(confirm('確定要清除所有資料並登出嗎？這無法還原。')) setState(INITIAL_STATE); }}
                  className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all border border-rose-500/30"
                >
                  清除本地快取並登出
                </button>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
