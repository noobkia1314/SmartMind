
import React, { useState, useMemo } from 'react';
import { 
  Utensils, Activity, BookOpen, DollarSign, 
  ChevronLeft, ChevronRight, Plus, 
  TrendingUp, ClipboardList, Lightbulb,
  Calendar as CalendarIcon, PieChart, Info, RefreshCw, Trash2
} from 'lucide-react';
import { UserGoal, RecordType, FoodEntry, ExerciseEntry, FinanceEntry, ReadingEntry } from '../types';
import MindMap from './MindMap';
import DailyTaskModal from './DailyTaskModal';
import { GeminiService } from '../services/geminiService';

interface CoachDashboardProps {
  goal: UserGoal;
  gemini: GeminiService | null;
  onUpdateGoal: (updatedGoal: UserGoal) => void;
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({ goal, gemini, onUpdateGoal }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [mindMapCollapsed, setMindMapCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<RecordType>(RecordType.DIET);
  const [loading, setLoading] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string>('');
  const [isServiceBusy, setIsServiceBusy] = useState(false);

  // Local entry states
  const [foodInput, setFoodInput] = useState('');
  const [exerciseInput, setExerciseInput] = useState({ name: '', duration: 30 });
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
    if (!foodInput || !gemini) return;
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
        console.error("Log food failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async () => {
    if (!exerciseInput.name || !gemini) return;
    setLoading(true);
    try {
      const data = await gemini.calculateExercise(exerciseInput.name, exerciseInput.duration);
      const newEntry: ExerciseEntry = {
        id: crypto.randomUUID(),
        name: exerciseInput.name,
        duration: exerciseInput.duration,
        caloriesBurned: data.caloriesBurned,
        date: selectedDate
      };
      onUpdateGoal({ ...goal, exerciseLogs: [...goal.exerciseLogs, newEntry] });
      setExerciseInput({ name: '', duration: 30 });
    } catch (err) {
        console.error("Log exercise failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExercise = (id: string) => {
    const updatedLogs = goal.exerciseLogs.filter(log => log.id !== id);
    onUpdateGoal({ ...goal, exerciseLogs: updatedLogs });
  };

  const handleAddFinance = () => {
    const newEntry: FinanceEntry = {
      id: crypto.randomUUID(),
      ...financeInput,
      date: selectedDate
    };
    onUpdateGoal({ ...goal, financeLogs: [...goal.financeLogs, newEntry] });
    setFinanceInput({ type: 'expense', category: '', amount: 0, description: '' });
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
    if (!gemini) return;
    setLoading(true);
    setIsServiceBusy(false);
    const summary = `Goal: ${goal.title}. Total Tasks: ${goal.tasks.length}, Completed: ${goal.tasks.filter(t => t.completed).length}. Total Calories: ${goal.foodLogs.reduce((acc, f) => acc + f.calories, 0)}. Fitness duration: ${goal.exerciseLogs.reduce((acc, e) => acc + e.duration, 0)}. Finance balance: ${goal.financeLogs.reduce((acc, f) => acc + (f.type === 'income' ? f.amount : -f.amount), 0)}.`;
    try {
      const advice = await gemini.getCoachAdvice(summary);
      setCoachAdvice(advice || "Coach is momentarily unavailable.");
    } catch (err: any) {
      console.error(err);
      const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('Service Unavailable') || err?.message?.includes('overloaded');
      
      if (is503) {
        console.log("Gemini 503 detected, retry later");
        setIsServiceBusy(true);
      } else {
        setCoachAdvice("Failed to get advice. Please check your connection.");
      }
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

  // Mini Calendar logic
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">{goal.title}</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">啟動日期：{new Date(goal.startDate).toLocaleDateString()}</p>
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

      {isServiceBusy && (
        <div className="bg-sky-500/10 border-2 border-sky-500/30 text-sky-400 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-3 bg-sky-500/20 rounded-full shrink-0">
            <Info size={24} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="font-black text-lg">教練目前連線不穩</p>
            <p className="text-sm opacity-90">AI 伺服器目前很忙碌（高需求），這是暫時現象，請 5–30 分鐘後再試，或更換時間使用。</p>
          </div>
          <button 
            onClick={getAdvice}
            className="shrink-0 flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg"
          >
            <RefreshCw size={18} />
            嘗試重新連線
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          {/* Calendar View */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-200 flex items-center gap-2">
                <CalendarIcon size={18} className="text-indigo-500" />
                日曆視圖
              </h3>
              <div className="flex gap-1">
                <button onClick={() => {
                  const d = new Date(selectedDate);
                  d.setMonth(d.getMonth() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronLeft size={20}/></button>
                <button onClick={() => {
                  const d = new Date(selectedDate);
                  d.setMonth(d.getMonth() + 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronRight size={20}/></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <span key={d} className="text-[10px] font-black text-slate-500">{d}</span>
              ))}
              {Array.from({ length: daysInMonth.firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth.days }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${new Date(selectedDate).getFullYear()}-${String(new Date(selectedDate).getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isActive = dateStr === selectedDate;
                const hasTasks = goal.tasks.some(t => t.date === dateStr);
                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDate(dateStr);
                    }}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold relative transition-all ${
                      isActive ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {day}
                    {hasTasks && !isActive && <div className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <h3 className="font-black text-slate-200 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              數據報告
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">健康熱量</p>
                <p className="text-xl font-black text-indigo-400">{goal.foodLogs.reduce((a, b) => a + b.calories, 0)} kcal</p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">運動消耗</p>
                <p className="text-xl font-black text-rose-400">{goal.exerciseLogs.reduce((a, b) => a + b.caloriesBurned, 0)} kcal</p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">財務結餘</p>
                <p className="text-xl font-black text-emerald-400">
                  ${goal.financeLogs.reduce((a, b) => a + (b.type === 'income' ? b.amount : -b.amount), 0)}
                </p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">閱讀進度</p>
                <p className="text-xl font-black text-amber-400">
                  {goal.readingLogs.reduce((a, b) => a + b.currentPages, 0)} 頁
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {goal.mindMap && (
            <MindMap data={goal.mindMap} isCollapsed={mindMapCollapsed} onToggle={() => setMindMapCollapsed(!mindMapCollapsed)} />
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-800 overflow-x-auto custom-scrollbar bg-slate-800/20">
              {[
                { id: RecordType.DIET, icon: Utensils, label: '飲食記錄' },
                { id: RecordType.EXERCISE, icon: Activity, label: '運動記錄' },
                { id: RecordType.FINANCE, icon: DollarSign, label: '財務記錄' },
                { id: RecordType.READING, icon: BookOpen, label: '閱讀記錄' },
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
                      placeholder="輸入食物名稱 (例如: '雞胸肉沙拉')"
                      value={foodInput}
                      onChange={e => setFoodInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      onClick={handleAddFood} 
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-8 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 py-3"
                    >
                      <Plus size={20} />
                      {loading ? '計算中...' : '記錄'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {goal.foodLogs.filter(f => f.date === selectedDate).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                        <div>
                          <p className="font-bold text-white">{item.name}</p>
                          <p className="text-xs text-slate-500 font-bold">{item.calories} kcal • {item.protein}g 蛋白質</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === RecordType.EXERCISE && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest">新增運動項目</h4>
                    <div className="text-xs font-black px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                      今日總運動消耗: {dailyTotalCaloriesBurned} kcal
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <input 
                      type="text" 
                      placeholder="運動項目 (例如: 跑步)"
                      value={exerciseInput.name}
                      onChange={e => setExerciseInput({...exerciseInput, name: e.target.value})}
                      className="bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="時間 (分)"
                        value={exerciseInput.duration}
                        onChange={e => setExerciseInput({...exerciseInput, duration: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button 
                        onClick={handleAddExercise}
                        disabled={loading || !exerciseInput.name}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-2 py-3 transition-all active:scale-95"
                      >
                        {loading ? <RefreshCw className="animate-spin" size={18}/> : <Plus size={18} />}
                        記錄
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-3">今日記錄</h4>
                    {dailyExerciseLogs.length === 0 ? (
                      <p className="text-slate-600 italic text-sm text-center py-6 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">尚未記錄任何運動</p>
                    ) : (
                      dailyExerciseLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center">
                              <Activity size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-white">{log.name}</p>
                              <p className="text-xs text-slate-500 font-bold">
                                {log.duration} 分鐘 | 估計消耗 <span className="text-rose-400">{log.caloriesBurned} kcal</span>
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveExercise(log.id)}
                            className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === RecordType.FINANCE && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <select 
                      value={financeInput.type} 
                      onChange={e => setFinanceInput({...financeInput, type: e.target.value as any})}
                      className="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold"
                    >
                      <option value="expense">支出</option>
                      <option value="income">收入</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="類別"
                      value={financeInput.category}
                      onChange={e => setFinanceInput({...financeInput, category: e.target.value})}
                      className="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white"
                    />
                    <input 
                      type="number" 
                      placeholder="金額"
                      value={financeInput.amount || ''}
                      onChange={e => setFinanceInput({...financeInput, amount: parseFloat(e.target.value) || 0})}
                      className="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white"
                    />
                    <button 
                      onClick={handleAddFinance}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 py-3"
                    >
                      <Plus size={20} /> 加入
                    </button>
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3 text-white"
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

          {coachAdvice && !isServiceBusy && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform">
                  <Lightbulb size={24} />
                </div>
                <h3 className="text-2xl font-black text-white">教練戰略建議</h3>
              </div>
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                {coachAdvice.split('\n').map((line, i) => (
                  <p key={i} className="mb-4">
                    {line.startsWith('#') ? <span className="text-xl font-black text-white block mb-2">{line.replace(/#/g, '').trim()}</span> : 
                     line.startsWith('-') || line.startsWith('*') ? <span className="flex items-start gap-2 mb-2 ml-4"><span className="text-indigo-500 font-bold">•</span><span>{line.substring(1).trim()}</span></span> :
                     line.includes('**') ? <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-400 font-black">$1</strong>') }} /> :
                     line}
                  </p>
                ))}
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
