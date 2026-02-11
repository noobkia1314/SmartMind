
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import CoachDashboard from './components/CoachDashboard';
import GoalList from './components/GoalList';
import { AppState, UserGoal, UserProfile } from './types';
import { GeminiService } from './services/geminiService';
import { 
  auth, 
  db, 
  googleProvider, 
  isFirebaseConfigured, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc 
} from './services/firebase';
import { Target, BrainCircuit, Rocket, RefreshCw, CheckCircle, PlusCircle, UserCircle, AlertCircle, User as UserIcon, ShieldAlert, LogIn } from 'lucide-react';

const INITIAL_USER: UserProfile = { 
  name: '訪客', 
  isLoggedIn: false,
  provider: 'guest'
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('smartmind_guest_state');
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
  const [isServiceBusy, setIsServiceBusy] = useState(false);
  const [showConfigWarning, setShowConfigWarning] = useState(false);

  const gemini = useMemo(() => new GeminiService(), []);

  // Firebase Auth State Listener
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      setAuthLoading(true);
      if (user) {
        // Authenticated user
        const userProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || 'Explorer',
          photoURL: user.photoURL || undefined,
          isLoggedIn: true,
          provider: 'google'
        };

        // Fetch data from Firestore
        let savedGoals: UserGoal[] = [];
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            savedGoals = userDoc.data().goals || [];
          } else {
            // New user, create document
            await setDoc(doc(db, 'users', user.uid), {
              name: userProfile.name,
              email: user.email,
              goals: []
            });
          }
        } catch (e) {
          console.error("Firestore loading error:", e);
        }

        setState(prev => ({
          ...prev,
          user: userProfile,
          goals: savedGoals.length > 0 ? savedGoals : prev.goals
        }));
      } else {
        // Not authenticated, stay in guest mode or revert
        setState(prev => ({
          ...prev,
          user: prev.user.provider === 'google' ? INITIAL_USER : prev.user
        }));
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firebase Config Diagnostic Logs
  useEffect(() => {
    const env = (import.meta as any).env;
    console.log("--- Firebase Diagnostics ---");
    console.log("VITE_FIREBASE_API_KEY:", env?.VITE_FIREBASE_API_KEY ? "Present" : "Missing");
    console.log("Full Firebase config status:", isFirebaseConfigured ? "Loaded Successfully" : "Missing Configuration");
    console.log("----------------------------");
    
    if (!isFirebaseConfigured) {
      setShowConfigWarning(true);
    }
  }, []);

  // Sync state to Firestore for Google users, or Local Storage for Guest
  useEffect(() => {
    if (state.user.isLoggedIn && state.user.provider === 'google' && state.user.uid) {
      const syncToFirestore = async () => {
        try {
          await updateDoc(doc(db, 'users', state.user.uid!), {
            goals: state.goals
          });
        } catch (e) {
          console.error("Firestore sync error:", e);
        }
      };
      syncToFirestore();
    } else {
      localStorage.setItem('smartmind_guest_state', JSON.stringify(state));
    }
  }, [state]);

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      setError("Firebase 未配置，無法使用 Google 登入。");
      return;
    }
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed:", err);
      setError("登入失敗，請檢查網路或允許彈窗。");
    }
  };

  const handleGuestLogin = () => {
    setState(prev => ({
      ...prev,
      user: { ...INITIAL_USER, isLoggedIn: true, provider: 'guest' }
    }));
  };

  const handleUpdateName = (newName: string) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, name: newName }
    }));
  };

  const handleLogout = async () => {
    if (state.user.provider === 'google') {
      try {
        await signOut(auth);
        setActiveView('home');
      } catch (err) {
        console.error("Logout failed:", err);
      }
    } else {
      if (confirm('確定登出訪客模式？資料仍保留在本地。')) {
        setState(prev => ({ ...prev, user: { ...prev.user, isLoggedIn: false } }));
        setActiveView('home');
      }
    }
  };

  const handleStartGoal = async () => {
    if (!goalInput.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setIsServiceBusy(false);

    try {
      const goalData = await gemini.generateGoalStructure(goalInput);

      if (!goalData) throw new Error("Generation failed");

      const newGoal: UserGoal = {
        id: crypto.randomUUID(),
        title: goalInput,
        description: '',
        startDate: new Date().toISOString(),
        mindMap: goalData.mindMap,
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
      else setError("無法啟動。請確保 API 設定正確。");
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">正在載入...</p>
        </div>
      </div>
    );
  }

  const activeGoal = state.goals.find(g => g.id === state.activeGoalId);

  console.log("Google login button rendered check:", !state.user.isLoggedIn);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-200">
      <Sidebar 
        user={state.user}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen overflow-x-hidden pb-32">
        {showConfigWarning && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-rose-500/10 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-rose-400 animate-pulse">
            <ShieldAlert className="shrink-0" />
            <div className="text-sm font-black uppercase tracking-tight">
              Firebase 配置未設定，請檢查 Vercel 環境變數 (VITE_FIREBASE_*)
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-500">
            <CheckCircle size={20} className="shrink-0" />
            <p className="text-sm font-bold">
              {state.user.provider === 'google' ? '雲端同步已啟動' : 'Guest Mode: 離線儲存已啟動'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
            {state.user.photoURL ? (
              <img src={state.user.photoURL} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <UserIcon size={16} className="text-slate-500 ml-2" />
            )}
            <input 
              type="text" 
              value={state.user.name} 
              onChange={(e) => handleUpdateName(e.target.value)}
              placeholder="您的姓名"
              disabled={state.user.provider === 'google'}
              className="bg-transparent border-none text-sm font-bold text-white focus:ring-0 outline-none w-32 disabled:opacity-80"
            />
          </div>
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
                Define your vision, and let our generative AI coach build the roadmap.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32"></div>
              
              <div className="relative space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="text-white w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">啟動新目標</h2>
                </div>

                {!state.user.isLoggedIn && (
                  <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl flex items-center gap-3 text-indigo-400">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">登入後即可雲端備份您的目標與進度。</p>
                  </div>
                )}

                <textarea
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  disabled={!state.user.isLoggedIn}
                  placeholder={state.user.isLoggedIn ? "例如：'在 6 個月內精通 TypeScript 並啟動 SaaS 業務'..." : "請先登入或選擇訪客模式..."}
                  className={`w-full bg-slate-950 border border-slate-700 rounded-2xl p-6 text-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none min-h-[140px] ${!state.user.isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                />

                {!state.user.isLoggedIn ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={handleGoogleLogin}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl text-lg font-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                    >
                      <LogIn size={20} />
                      Google 登入
                    </button>
                    <button 
                      onClick={handleGuestLogin}
                      className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl text-lg font-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 border border-slate-700"
                    >
                      訪客模式
                    </button>
                  </div>
                ) : (
                  <>
                    {isServiceBusy && (
                      <div className="bg-sky-500/10 border border-sky-500/30 text-sky-400 p-4 rounded-xl flex items-center gap-3">
                        <RefreshCw size={18} className="animate-spin" />
                        <p className="text-xs font-bold">AI 目前忙碌中，請稍後重試。</p>
                      </div>
                    )}

                    {error && (
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center gap-2 text-xs font-bold">
                        <AlertCircle size={14} />
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
                          建立核心藍圖
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
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
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">當前帳戶狀態</p>
                <div className="p-4 bg-slate-950 rounded-xl flex items-center justify-between border border-slate-800">
                  <div className="flex items-center gap-3">
                    {state.user.photoURL ? (
                      <img src={state.user.photoURL} alt="" className="w-10 h-10 rounded-full border border-indigo-500/30" />
                    ) : (
                      <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                        <UserCircle size={24} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white leading-tight">{state.user.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{state.user.provider || '訪客模式'}</p>
                    </div>
                  </div>
                  {state.user.isLoggedIn && (
                    <button onClick={handleLogout} className="text-rose-500 text-xs font-black uppercase tracking-widest hover:text-rose-400 transition-colors">登出 / 結束</button>
                  )}
                </div>
              </div>

              {!state.user.isLoggedIn && (
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <LogIn size={18} /> Google 登入同步
                </button>
              )}

              <button 
                onClick={() => { if(confirm('確定清除本地快取？此操作不會刪除雲端資料。')) { localStorage.removeItem('smartmind_guest_state'); window.location.reload(); } }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 px-6 py-4 rounded-xl text-sm font-bold transition-all border border-slate-700"
              >
                清除本地快取
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
