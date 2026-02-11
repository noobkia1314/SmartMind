
import React from 'react';
import { X, CheckCircle2, Circle, Type } from 'lucide-react';
import { Task } from '../types.ts';

interface DailyTaskModalProps {
  tasks: Task[];
  date: string;
  onClose: () => void;
  onToggleTask: (taskId: string) => void;
  onUpdateFeedback: (taskId: string, feedback: string) => void;
}

const DailyTaskModal: React.FC<DailyTaskModalProps> = ({ tasks, date, onClose, onToggleTask, onUpdateFeedback }) => {
  const getPlaceholder = (category: string) => {
    switch (category.toLowerCase()) {
      case 'diet': return "今天的飲食讓你感覺如何？是否有達到目標？";
      case 'exercise': return "運動強度是否合適？有沒有感覺更有活力？";
      case 'reading': return "讀到了哪些令人啟發的內容？";
      case 'finance': return "這筆開銷是否必要？是否有儲蓄感？";
      default: return "請記錄任務執行心得...";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/30">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">每日任務進度</h2>
            <p className="text-xs text-slate-500 font-black uppercase tracking-widest">{date}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          {tasks.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-slate-600" size={40} />
              </div>
              <p className="text-slate-500 font-bold">此日期暫無任務指派。</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className={`p-6 rounded-[2rem] border transition-all duration-300 ${task.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                <div className="flex items-start gap-4">
                  <button 
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-1 transition-transform active:scale-75 ${task.completed ? 'text-emerald-500' : 'text-slate-700'}`}
                  >
                    {task.completed ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                  </button>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{task.category}</span>
                      <h3 className={`text-xl font-bold leading-tight ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {task.title}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">執行反饋</label>
                      <textarea
                        value={task.feedback || ''}
                        onChange={(e) => onUpdateFeedback(task.id, e.target.value)}
                        placeholder={getPlaceholder(task.category)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-6 bg-slate-800/30 border-t border-slate-800">
          <button 
            onClick={onClose}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-lg transition-all shadow-xl active:scale-95"
          >
            完成並儲存
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyTaskModal;
