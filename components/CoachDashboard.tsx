
import React, { useState, useMemo } from 'react';
import { 
  Utensils, Activity, BookOpen, DollarSign, 
  ChevronLeft, ChevronRight, Plus, Trash2, 
  TrendingUp, TrendingDown, ClipboardList, Lightbulb
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
  const [mindMapCollapsed, setMindMapCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<RecordType>(RecordType.DIET);
  const [loading, setLoading] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string>('');

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
    } finally {
      setLoading(false);
    }
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
    const summary = `Goal: ${goal.title}. Total Tasks: ${goal.tasks.length}, Completed: ${goal.tasks.filter(t => t.completed).length}. Total Calories: ${goal.foodLogs.reduce((acc, f) => acc + f.calories, 0)}. Fitness duration: ${goal.exerciseLogs.reduce((acc, e) => acc + e.duration, 0)}. Finance balance: ${goal.financeLogs.reduce((acc, f) => acc + (f.type === 'income' ? f.amount : -f.amount), 0)}.`;
    const advice = await gemini.getCoachAdvice(summary);
    setCoachAdvice(advice);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">{goal.title}</h1>
          <p className="text-slate-400">Strategic Coaching Session • Active since {new Date(goal.startDate).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowTaskModal(true)}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95"
           >
             <ClipboardList size={20} />
             Open Daily Operations
           </button>
           <button 
             onClick={getAdvice}
             disabled={loading}
             className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95"
           >
             <Lightbulb size={20} />
             {loading ? 'Thinking...' : 'AI Advice'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-200">Session Date</h3>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400"><ChevronLeft size={20}/></button>
                <button className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400"><ChevronRight size={20}/></button>
              </div>
            </div>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer mb-2"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Protein</p>
                <p className="text-xl font-bold text-indigo-400">{goal.foodLogs.reduce((a, b) => a + b.protein, 0)}g</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Burned</p>
                <p className="text-xl font-bold text-rose-400">{goal.exerciseLogs.reduce((a, b) => a + b.caloriesBurned, 0)}</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Budget</p>
                <p className="text-xl font-bold text-emerald-400">
                  ${goal.financeLogs.reduce((a, b) => a + (b.type === 'income' ? b.amount : -b.amount), 0)}
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Read</p>
                <p className="text-xl font-bold text-amber-400">
                  {goal.readingLogs.reduce((a, b) => a + b.currentPages, 0)}p
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {goal.mindMap && (
            <MindMap data={goal.mindMap} isCollapsed={mindMapCollapsed} onToggle={() => setMindMapCollapsed(!mindMapCollapsed)} />
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-800 overflow-x-auto custom-scrollbar">
              {[
                { id: RecordType.DIET, icon: Utensils, label: 'Nutrition' },
                { id: RecordType.EXERCISE, icon: Activity, label: 'Fitness' },
                { id: RecordType.FINANCE, icon: DollarSign, label: 'Finance' },
                { id: RecordType.READING, icon: BookOpen, label: 'Learning' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as RecordType)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'text-indigo-500 border-indigo-500 bg-slate-800/30' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === RecordType.DIET && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter food (e.g. 'Avocado toast')"
                      value={foodInput}
                      onChange={e => setFoodInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-indigo-500"
                    />
                    <button 
                      onClick={handleAddFood} 
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Plus size={20} />
                      {loading ? '...' : 'Log'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {goal.foodLogs.filter(f => f.date === selectedDate).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.calories} cal • {item.protein}g protein</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === RecordType.EXERCISE && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Activity (e.g. Running)"
                      value={exerciseInput.name}
                      onChange={e => setExerciseInput({...exerciseInput, name: e.target.value})}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Mins"
                        value={exerciseInput.duration}
                        onChange={e => setExerciseInput({...exerciseInput, duration: parseInt(e.target.value) || 0})}
                        className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white"
                      />
                      <button 
                        onClick={handleAddExercise}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                      >
                        <Plus size={20} />
                        {loading ? '...' : 'Log Activity'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === RecordType.FINANCE && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <select 
                      value={financeInput.type} 
                      onChange={e => setFinanceInput({...financeInput, type: e.target.value as any})}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Category"
                      value={financeInput.category}
                      onChange={e => setFinanceInput({...financeInput, category: e.target.value})}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
                    />
                    <input 
                      type="number" 
                      placeholder="Amount"
                      value={financeInput.amount || ''}
                      onChange={e => setFinanceInput({...financeInput, amount: parseFloat(e.target.value) || 0})}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
                    />
                    <button 
                      onClick={handleAddFinance}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <Plus size={20} /> Add
                    </button>
                  </div>
                </div>
              )}

              {activeTab === RecordType.READING && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800 space-y-3">
                    <input 
                      type="text" 
                      placeholder="Book Title"
                      value={readingInput.title}
                      onChange={e => setReadingInput({...readingInput, title: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Total Pages</label>
                        <input 
                          type="number" 
                          value={readingInput.totalPages}
                          onChange={e => setReadingInput({...readingInput, totalPages: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Read Today</label>
                        <input 
                          type="number" 
                          value={readingInput.readToday}
                          onChange={e => setReadingInput({...readingInput, readToday: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleAddReading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-bold transition-all active:scale-95"
                    >
                      Record Reading Progress
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {coachAdvice && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                  <Lightbulb size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">Coach's Strategic Insights</h3>
              </div>
              <div className="prose prose-invert max-w-none">
                {coachAdvice.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 text-slate-300">{line}</p>
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
