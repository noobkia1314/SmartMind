
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar.tsx';
import CoachDashboard from './components/CoachDashboard.tsx';
import GoalList from './components/GoalList.tsx';
import { AppState, UserGoal, UserProfile } from './types.ts';
import { GeminiService } from './services/geminiService.ts';
import { 
  auth, 
  db, 
  googleProvider, 
  isFirebaseConfigured, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInAnonymously,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc 
} from './services/firebase.ts';
import { Target, BrainCircuit, Rocket, RefreshCw, CheckCircle, PlusCircle, UserCircle, AlertCircle, User as UserIcon, LogIn, ShieldCheck, Timer, Key } from 'lucide-react';

const INITIAL_USER: UserProfile = { 
  name: '訪客', 
  isLoggedIn: false,
  provider: 'guest'
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('smartmind_state_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { user: INITIAL_USER, goals: [], activeGoalId: null };
      }
    }
    return { user: INITIAL_USER, goals: [], activeGoalId: null };
  });

  const [activeView, setActiveView] = useState('home');
  const [goalInput, setGoalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiBusy, setIsApiBusy] = useState(false);

  const gemini = useMemo(() => new GeminiService(), []);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      setAuthLoading(true);
      if (user) {
        const userProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || '使用者',
          photoURL: user.photoURL || undefined,
          isLoggedIn: true,
          provider: user.isAnonymous ? 'guest' : 'google'
        };

        let savedGoals: UserGoal[] = [];
        if (!user.isAnonymous && isFirebaseConfigured) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              savedGoals = userDoc.data().goals || [];
            } else {
              await setDoc(doc(db, 'users', user.uid), {
                name: userProfile.name,
                email: user.email,
                goals: []
              });
            }
          } catch (e) {
            console.error("Firestore error:", e);
          }
        }

        setState(prev => ({
          ...prev,
          user: userProfile,
          goals: savedGoals.length > 0 ? savedGoals : prev.goals
        }));
      } else {
        setState(prev => ({
          ...prev,
          user: INITIAL_USER
        }));
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (state.user.isLoggedIn && state.user.provider === 'google' && state.user.uid && isFirebaseConfigured) {
      const syncToFirestore = async () => {
        try {
          await updateDoc(doc(db, 'users', state.user.uid!), { goals: state.goals });
        } catch (e) {}
      };
      syncToFirestore();
    }
    localStorage.setItem('smartmind_state_v2', JSON.stringify(state));
  }, [state]);

  const handleGoogleLogin = async () => {
    setError(null);
    if (!isFirebaseConfigured) {
      setError("系統目前僅支援訪客模式 (Firebase 未設定)");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError("登入失敗，請稍後再試");
    }
  };

  const handleAnonymousLogin = async () => {
    setError(null);
    try {
      if (auth) {
        await signInAnonymously(auth);
      } else {
        setState(prev => ({
          ...prev,
          user: { ...INITIAL_USER, isLoggedIn: true, provider: 'guest' }
        }));
      }
    } catch (err) {
      setError("訪客登入失敗");
    }
  };

  const handleLogout = async () => {
    if (auth && state.user.isLoggedIn) {
      await signOut(auth);
    }
    setState(prev => ({ ...prev, user: INITIAL_USER, activeGoalId: null }));
    setActiveView('home');
  };

  const handleStartGoal = async () => {
    if (!goalInput.trim() || isLoading) return;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("未偵測到 Gemini API Key。請確認環境變數已正確設定。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsApiBusy(false);

    try {
      const goalData = await gemini.generateGoalStructure(goalInput);
      const newGoal: UserGoal = {
        id: crypto.randomUUID(),
        title: goalInput,
        description: '',
        startDate: new Date().toISOString(),
        mindMap: goalData.mindMap,
        tasks: goalData.tasks?.map((t: any) => ({
          id: crypto.randomUUID(),
          title: t.title,
          category: t.category,
          completed: false,
          date: new Date().toISOString().split('T')[0]
        })) || [],
        foodLogs: [], exerciseLogs: [], readingLogs: [], financeLogs: []
      };

      setState(prev => ({
        ...prev,
        goals: [newGoal, ...prev.goals],
        activeGoalId: newGoal.id
      }));
      setActiveView('coach');
      setGoalInput('');
    } catch (err: any) {
      console.error("Gemini Generation Error:", err);
      const errorMessage = err?.message || "";
      if (errorMessage.includes("503") || errorMessage.includes("overloaded") || errorMessage.includes("busy")) {
        setIsApiBusy(true);
        setError("AI 伺服器目前忙碌中（高需求）。這是暫時現象，請點擊下方按鈕重試。");
      } else {
        setError("生成藍圖時發生錯誤，請檢查網路連線或稍後再試。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const activeGoal = state.goals.find(g => g.id === state.activeGoalId);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <Sidebar 
        user={state.user}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen pb-32 md:pb-8">
        <div className="max-w-4xl mx-auto mb-8 flex flex-wrap gap-3 items-center justify-between">
          <div className={`px-4 py-2 rounded-full border text-xs font-black flex items-center gap-2 transition-all ${state.user.isLoggedIn ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
            {state.user.isLoggedIn ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
            {state.user.isLoggedIn ? (state.user.provider === 'google' ? '雲端同步：已啟動' : '離線模式：資料存於本地') : '尚未登入'}
          </div>
          
          <div className="flex items-center gap-3">
             <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold flex items-center gap-1.5 transition-all ${process.env.API_KEY ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
               <Key size={12} />
               {process.env.API_KEY ? 'Gemini API: 已連線' : 'Gemini API: 未設定'}
             </div>
            {state.user.isLoggedIn && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
                {state.user.photoURL ? (
                  <img src={state.user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                ) : <UserCircle size={14} className="text-indigo-400" />}
                <span className="text-xs font-bold text-white">{state.user.name}</span>
              </div>
            )}
          </div>
        </div>

        {activeView === 'home' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-6">
              <div className="inline-flex p-4 bg-indigo-600/10 rounded-3xl mb-4">
                <BrainCircuit className="text-indigo-500 w-16 h-16" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                Smart<span className="text-indigo-500">Mind</span> AI
              </h1>
              <p className="text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
                您的全方位進化教練：追蹤目標、管理健康與財富。
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-8 relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 blur-[80px] group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
              
              <div className="relative space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <Target className="text-white w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">啟動新目標</h2>
                </div>

                <textarea
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="例如：'在三個月內減重 5 公斤並跑完一次半馬'..."
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 text-lg text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none min-h-[160px] transition-all placeholder:text-slate-600"
                  disabled={isLoading}
                />

                {error && (
                  <div className={`p-6 rounded-3xl border animate-in slide-in-from-top-2 duration-300 ${isApiBusy ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-1">
                        {isApiBusy ? <Timer size={24} /> : <AlertCircle size={24} />}
                      </div>
                      <div className="flex-1 space-y-3">
                        <p className="font-bold text-sm leading-relaxed">
                          {isApiBusy 
                            ? "AI 伺服器目前忙碌中（高需求），這是暫時現象。請點擊下方重試。" 
                            : error}
                        </p>
                        <button 
                          onClick={handleStartGoal}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg ${isApiBusy ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-rose-600 text-white hover:bg-rose-500'}`}
                        >
                          <RefreshCw size={14} /> 立即重試
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!state.user.isLoggedIn ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-3 bg-white text-slate-950 py-5 rounded-3xl text-lg font-black hover:bg-slate-100 transition-all active:scale-95">
                      <LogIn size={20} /> Google 登入
                    </button>
                    <button onClick={handleAnonymousLogin} className="flex items-center justify-center gap-3 bg-slate-800 text-white py-5 rounded-3xl text-lg font-black hover:bg-slate-700 border border-slate-700 transition-all active:scale-95">
                      訪客登入
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleStartGoal}
                    disabled={isLoading || !goalInput.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-5 rounded-3xl text-xl font-black transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-4 group"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <RefreshCw className="animate-spin" />
                        <span>正在生成您的藍圖...</span>
                      </div>
                    ) : (
                      <>啟動 AI 教練 <Rocket size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                    )}
                  </button>
                )}
              </div>
            </div>

            {state.goals.length > 0 && (
              <div className="space-y-6 pt-4">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                  活躍目標
                </h2>
                <GoalList goals={state.goals} onSelectGoal={(id) => { setState(prev => ({...prev, activeGoalId: id})); setActiveView('coach'); }} />
              </div>
            )}
          </div>
        )}

        {activeView === 'coach' && activeGoal && (
          <CoachDashboard 
            goal={activeGoal} 
            gemini={gemini}
            onUpdateGoal={(updated) => setState(prev => ({...prev, goals: prev.goals.map(g => g.id === updated.id ? updated : g)}))}
          />
        )}
      </main>
    </div>
  );
};

export default App;
