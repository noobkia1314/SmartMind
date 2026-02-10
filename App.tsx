
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import CoachDashboard from './components/CoachDashboard';
import { AppState, UserGoal } from './types';
import { GeminiService } from './services/geminiService';
import { Target, PlusCircle, BrainCircuit, Rocket } from 'lucide-react';

const INITIAL_STATE: AppState = {
  user: { name: 'Guest User', isLoggedIn: false, provider: null },
  goals: [],
  activeGoalId: null,
};

const App: React.FC = () => {
  useEffect(() => {
    console.log("App loaded. Checking environment...");
    if (!process.env.API_KEY) {
      console.warn("API_KEY not found in environment. AI features may be unavailable.");
    }
  }, []);

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

  const gemini = useMemo(() => new GeminiService(), []);

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
    
    setIsLoading(true);
    setError(null);
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
      setError("Unable to initiate AI coach. Please ensure the environment API key is configured and try again.");
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
        user={state.user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen overflow-x-hidden pb-32">
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
                  <h2 className="text-2xl font-bold text-white">What do you want to achieve?</h2>
                </div>

                <textarea
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="E.g., 'Master TypeScript and launch a SaaS in 6 months' or 'Transform health and run a marathon'..."
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
                      Activating AI Coach...
                    </>
                  ) : (
                    <>
                      <Rocket size={24} />
                      Launch AI Coach Mode
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
              <h2 className="text-3xl font-black text-white">Active Missions</h2>
              <button onClick={() => setActiveView('home')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                <PlusCircle size={18} /> New Goal
              </button>
            </div>
            {state.goals.length === 0 ? (
              <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center">
                <Target className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No active goals yet. Start your first mission from the dashboard!</p>
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
            <h2 className="text-3xl font-black text-white mb-8">System Settings</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white">Danger Zone</h3>
                <button 
                  onClick={() => { if(confirm('Are you sure you want to clear all data and logout? This cannot be undone.')) { localStorage.clear(); window.location.reload(); } }}
                  className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all border border-rose-500/30"
                >
                  Clear All Data & Logout
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
