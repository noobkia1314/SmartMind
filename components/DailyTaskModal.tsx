
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
      case 'diet': return "How did you feel about your meals today?";
      case 'exercise': return "How was your intensity level?";
      case 'reading': return "Any key takeaways or thoughts?";
      case 'finance': return "Did you stick to your budget goals?";
      default: return "Share your reflections on this task...";
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/30">
          <div>
            <h2 className="text-lg font-bold text-white">Daily Operations</h2>
            <p className="text-xs text-slate-400">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 italic">No tasks assigned for this day.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                      {task.title}
                    </h3>
                    <span className="inline-block px-2 py-0.5 mt-1 bg-slate-700 text-slate-300 text-[10px] rounded uppercase tracking-wider font-bold">
                      {task.category}
                    </span>
                    
                    <textarea
                      value={task.feedback || ''}
                      onChange={(e) => onUpdateFeedback(task.id, e.target.value)}
                      placeholder={getPlaceholder(task.category)}
                      className="w-full mt-3 bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all min-h-[60px]"
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
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all shadow-lg active:scale-95"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyTaskModal;
