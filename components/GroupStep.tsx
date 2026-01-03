
import React, { useState, useMemo } from 'react';
import { GroupConfig, RawData } from '../types';
import { Plus, Trash2, Calendar, GripVertical, Package, ArrowRightLeft, Sparkles } from 'lucide-react';

interface GroupStepProps {
  data: RawData;
  dateColumn: string;
  groups: GroupConfig[];
  onChange: (groups: GroupConfig[]) => void;
}

const GroupStep: React.FC<GroupStepProps> = ({ data, dateColumn, groups, onChange }) => {
  const [newGroupName, setNewGroupName] = useState('');

  const uniqueDates = useMemo(() => {
    const idx = data.headers.indexOf(dateColumn);
    if (idx === -1) return [];
    return Array.from(new Set(data.rows.map(row => row[idx]?.toString() || '').filter(Boolean))).sort();
  }, [data, dateColumn]);

  const unassignedDates = useMemo(() => {
    const assigned = new Set(groups.flatMap(g => g.dates));
    return uniqueDates.filter(d => !assigned.has(d));
  }, [uniqueDates, groups]);

  const addGroup = (name?: string) => {
    const targetName = name || newGroupName.trim();
    if (!targetName) return;
    onChange([...groups, { name: targetName, dates: [] }]);
    setNewGroupName('');
  };

  const quickCreateGroup = (date: string) => {
    // 建立一個以日期命名的分群，並直接把該日期放進去
    onChange([...groups, { name: date, dates: [date] }]);
  };

  const removeGroup = (idx: number) => {
    const updated = [...groups];
    updated.splice(idx, 1);
    onChange(updated);
  };

  const moveDate = (date: string, targetGroupIdx: number | null) => {
    const updated = groups.map((g, idx) => {
      const filtered = g.dates.filter(d => d !== date);
      if (idx === targetGroupIdx) filtered.push(date);
      return { ...g, dates: filtered };
    });
    onChange(updated);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number | null) => {
    e.preventDefault();
    const date = e.dataTransfer.getData('date');
    if (date) moveDate(date, targetIdx);
  };

  return (
    <div className="flex flex-col h-[650px]">
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-xl font-black text-orange-900">梯次分群整理</h2>
        <p className="text-sm text-orange-700 font-medium">拖拉日期卡片至分群，或使用快速建立功能。</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* 左側：待分配日期 */}
        <div 
          className="w-72 flex-shrink-0 flex flex-col border border-orange-200 rounded-2xl bg-[#FFF9F2] p-5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold text-xs uppercase tracking-wider border-b border-orange-100 pb-2">
            <Calendar className="w-4 h-4" /> 待分配項目 ({unassignedDates.length})
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {unassignedDates.map(date => (
              <div 
                key={date} 
                draggable 
                onDragStart={(e) => e.dataTransfer.setData('date', date)} 
                className="p-4 bg-white border border-orange-100 rounded-xl shadow-sm text-sm font-bold text-orange-900 cursor-grab active:cursor-grabbing hover:border-orange-400 hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-orange-200 group-hover:text-orange-400 transition-colors" /> 
                  {date}
                </div>
                <button 
                  onClick={() => quickCreateGroup(date)}
                  className="p-1 text-orange-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="快速以此日期建立分群"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            ))}
            {unassignedDates.length === 0 && (
              <div className="py-20 text-center opacity-40">
                <Package className="w-10 h-10 mx-auto mb-2 text-orange-300" />
                <p className="text-xs font-bold text-orange-400 italic">全部日期已分配</p>
              </div>
            )}
          </div>
        </div>

        {/* 右側：分群區域（可捲動） */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col gap-4 mb-6 flex-shrink-0">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="輸入自定義分群名稱..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGroup()}
                  className="w-full border-2 border-orange-100 rounded-xl px-4 py-2.5 text-sm font-bold text-orange-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all bg-white"
                />
              </div>
              <button 
                onClick={() => addGroup()} 
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> 新增分群
              </button>
            </div>
            
            {/* 快速選擇日期建立分群 */}
            {unassignedDates.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <span className="text-[10px] font-black text-orange-400 whitespace-nowrap uppercase tracking-widest">快速建立：</span>
                {unassignedDates.slice(0, 5).map(date => (
                  <button
                    key={date}
                    onClick={() => quickCreateGroup(date)}
                    className="px-3 py-1 bg-white border border-orange-100 rounded-lg text-[10px] font-black text-orange-600 hover:border-orange-400 hover:bg-orange-50 transition-all whitespace-nowrap shadow-sm"
                  >
                    {date}
                  </button>
                ))}
                {unassignedDates.length > 5 && <span className="text-[10px] text-orange-300">...</span>}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
              {groups.map((group, idx) => (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, idx)}
                  className="border-2 border-orange-50 rounded-2xl p-5 bg-white hover:border-orange-400 transition-all shadow-sm group/card min-h-[160px] flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-black text-orange-900 tracking-tight truncate max-w-[120px]">{group.name}</span>
                      <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold">{group.dates.length}</span>
                    </div>
                    <button 
                      onClick={() => removeGroup(idx)} 
                      className="text-orange-200 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 flex flex-wrap gap-2 content-start">
                    {group.dates.map(date => (
                      <div 
                        key={date} 
                        className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold flex items-center gap-2 border border-orange-100 group/item hover:bg-orange-100 transition-colors"
                      >
                        {date}
                        <button 
                          onClick={() => moveDate(date, null)}
                          className="text-orange-300 hover:text-orange-600 transition-colors"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {group.dates.length === 0 && (
                      <div className="w-full h-full min-h-[60px] border-2 border-dashed border-orange-50 rounded-xl flex items-center justify-center text-orange-200 text-xs font-bold italic bg-orange-50/10">
                        拖移日期至此分類
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {groups.length === 0 && (
                <div className="col-span-full py-20 text-center border-4 border-dashed border-orange-50 rounded-3xl bg-orange-50/5">
                  <Package className="w-12 h-12 mx-auto mb-3 text-orange-200" />
                  <p className="text-orange-400 font-bold">尚未建立任何分群梯次</p>
                  <p className="text-orange-300 text-xs mt-1 font-medium">請從左側拖移日期或在上方新增分群</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FED7AA;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F97316;
        }
      `}</style>
    </div>
  );
};

export default GroupStep;
