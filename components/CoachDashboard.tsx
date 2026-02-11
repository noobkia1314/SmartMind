
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Utensils, Activity, BookOpen, DollarSign, 
  ChevronLeft, ChevronRight, Plus, 
  TrendingUp, ClipboardList, Lightbulb,
  Calendar as CalendarIcon, PieChart, Info, RefreshCw, Trash2, Clock, Dumbbell, Repeat, ArrowUpCircle, ArrowDownCircle, Wallet, AlertTriangle, Flame, ChevronDown, ChevronUp, User, Globe, Timer
} from 'lucide-react';
import { UserGoal, RecordType, FoodEntry, ExerciseEntry, FinanceEntry, ReadingEntry, UserProfileStats } from '../types';
import MindMap from './MindMap';
import DailyTaskModal from './DailyTaskModal';
import { GeminiService } from '../services/geminiService';

interface CoachDashboardProps {
  goal: UserGoal;
  gemini: GeminiService | null;
  onUpdateGoal: (updatedGoal: UserGoal) => void;
}

const CURRENCIES = [
  { symbol: 'RM', label: '馬來西亞令吉 (RM)' },
  { symbol: '$', label: '美元 ($)' },
  { symbol: '€', label: '歐元 (€)' },
  { symbol: '¥', label: '人民幣/日元 (¥)' },
  { symbol: '฿', label: '泰銖 (฿)' },
  { symbol: '£', label: '英鎊 (£)' },
  { symbol: 'NT$', label: '新台幣 (NT$)' },
];

const CoachDashboard: React.FC<CoachDashboardProps> = ({ goal, gemini, onUpdateGoal }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [mindMapCollapsed, setMindMapCollapsed] = useState(true);
  const [profileCollapsed, setProfileCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<RecordType>(RecordType.DIET);
  const [loading, setLoading] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string>('');
  const [isServiceBusy, setIsServiceBusy] = useState(false);

  // Currency State
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('smartmind_currency') || 'RM';
  });

  useEffect(() => {
    localStorage.setItem('smartmind_currency', currency);
  }, [currency]);

  // User Stats state
  const [userStats, setUserStats] = useState<UserProfileStats>(() => {
    const saved = localStorage.getItem('smartmind_user_stats');
    if (saved) return JSON.parse(saved);
    return { age: 25, gender: 'male', height: 175, weight: 70, activityLevel: 'moderate' };
  });

  useEffect(() => {
    localStorage.setItem('smartmind_user_stats', JSON.stringify(userStats));
  }, [userStats]);

  // Local entry states
  const [foodInput, setFoodInput] = useState('');
  const [exerciseInput, setExerciseInput] = useState<{name: string; value: number; unit: 'minutes' | 'seconds' | 'sets' | 'reps'}>({ 
    name: '', 
    value: 30, 
    unit: 'minutes' 
  });
  const [financeInput, setFinanceInput] = useState({ type: 'expense' as 'income' | 'expense', category: '', amount: 0, description: '' });
  const [readingInput, setReadingInput] = useState({ title: '', totalPages: 100, readToday: 0, summary: '' });

  const tasksForSelectedDate = useMemo(() => 
    goal.tasks.filter(t => t.date === selectedDate), 
  [goal.tasks, selectedDate]);

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = goal.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    onUpdateGoal({ ...goal, tasks: updatedTasks });
  };

  const handleUpdateFeedback = (taskId: string, feedback: string) => {
    const updatedTasks = goal.tasks.map(t => t.id === taskId ? { ...t, feedback } : t);
    onUpdateGoal({ ...goal, tasks: updatedTasks });
  };

  const handleAddFood = async () => {
    if (!foodInput) return;
    if (!gemini) {
      const newEntry: FoodEntry = {
        id: crypto.randomUUID(),
        name: foodInput,
        calories: Math.floor(Math.random() * 500) + 100,
        protein: Math.floor(Math.random() * 30),
        date: selectedDate
      };
      onUpdateGoal({ ...goal, foodLogs: [...goal.foodLogs, newEntry] });
      setFoodInput('');
      return;
    }
    setLoading(true);
    try {
      const data = await gemini.calculateNutrition(foodInput);
      const newEntry: FoodEntry = {
        id: crypto.randomUUID(),
        name: foodInput,
        calories: data.calories,
        protein: data.protein,
        date: selectedDate
      };
      onUpdateGoal({ ...goal, foodLogs: [...goal.foodLogs, newEntry] });
      setFoodInput('');
    } catch (err) {
        console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async () => {
    if (!exerciseInput.name) return;

    if (!userStats.weight || !userStats.height || !userStats.age) {
      alert("請先填寫個人資料以獲得更準確估算");
      setProfileCollapsed(false);
      return;
    }

    if (!gemini) {
       // Improved fallback logic based on weight and activity
       let durationMultiplier = 0;
       if (exerciseInput.unit === 'minutes') {
         durationMultiplier = exerciseInput.value;
       } else if (exerciseInput.unit === 'seconds') {
         durationMultiplier = exerciseInput.value / 60;
       } else {
         durationMultiplier = exerciseInput.value * 2;
       }
       
       const weightAdjuster = userStats.weight / 70;
       const newEntry: ExerciseEntry = {
        id: crypto.randomUUID(),
        name: exerciseInput.name,
        value: exerciseInput.value,
        unit: exerciseInput.unit,
        caloriesBurned: Math.round(durationMultiplier * 5 * weightAdjuster),
        date: selectedDate
      };
      onUpdateGoal({ ...goal, exerciseLogs: [...goal.exerciseLogs, newEntry] });
      setExerciseInput({ ...exerciseInput, name: '', value: 30, unit: 'minutes' });
      return;
    }
    setLoading(true);
    try {
      const data = await gemini.calculateExercise(exerciseInput.name, exerciseInput.value, exerciseInput.unit, userStats);
      const newEntry: ExerciseEntry = {
        id: crypto.randomUUID(),
        name: exerciseInput.name,
        value: exerciseInput.value,
        unit: exerciseInput.unit,
        caloriesBurned: data.caloriesBurned,
        date: selectedDate
      };
      onUpdateGoal({ ...goal, exerciseLogs: [...goal.exerciseLogs, newEntry] });
      setExerciseInput({ ...exerciseInput, name: '', value: 30, unit: 'minutes' });
    } catch (err) {
        console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExercise = (id: string) => {
    const updatedLogs = goal.exerciseLogs.filter(log => log.id !== id);
    onUpdateGoal({ ...goal, exerciseLogs: updatedLogs });
  };

  const handleAddFinance = () => {
    if (!financeInput.category || financeInput.amount <= 0) return;
    const newEntry: FinanceEntry = {
      id: crypto.randomUUID(),
      ...financeInput,
      date: selectedDate
    };
    onUpdateGoal({ ...goal, financeLogs: [newEntry, ...goal.financeLogs] });
    setFinanceInput({ type: 'expense', category: '', amount: 0, description: '' });
  };

  const handleRemoveFinance = (id: string) => {
    const updatedLogs = goal.financeLogs.filter(log => log.id !== id);
    onUpdateGoal({ ...goal, financeLogs: updatedLogs });
  };

  const handleAddReading = () => {
    const existing = goal.readingLogs.find(r => r.title === readingInput.title);
    if (existing) {
      const updated = goal.readingLogs.map(r => r.id === existing.id ? {
        ...r,
        currentPages: Math.min(r.currentPages + readingInput.readToday, r.totalPages),
        history: [...r.history, { date: selectedDate, pagesRead: readingInput.readToday, summary: readingInput.summary }]
      } : r);
      onUpdateGoal({ ...goal, readingLogs: updated });
    } else {
      const newEntry: ReadingEntry = {
        id: crypto.randomUUID(),
        title: readingInput.title,
        totalPages: readingInput.totalPages,
        currentPages: readingInput.readToday,
        history: [{ date: selectedDate, pagesRead: readingInput.readToday, summary: readingInput.summary }]
      };
      onUpdateGoal({ ...goal, readingLogs: [...goal.readingLogs, newEntry] });
    }
    setReadingInput({ title: '', totalPages: 100, readToday: 0, summary: '' });
  };

  const getAdvice = async () => {
    if (!gemini) {
      setCoachAdvice("### 訪客模式建議\n- 您目前正在體驗示範功能。\n- **設定 API Key** 後，AI 才能根據您的真實數據提供針對性建議。\n- 系統已檢測到您有 7 個初始任務待完成。加油！");
      return;
    }
    setLoading(true);
    setIsServiceBusy(false);
    const summary = `Goal: ${goal.title}. Total Tasks: ${goal.tasks.length}, Completed: ${goal.tasks.filter(t => t.completed).length}. Total Calories: ${goal.foodLogs.reduce((acc, f) => acc + f.calories, 0)}. Fitness duration: ${goal.exerciseLogs.reduce((acc, e) => acc + (e.unit === 'minutes' ? e.value : 0), 0)}. Finance balance: ${goal.financeLogs.reduce((acc, f) => acc + (f.type === 'income' ? f.amount : -f.amount), 0)}.`;
    try {
      const advice = await gemini.getCoachAdvice(summary);
      setCoachAdvice(advice || "Coach is momentarily unavailable.");
    } catch (err: any) {
      const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('Service Unavailable') || err?.message?.includes('overloaded');
      if (is503) setIsServiceBusy(true);
      else setCoachAdvice("連線失敗，請檢查 API Key。");
    } finally {
      setLoading(false);
    }
  };

  const dailyExerciseLogs = useMemo(() => 
    goal.exerciseLogs.filter(log => log.date === selectedDate),
  [goal.exerciseLogs, selectedDate]);

  const dailyTotalCaloriesBurned = useMemo(() => 
    dailyExerciseLogs.reduce((acc, log) => acc + log.caloriesBurned, 0),
  [dailyExerciseLogs]);

  const dailyTotalCaloriesIngested = useMemo(() => 
    goal.foodLogs.filter(f => f.date === selectedDate).reduce((acc, log) => acc + log.calories, 0),
  [goal.foodLogs, selectedDate]);

  const netCalories = dailyTotalCaloriesIngested - dailyTotalCaloriesBurned;

  const financeStats = useMemo(() => {
    const totals = goal.financeLogs.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    }, { income: 0, expense: 0 });

    const todayLogs = goal.financeLogs.filter(f => f.date === selectedDate);
    const todayTotals = todayLogs.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    }, { income: 0, expense: 0 });

    return { totals, todayTotals };
  }, [goal.financeLogs, selectedDate]);

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'minutes': return '分鐘';
      case 'seconds': return '秒';
      case 'sets': return '組數';
      case 'reps': return '次數';
      default: return '';
    }
  };

  const getUnitIcon = (unit: string) => {
    switch (unit) {
      case 'minutes': return <Clock size={16} />;
      case 'seconds': return <Timer size={16} />;
      case 'sets': return <Dumbbell size={16} />;
      case 'reps': return <Repeat size={16} />;
      default: return null;
    }
  };

  const daysInMonth = useMemo(() => {
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { firstDay, days };
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-24 md:pb-8">
      {goal.isDemo && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3 text-rose-400">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-sm font-bold">這是示範目標。由於未設定 API Key，部分 AI 功能（如精確卡片計算與教練深度建議）受限。</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">{goal.title}</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
            {goal.isDemo ? '示範模式' : `啟動日期：${new Date(goal.startDate).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowTaskModal(true)}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl active:scale-95"
           >
             <ClipboardList size={20} />
             每日任務
           </button>
           <button 
             onClick={getAdvice}
             disabled={loading}
             className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white px-4 py-3 rounded-2xl font-black transition-all shadow-xl active:scale-95"
           >
             <Lightbulb size={20} />
             {loading ? '思考中...' : '教練建議'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-200 flex items-center gap-2">
                <CalendarIcon size={18} className="text-indigo-500" />
                日曆
              </h3>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <span key={d} className="text-[10px] font-black text-slate-500">{d}</span>
              ))}
              {Array.from({ length: daysInMonth.firstDay }).map((_, i) => <div key={i} />)}
              {Array.from({ length: daysInMonth.days }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${new Date(selectedDate).getFullYear()}-${String(new Date(selectedDate).getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isActive = dateStr === selectedDate;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                      isActive ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <h3 className="font-black text-slate-200 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              報告摘要
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">健康熱量 (攝取)</span>
                  <Utensils size={14} className="text-indigo-400" />
                </div>
                <p className="text-lg font-black text-white">{dailyTotalCaloriesIngested} kcal</p>
              </div>

              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">運動消耗</span>
                  <Flame size={14} className="text-rose-400" />
                </div>
                <p className="text-lg font-black text-white">{dailyTotalCaloriesBurned} kcal</p>
              </div>

              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">今日淨熱量</span>
                  <PieChart size={14} className={netCalories > 0 ? 'text-emerald-400' : 'text-rose-400'} />
                </div>
                <p className={`text-lg font-black ${netCalories > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netCalories} kcal
                </p>
              </div>

              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">累積收支結餘 ({currency})</span>
                  <Wallet size={14} className="text-emerald-400" />
                </div>
                <p className={`text-lg font-black ${financeStats.totals.income - financeStats.totals.expense >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currency} {financeStats.totals.income - financeStats.totals.expense}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {goal.mindMap && (
            <MindMap 
              data={goal.mindMap} 
              isCollapsed={mindMapCollapsed} 
              onToggle={() => setMindMapCollapsed(!mindMapCollapsed)}
              onViewTasks={() => setShowTaskModal(true)}
              hasTasks={goal.tasks.length > 0}
            />
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-800 overflow-x-auto custom-scrollbar bg-slate-800/20">
              {[
                { id: RecordType.DIET, icon: Utensils, label: '飲食' },
                { id: RecordType.EXERCISE, icon: Activity, label: '運動' },
                { id: RecordType.FINANCE, icon: DollarSign, label: '財務' },
                { id: RecordType.READING, icon: BookOpen, label: '閱讀' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as RecordType)}
                  className={`flex items-center gap-2 px-6 py-4 font-black whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'text-indigo-400 border-indigo-400 bg-indigo-500/5' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
               {activeTab === RecordType.DIET && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      placeholder="食物名稱 (例如: '雞胸肉')"
                      value={foodInput}
                      onChange={e => setFoodInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button onClick={handleAddFood} className="bg-indigo-600 text-white px-8 rounded-2xl font-black py-3"><Plus size={20} /></button>
                  </div>
                  <div className="space-y-2">
                    {goal.foodLogs.filter(f => f.date === selectedDate).map(item => (
                      <div key={item.id} className="flex justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                        <span className="font-bold text-white">{item.name}</span>
                        <span className="text-xs text-slate-500 font-bold">{item.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === RecordType.FINANCE && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">收支管理與貨幣設定</h4>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                      <Globe size={14} className="text-indigo-400" />
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-transparent border-none text-xs font-black text-white focus:ring-0 outline-none cursor-pointer"
                      >
                        {CURRENCIES.map(c => (
                          <option key={c.symbol} value={c.symbol} className="bg-slate-900">{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">
                        今日收入
                      </div>
                      <p className="text-xl font-black text-white">{currency} {financeStats.todayTotals.income}</p>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-rose-500 tracking-widest mb-1">
                        今日支出
                      </div>
                      <p className="text-xl font-black text-white">{currency} {financeStats.todayTotals.expense}</p>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">
                        今日淨額
                      </div>
                      <p className={`text-xl font-black ${financeStats.todayTotals.income - financeStats.todayTotals.expense >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currency} {financeStats.todayTotals.income - financeStats.todayTotals.expense}
                      </p>
                    </div>
                  </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <select value={financeInput.type} onChange={e => setFinanceInput({...financeInput, type: e.target.value as any})} className="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold">
                      <option value="expense">支出</option>
                      <option value="income">收入</option>
                    </select>
                    <input type="text" placeholder="項目類別" value={financeInput.category} onChange={e => setFinanceInput({...financeInput, category: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white" />
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">{currency}</div>
                      <input type="number" placeholder="金額" value={financeInput.amount || ''} onChange={e => setFinanceInput({...financeInput, amount: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-white" />
                    </div>
                    <button onClick={handleAddFinance} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black py-3 transition-all active:scale-95 flex items-center justify-center gap-2">
                      <Plus size={20} /> 加入
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-slate-900/80 text-slate-500 uppercase font-black tracking-widest border-b border-slate-800">
                          <tr>
                            <th className="px-4 py-3">日期</th>
                            <th className="px-4 py-3">類型</th>
                            <th className="px-4 py-3">項目</th>
                            <th className="px-4 py-3">金額</th>
                            <th className="px-4 py-3 text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {goal.financeLogs.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-600 italic">尚未有收支記錄</td></tr>
                          ) : (
                            goal.financeLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-900/30 transition-colors group">
                                <td className="px-4 py-3 text-slate-400">{log.date}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded uppercase font-black text-[9px] ${log.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {log.type === 'income' ? '收入' : '支出'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-white font-bold">{log.category}</td>
                                <td className={`px-4 py-3 font-black ${log.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {currency} {log.amount}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button onClick={() => handleRemoveFinance(log.id)} className="p-1.5 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === RecordType.EXERCISE && (
                <div className="space-y-6">
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden">
                    <button 
                      onClick={() => setProfileCollapsed(!profileCollapsed)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <User size={18} className="text-indigo-400" />
                        <span className="font-black text-slate-200 text-sm">個人身體資料 (影響熱量估算)</span>
                      </div>
                      {profileCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                    
                    {!profileCollapsed && (
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">年齡 (歲)</label>
                          <input 
                            type="number" 
                            value={userStats.age} 
                            onChange={e => setUserStats({...userStats, age: parseInt(e.target.value) || 0})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">性別</label>
                          <select 
                            value={userStats.gender} 
                            onChange={e => setUserStats({...userStats, gender: e.target.value as any})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
                          >
                            <option value="male">男性</option>
                            <option value="female">女性</option>
                            <option value="other">其他</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">身高 (cm)</label>
                          <input 
                            type="number" 
                            value={userStats.height} 
                            onChange={e => setUserStats({...userStats, height: parseInt(e.target.value) || 0})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">體重 (kg)</label>
                          <input 
                            type="number" 
                            value={userStats.weight} 
                            onChange={e => setUserStats({...userStats, weight: parseInt(e.target.value) || 0})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">日常運動量等級</label>
                          <select 
                            value={userStats.activityLevel} 
                            onChange={e => setUserStats({...userStats, activityLevel: e.target.value as any})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
                          >
                            <option value="sedentary">久坐 (辦公室工作)</option>
                            <option value="light">輕度 (每週運動 1-2 次)</option>
                            <option value="moderate">中度 (每週運動 3-5 次)</option>
                            <option value="heavy">高強度 (每週運動 6-7 次)</option>
                            <option value="athlete">極高強度 (專業運動員)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <input 
                        type="text" 
                        placeholder="運動項目 (例如: 跑步)" 
                        value={exerciseInput.name} 
                        onChange={e => setExerciseInput({...exerciseInput, name: e.target.value})} 
                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select 
                          value={exerciseInput.unit} 
                          onChange={e => setExerciseInput({...exerciseInput, unit: e.target.value as any})} 
                          className="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold"
                        >
                            <option value="minutes">分鐘</option>
                            <option value="seconds">秒</option>
                            <option value="sets">組數</option>
                            <option value="reps">次數</option>
                        </select>
                        <input 
                          type="number" 
                          value={exerciseInput.value} 
                          onChange={e => setExerciseInput({...exerciseInput, value: parseInt(e.target.value) || 0})} 
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                        <button 
                          onClick={handleAddExercise} 
                          disabled={loading}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-2xl font-black flex items-center justify-center py-3 shadow-xl transition-all active:scale-95"
                        >
                          {loading ? <RefreshCw size={20} className="animate-spin" /> : <Plus size={20} className="mr-2" />}
                          記錄運動
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">今日運動清單</h4>
                      {dailyExerciseLogs.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center">
                          <p className="text-slate-600 text-sm">尚未記錄任何運動</p>
                        </div>
                      ) : (
                        dailyExerciseLogs.map(log => (
                          <div key={log.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center">
                                {getUnitIcon(log.unit)}
                              </div>
                              <div>
                                <p className="font-bold text-white leading-tight">{log.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{log.value} {getUnitLabel(log.unit)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-black text-rose-400">{log.caloriesBurned} kcal</span>
                              <button onClick={() => handleRemoveExercise(log.id)} className="text-slate-600 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === RecordType.READING && (
                <div className="space-y-4">
                  <div className="p-5 bg-slate-950/50 rounded-3xl border border-slate-800 space-y-4">
                    <input 
                      type="text" 
                      placeholder="書籍名稱"
                      value={readingInput.title}
                      onChange={e => setReadingInput({...readingInput, title: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-black uppercase ml-2">總頁數</label>
                        <input 
                          type="number" 
                          value={readingInput.totalPages}
                          onChange={e => setReadingInput({...readingInput, totalPages: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-black uppercase ml-2">今日閱讀</label>
                        <input 
                          type="number" 
                          value={readingInput.readToday}
                          onChange={e => setReadingInput({...readingInput, readToday: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white"
                        />
                      </div>
                    </div>
                    <textarea 
                      placeholder="今日感想..."
                      value={readingInput.summary}
                      onChange={e => setReadingInput({...readingInput, summary: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white min-h-[100px]"
                    />
                    <button 
                      onClick={handleAddReading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-4 font-black transition-all active:scale-95 shadow-xl"
                    >
                      記錄閱讀進度
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {coachAdvice && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <Lightbulb size={24} className="text-amber-500" />
                <h3 className="text-2xl font-black text-white">教練建議</h3>
              </div>
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                {coachAdvice}
              </div>
            </div>
          )}
        </div>
      </div>

      {showTaskModal && (
        <DailyTaskModal 
          tasks={tasksForSelectedDate}
          date={selectedDate}
          onClose={() => setShowTaskModal(false)}
          onToggleTask={handleToggleTask}
          onUpdateFeedback={handleUpdateFeedback}
        />
      )}
    </div>
  );
};

export default CoachDashboard;
