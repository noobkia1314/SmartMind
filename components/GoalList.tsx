
import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp, Calendar, Rocket, Star, Info, Hash } from 'lucide-react';
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
    <div className="flex flex-col gap-4 w-full max-w-[90vw] md:max-w-none mx-auto pb-6">
      {goals.map((goal, index) => {
        const progress = calculateProgress(goal);
        const isExpanded = expandedId === goal.id;

        return (
          <div 
            key={goal.id}
            style={{ backgroundColor: '#1e1e2f' }}
            className={`group rounded-[12px] overflow-hidden transition-all duration-300 border border-slate-800/50 shadow-xl ${
              isExpanded ? 'ring-2 ring-indigo-500/50 scale-[1.01]' : 'hover:border-indigo-400/30'
            }`}
          >
            {/* Header / Main Card Info */}
            <div 
              className="p-4 md:p-5 flex items-center gap-4 cursor-pointer" 
              onClick={() => setExpandedId(isExpanded ? null : goal.id)}
            >
              {/* Numeric Indicator */}
              <div className="shrink-0 w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-[10px] flex items-center justify-center font-black text-lg border border-indigo-500/20 transition-transform group-hover:scale-110">
                {index + 1}
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white leading-snug tracking-wide break-words mb-2">
                  {goal.title}
                </h3>
                
                {/* Progress Bar Container - Compact Style */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-indigo-300 w-8">{progress}%</span>
                </div>
              </div>

              {/* Expand Toggle */}
              <div className="shrink-0 text-slate-500 p-1">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
              <div className="px-5 pb-5 pt-2 border-t border-slate-800/50 animate-in slide-in-from-top-1 duration-200">
                <div className="space-y-4">
                  {/* Metadata labels */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Calendar size={12} className="text-indigo-500" />
                      啟動: {new Date(goal.startDate).toLocaleDateString('zh-TW')}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Target size={12} className="text-emerald-500" />
                      任務: {goal.tasks.length}
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed tracking-wide py-2 border-l-2 border-indigo-500/30 pl-4 bg-slate-900/30 rounded-r-lg">
                    「AI 教練已鎖定目標核心。此任務包含專屬藍圖與每日動態反饋，點擊下方按鈕開始您的進化之旅。」
                  </p>

                  <button 
                    onClick={(e) => { e.stopPropagation(); onSelectGoal(goal.id); }}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-[10px] font-black transition-all active:scale-95 shadow-lg shadow-indigo-500/10"
                  >
                    <Rocket size={18} />
                    啟動教練模式
                  </button>
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
