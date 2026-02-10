
import React from 'react';
import { X, CheckCircle2, Circle } from 'lucide-react';
import { Task } from '../types';

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
      case 'diet': return "記錄今天的飲食心情或特殊感受...";
      case 'exercise': return "運動強度如何？感覺累嗎？";
      case 'reading': return "讀到了什麼重點？有什麼心得？";
      case 'finance': return "今天有超支嗎？還是省錢了？";
      default: return "分享一下今天的執行狀況...";
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/30">
          <div>
            <h2 className="text-lg font-black text-white">每日任務清單</h2>
            <p className="text-xs text-slate-400 font-bold">{new Date(date).toLocaleDateString('zh-TW', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 italic">今天沒有指派任務。</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 transition-transform active:scale-90 ${task.completed ? 'text-emerald-500' : 'text-slate-600'}`}
                  >
                    {task.completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-bold ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {task.title}
                    </h3>
                    <span className="inline-block px-2 py-0.5 mt-1 bg-slate-700 text-slate-400 text-[10px] rounded uppercase tracking-wider font-black">
                      {task.category}
                    </span>
                    
                    <textarea
                      value={task.feedback || ''}
                      onChange={(e) => onUpdateFeedback(task.id, e.target.value)}
                      placeholder={getPlaceholder(task.category)}
                      className="w-full mt-3 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 bg-slate-800/30 flex justify-end">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black transition-all shadow-xl active:scale-95"
          >
            儲存並關閉
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyTaskModal;
