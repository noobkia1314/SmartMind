
import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp, Calendar, Rocket, Star, Info } from 'lucide-react';
import { UserGoal } from '../types';

interface GoalListProps {
  goals: UserGoal[];
  onSelectGoal: (id: string) => void;
}

const GoalList: React.FC<GoalListProps> = ({ goals, onSelectGoal }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const calculateProgress = (goal: UserGoal) => {
    if (goal.tasks.length === 0) return 0;
    const completed = goal.tasks.filter(t => t.completed).length;
    return Math.round((completed / goal.tasks.length) * 100);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[90vw] md:max-w-none mx-auto pb-10">
      {goals.map((goal, index) => {
        const progress = calculateProgress(goal);
        const isExpanded = expandedId === goal.id;

        return (
          <div 
            key={goal.id}
            className={`group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-indigo-500/5 ${
              isExpanded ? 'ring-2 ring-indigo-500/30' : 'hover:border-indigo-500/50'
            }`}
          >
            {/* Header / Main Card Info */}
            <div className="p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : goal.id)}>
              {/* Icon Container */}
              <div className="shrink-0 w-14 h-14 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center font-black text-xl border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Star size={24} />
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h3 className="text-xl font-black text-white truncate">{goal.title}</h3>
                  <span className="hidden md:block shrink-0 px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-700">
                    ID: {index + 1}
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-indigo-400 w-10">{progress}%</span>
                </div>
              </div>

              {/* Right Side Info */}
              <div className="shrink-0 flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-1 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">
                    <Calendar size={12} />
                    開始日期
                  </div>
                  <div className="text-white font-bold text-sm">
                    {new Date(goal.startDate).toLocaleDateString('zh-TW')}
                  </div>
                </div>
                <div className="text-slate-600">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            {/* Expandable Section */}
            {isExpanded && (
              <div className="px-6 pb-6 border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-300">
                <div className="pt-6 space-y-6">
                  {/* Stats Placeholder */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">任務總數</p>
                      <p className="text-lg font-black text-white">{goal.tasks.length}</p>
                    </div>
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">飲食記錄</p>
                      <p className="text-lg font-black text-emerald-400">{goal.foodLogs.length}</p>
                    </div>
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">運動次數</p>
                      <p className="text-lg font-black text-rose-400">{goal.exerciseLogs.length}</p>
                    </div>
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">財務記錄</p>
                      <p className="text-lg font-black text-amber-400">{goal.financeLogs.length}</p>
                    </div>
                  </div>

                  {/* Description Placeholder */}
                  <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3 text-indigo-400 font-black text-xs uppercase tracking-widest">
                      <Info size={14} />
                      目標說明與戰略
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed italic">
                      「這是一條通往卓越的道路。AI 教練已為您制定了專屬的核心思維導圖與每日挑戰。持續執行，透過數據回饋不斷優化，您將在 {new Date(goal.startDate).toLocaleDateString('zh-TW')} 之後的旅程中遇見更好的自己。」
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center md:justify-end">
                    <button 
                      onClick={() => onSelectGoal(goal.id)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/20 active:scale-95 group/btn"
                    >
                      <Rocket size={20} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      進入 AI 教練模式
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GoalList;
