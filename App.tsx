
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import CoachDashboard from './components/CoachDashboard';
import GoalList from './components/GoalList';
import { AppState, UserGoal, UserProfile } from './types';
import { GeminiService } from './services/geminiService';
// Import Firebase instances and functions from the centralized service
import { 
  auth, 
  db, 
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from './services/firebase';
// Use import type for User to avoid "no exported member" errors in strict TypeScript environments
import type { User as FirebaseUser } from './services/firebase';
import { Target, BrainCircuit, Rocket, RefreshCw, CheckCircle, PlusCircle, UserCircle, AlertCircle } from 'lucide-react';

const INITIAL_USER: UserProfile = { 
  uid: null,
  name: 'Guest User', 
  photoURL: null,
  isLoggedIn: false, 
  provider: null 
};

const INITIAL_STATE: AppState = {
  user: INITIAL_USER,
  goals: [],
  activeGoalId: null,
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeView, setActiveView] = useState('home');
  const [goalInput, setGoalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isServiceBusy, setIsServiceBusy] = useState(false);

  const gemini = useMemo(() => new GeminiService(), []);

  // Handle Auth State
  useEffect(() => {
    // onAuthStateChanged is now imported from our local firebase service
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      setAuthLoading(true);
      if (user) {
        const userProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || (user.isAnonymous ? 'Anonymous Explorer' : 'Explorer'),
          photoURL: user.photoURL,
          isLoggedIn: true,
          provider: user.isAnonymous ? 'anonymous' : 'google'
        };

        // Fetch goals from Firestore
        let savedGoals: UserGoal[] = [];
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            savedGoals = userDoc.data().goals || [];
          } else {
            // Initialize user doc if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              name: userProfile.name,
              email: user.email,
              goals: []
            });
          }
        } catch (e) {
          console.error("Firestore sync error:", e);
        }

        setState(prev => ({
          ...prev,
          user: userProfile,
          goals: savedGoals.length > 0 ? savedGoals : prev.goals,
        }));
      } else {
        setState(INITIAL_STATE);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-sync goals to Firestore whenever they change
  useEffect(() => {
    const syncToFirestore = async () => {
      if (state.user.uid && state.user.isLoggedIn) {
        try {
          await updateDoc(doc(db, 'users', state.user.uid), {
            goals: state.goals
          });
        } catch (e) {
          console.error("Auto-sync error:", e);
        }
      }
    };

    if (state.user.isLoggedIn) {
      syncToFirestore();
    }
  }, [state.goals, state.user.uid, state.user.isLoggedIn]);

  const handleLogin = async (provider: 'google' | 'anonymous') => {
    setError(null);
    try {
      if (provider === 'google') {
        await signInWithPopup(auth, googleProvider);
      } else {
        await signInAnonymously(auth);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError("登入失敗，請檢查網路或允許彈窗。");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveView('home');
    } catch (err) {
      console.error("Logout failed:", err);
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
      else setError("無法啟動。請確保後端 API 設定正確。");
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">正在載入用戶數據...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-200">
      <Sidebar 
        user={state.user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen overflow-x-hidden pb-32">
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-500">
            <CheckCircle size={20} className="shrink-0" />
            <p className="text-sm font-bold">AI Core 已連線</p>
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
                    <p className="text-sm font-bold">請先登入以儲存您的目標並啟動 AI 教練。</p>
                  </div>
                )}

                <textarea
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  disabled={!state.user.isLoggedIn}
                  placeholder={state.user.isLoggedIn ? "例如：'在 6 個月內精通 TypeScript 並啟動 SaaS 業務'..." : "請登入後輸入目標..."}
                  className={`w-full bg-slate-950 border border-slate-700 rounded-2xl p-6 text-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none min-h-[140px] ${!state.user.isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                />

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
                  disabled={isLoading || !state.user.isLoggedIn}
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
                      <p className="text-[10px] text-slate-500 uppercase">{state.user.provider || 'Not Logged In'}</p>
                    </div>
                  </div>
                  {state.user.isLoggedIn && (
                    <button onClick={handleLogout} className="text-rose-500 text-xs font-black uppercase tracking-widest hover:text-rose-400 transition-colors">登出</button>
                  )}
                </div>
              </div>

              <button 
                onClick={() => { if(confirm('確定清除本地快取？此操作不會刪除雲端資料，但會重新啟動。')) { window.location.reload(); } }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 px-6 py-4 rounded-xl text-sm font-bold transition-all border border-slate-700"
              >
                重整應用程式
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
