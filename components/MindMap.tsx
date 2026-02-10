
import React, { useState } from 'react';
import { MindMapNode } from '../types';
import { ChevronDown, ChevronUp, Clock, Target, CheckCircle2, Info, LayoutList } from 'lucide-react';

interface MindMapProps {
  data: MindMapNode;
  isCollapsed: boolean;
  onToggle: () => void;
}

const MindMap: React.FC<MindMapProps> = ({ data, isCollapsed, onToggle }) => {
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  const handleNodeClick = (id: string) => {
    setExpandedNodeId(expandedNodeId === id ? null : id);
  };

  return (
    <div className={`transition-all duration-300 ease-in-out border border-slate-800 rounded-3xl bg-slate-900 shadow-xl overflow-hidden ${isCollapsed ? 'h-16' : 'min-h-[300px]'}`}>
      <div 
        className="flex items-center justify-between px-6 py-4 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors" 
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
            <Target size={18} />
          </div>
          <h3 className="font-black text-slate-200">核心目標藍圖</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded">
            {data.children?.length || 0} 階段任務
          </span>
          {isCollapsed ? <ChevronDown size={20} className="text-slate-500" /> : <ChevronUp size={20} className="text-slate-500" />}
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-6">
          <div className="mb-6 p-4 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl">
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">主導任務</p>
            <h4 className="text-xl font-black text-white">{data.label}</h4>
          </div>

          <div className="space-y-3">
            {data.children && data.children.length > 0 ? (
              data.children.map((child, index) => {
                const isExpanded = expandedNodeId === child.id;
                // Generate a pseudo-random progress for visual interest
                const pseudoProgress = Math.floor(Math.abs(Math.sin(index)) * 100);

                return (
                  <div 
                    key={child.id} 
                    className={`border transition-all duration-300 rounded-2xl ${
                      isExpanded 
                        ? 'bg-slate-800/40 border-indigo-500/50 shadow-lg' 
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button 
                      onClick={() => handleNodeClick(child.id)}
                      className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                          isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className={`font-bold truncate ${isExpanded ? 'text-white' : 'text-slate-400'}`}>
                          {child.label}
                        </span>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isExpanded ? <ChevronUp size={18} className="text-indigo-400" /> : <ChevronDown size={18} className="text-slate-600" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-5 pt-0 animate-in slide-in-from-top-2 duration-300">
                        <div className="ml-11 space-y-4">
                          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/50">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">
                              <Info size={12} /> 詳細說明
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed italic">
                              這是達成主目標的關鍵里程碑。AI 建議在此階段專注於基礎建設與習慣養成，為後續的高強度任務奠定穩固基礎。
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                              <Clock size={14} className="text-amber-500" />
                              預估時間: 2-3 週
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              狀態: 執行中
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">階段完成度</span>
                              <span className="text-xs font-black text-indigo-400">{pseudoProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                className="h-full bg-indigo-500 transition-all duration-1000"
                                style={{ width: `${pseudoProgress}%` }}
                              />
                            </div>
                          </div>

                          <button className="flex items-center gap-2 text-[10px] text-indigo-400 font-black uppercase tracking-widest hover:text-indigo-300 transition-colors group">
                            <LayoutList size={14} />
                            查看相關每日任務
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-600 text-sm">無子項目數據</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
            <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black opacity-50">SmartMind AI Blueprint v2.0</p>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMap;
