import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Utensils, Activity, BookOpen, DollarSign, 
  ChevronLeft, ChevronRight, Plus, 
  TrendingUp, ClipboardList, Lightbulb,
  Calendar as CalendarIcon, PieChart, Info, RefreshCw, Trash2, Clock, Dumbbell, Repeat, ArrowUpCircle, ArrowDownCircle, Wallet, AlertTriangle, Flame, ChevronDown, ChevronUp, User, Globe, Timer, Search, History, X
} from 'lucide-react';
import { UserGoal, RecordType, FoodEntry, ExerciseEntry, FinanceEntry, ReadingEntry, UserProfileStats } from '../types.ts';
import MindMap from './MindMap.tsx';
import DailyTaskModal from './DailyTaskModal.tsx';
import { GeminiService } from '../services/geminiService.ts';
import { langService } from '../services/langService.ts';
import ReactMarkdown from 'react-markdown';

interface CoachDashboardProps {
  goal: UserGoal;
  gemini: GeminiService | null;
  onUpdateGoal: (updatedGoal: UserGoal) => void;
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({ goal, gemini, onUpdateGoal }) => {
  const t = (text: string | undefined | null) => langService.t(text || '');

  const CURRENCIES = [
    { symbol: 'RM', label: t('馬來西亞令吉 (RM)') },
    { symbol: '$', label: t('美元 ($)') },
    { symbol: '€', label: t('歐元 (€)') },
    { symbol: '¥', label: t('人民幣/日元 (¥)') },
    { symbol: '฿', label: t('泰銖 (฿)') },
    { symbol: '£', label: t('英鎊 (£)') },
    { symbol: 'NT$', label: t('新台幣 (NT$)') },
  ];

  const [foodInput, setFoodInput] = useState('');
  const [exerciseInput, setExerciseInput] = useState<{name: string; value: number; unit: 'minutes' | 'seconds' | 'sets' | 'reps'}>({ 
    name: '', 
    value: 30, 
    unit: 'minutes' 
  });
  const [financeInput, setFinanceInput] = useState({ type: 'expense' as 'income' | 'expense', category: '', amount: 0, description: '' });
  const [readingInput, setReadingInput] = useState({ title: '', totalPages: 100, readToday: 0, summary: '' });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [mindMapCollapsed, setMindMapCollapsed] = useState(true);
  const [profileCollapsed, setProfileCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<RecordType>(RecordType.DIET);
  const [loading, setLoading] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string>('');

  const [commonFoods, setCommonFoods] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smartmind_common_foods');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [showFoodSuggestions, setShowFoodSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const foodInputRef = useRef<HTMLInputElement>(null);

  const filteredFoodSuggestions = useMemo(() => {
    const query = foodInput.trim().toLowerCase();
    if (!query) return [];
    return commonFoods.filter(f => f.toLowerCase().includes(query) && f.toLowerCase() !== query);
  }, [commonFoods, foodInput]);

  const [currency, setCurrency] = useState(() => localStorage.getItem('smartmind_currency') || 'RM');
  useEffect(() => localStorage.setItem('smartmind_currency', currency), [currency]);

  const [userStats, setUserStats] = useState<UserProfileStats>(() => {
    const saved = localStorage.getItem('smartmind_user_stats');
    if (saved) return JSON.parse(saved);
    return { age: 25, gender: 'male', height: 175, weight: 70, activityLevel: 'moderate' };
  });
  useEffect(() => localStorage.setItem('smartmind_user_stats', JSON.stringify(userStats)), [userStats]);

  const tasksForSelectedDate = useMemo(() => goal.tasks.filter(t => t.date === selectedDate), [goal.tasks, selectedDate]);
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = goal.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    onUpdateGoal({ ...goal, tasks: updatedTasks });
  };
  const handleUpdateFeedback = (taskId: string, feedback: string) => {
    const updatedTasks = goal.tasks.map(t => t.id === taskId ? { ...t, feedback } : t);
    onUpdateGoal({ ...goal, tasks: updatedTasks });
  };

  const handleAddFood = async () => {
    if (!foodInput.trim()) return;
    const targetFood = foodInput.trim();
    if (!gemini) {
      const newEntry: FoodEntry = { id: crypto.randomUUID(), name: targetFood, calories: 250, protein: 15, date: selectedDate };
      onUpdateGoal({ ...goal, foodLogs: [...goal.foodLogs, newEntry] });
      setFoodInput('');
      return;
    }
    setLoading(true);
    try {
      const data = await gemini.calculateNutrition(targetFood);
      const newEntry: FoodEntry = { id: crypto.randomUUID(), name: targetFood, calories: data.calories, protein: data.protein, date: selectedDate };
      onUpdateGoal({ ...goal, foodLogs: [...goal.foodLogs, newEntry] });
      setFoodInput('');
    } catch (err) {} finally { setLoading(false); }
  };

  const handleAddExercise = async () => {
    if (!exerciseInput.name) return;
    if (!gemini) {
      const newEntry: ExerciseEntry = { id: crypto.randomUUID(), name: exerciseInput.name, value: exerciseInput.value, unit: exerciseInput.unit, caloriesBurned: 150, date: selectedDate };
      onUpdateGoal({ ...goal, exerciseLogs: [...goal.exerciseLogs, newEntry] });
      setExerciseInput({ ...exerciseInput, name: '' });
      return;
    }
    setLoading(true);
    try {
      const data = await gemini.calculateExercise(exerciseInput.name, exerciseInput.value, exerciseInput.unit, userStats);
      const newEntry: ExerciseEntry = { id: crypto.randomUUID(), name: exerciseInput.name, value: exerciseInput.value, unit: exerciseInput.unit, caloriesBurned: data.caloriesBurned, date: selectedDate };
      onUpdateGoal({ ...goal, exerciseLogs: [...goal.exerciseLogs, newEntry] });
      setExerciseInput({ ...exerciseInput, name: '' });
    } catch (err) {} finally { setLoading(false); }
  };

  const handleAddFinance = () => {
    if (!financeInput.category || financeInput.amount <= 0) return;
    const newEntry: FinanceEntry = { id: crypto.randomUUID(), ...financeInput, date: selectedDate };
    onUpdateGoal({ ...goal, financeLogs: [newEntry, ...goal.financeLogs] });
    setFinanceInput({ type: 'expense', category: '', amount: 0, description: '' });
  };

  const handleAddReading = () => {
    const newEntry: ReadingEntry = { id: crypto.randomUUID(), title: readingInput.title, totalPages: readingInput.totalPages, currentPages: readingInput.readToday, history: [{ date: selectedDate, pagesRead: readingInput.readToday, summary: readingInput.summary }] };
    onUpdateGoal({ ...goal, readingLogs: [...goal.readingLogs, newEntry] });
    setReadingInput({ title: '', totalPages: 100, readToday: 0, summary: '' });
  };

  const getAdvice = async () => {
    if (!gemini) {
      setCoachAdvice(t("### 系統訊息\n- AI 教練暫時無法連線。請檢查環境變數設定。"));
      return;
    }
    setLoading(true);
    const summary = `Goal: ${goal.title}. Tasks: ${goal.tasks.length}. Progress: ${goal.tasks.filter(t => t.completed).length}.`;
    try {
      const advice = await gemini.getCoachAdvice(summary);
      setCoachAdvice(advice || t("AI 教練目前無法提供建議。"));
    } catch (err: any) {
      setCoachAdvice(t("連線失敗，請檢查 API 設定或網路連線。"));
    } finally { setLoading(false); }
  };

  const dailyExerciseLogs = goal.exerciseLogs.filter(log => log.date === selectedDate);
  const dailyTotalCaloriesBurned = dailyExerciseLogs.reduce((acc, log) => acc + log.caloriesBurned, 0);
  const dailyTotalCaloriesIngested = goal.foodLogs.filter(f => f.date === selectedDate).reduce((acc, log) => acc + log.calories, 0);
  const netCalories = dailyTotalCaloriesIngested - dailyTotalCaloriesBurned;

  const tabItems = [
    { id: RecordType.DIET, icon: Utensils, label: t('飲食') },
    { id: RecordType.EXERCISE, icon: Activity, label: t('運動') },
    { id: RecordType.FINANCE, icon: DollarSign, label: t('財務') },
    { id: RecordType.READING, icon: BookOpen, label: t('閱讀') },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">{t(goal.title)}</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
            {t('啟動日期')}：{new Date(goal.startDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowTaskModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl active:scale-95">
             <ClipboardList size={20} /> {t('每日任務')}
           </button>
           <button onClick={getAdvice} disabled={loading} className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white px-4 py-3 rounded-2xl font-black transition-all shadow-xl active:scale-95">
             <Lightbulb size={20} /> {loading ? t('思考中...') : t('教練建議')}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm">
            <h3 className="font-black text-slate-200 flex items-center gap-2 mb-4">
              <CalendarIcon size={18} className="text-indigo-500" /> {t('日曆')}
            </h3>
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <span key={d} className="text-[10px] font-black text-slate-500 uppercase">{t(d)}</span>
              ))}
              {Array.from({ length: 30 }).map((_, i) => (
                <button key={i} className="p-2 text-slate-400 hover:text-white">{i + 1}</button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <h3 className="font-black text-slate-200 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" /> {t('報告摘要')}
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{t('今日淨熱量')}</span>
                <p className={`text-lg font-black ${netCalories > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{netCalories} kcal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {goal.mindMap && (
            <MindMap data={goal.mindMap} isCollapsed={mindMapCollapsed} onToggle={() => setMindMapCollapsed(!mindMapCollapsed)} onViewTasks={() => setShowTaskModal(true)} hasTasks={goal.tasks.length > 0} />
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-800 overflow-x-auto bg-slate-800/20">
              {tabItems.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as RecordType)} className={`flex items-center gap-2 px-6 py-4 font-black transition-all border-b-2 ${activeTab === tab.id ? 'text-indigo-400 border-indigo-400 bg-indigo-500/5' : 'text-slate-500 border-transparent'}`}>
                  <tab.icon size={18} /> {tab.label}
                </button>
              ))}
            </div>
            <div className="p-6">
               {activeTab === RecordType.DIET && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input type="text" placeholder={t("食物名稱 (例如: '雞胸肉')")} value={foodInput} onChange={e => setFoodInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white" />
                    <button onClick={handleAddFood} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-2xl font-black py-3"><Plus size={20} /></button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t('今日攝取清單')}</h4>
                    {goal.foodLogs.filter(f => f.date === selectedDate).map(item => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                        <span className="font-bold text-white">{t(item.name)}</span>
                        <span className="text-sm font-black text-indigo-400">{item.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {coachAdvice && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <Lightbulb size={24} className="text-amber-500" />
                <h3 className="text-2xl font-black text-white">{t('教練建議')}</h3>
              </div>
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                <ReactMarkdown>{t(coachAdvice)}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTaskModal && <DailyTaskModal tasks={tasksForSelectedDate} date={selectedDate} onClose={() => setShowTaskModal(false)} onToggleTask={handleToggleTask} onUpdateFeedback={handleUpdateFeedback} />}
    </div>
  );
};

export default CoachDashboard;
