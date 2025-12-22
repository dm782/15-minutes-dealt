
import React from 'react';
import { TimeSlot, Category } from '../types';
import { CATEGORY_COLORS, CATEGORIES } from '../constants';

interface Props {
  slot: TimeSlot;
  onUpdate: (id: string, activity: string, category: Category) => void;
}

export const TimeSlotCard: React.FC<Props> = ({ slot, onUpdate }) => {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-2xl border-l-4 transition-all duration-300 bg-slate-900/40 backdrop-blur-sm group hover:bg-slate-800/60 ${CATEGORY_COLORS[slot.category]}`}>
      <div className="w-14 flex-shrink-0 text-xs font-black tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">
        {slot.time}
      </div>
      <div className="flex-grow flex gap-3 flex-col sm:flex-row items-center">
        <input
          type="text"
          value={slot.activity}
          onChange={(e) => onUpdate(slot.id, e.target.value, slot.category)}
          placeholder="Чем вы занимались?"
          className="flex-grow w-full px-4 py-2 text-sm bg-black/20 border border-white/5 rounded-xl focus:border-white/20 focus:ring-1 focus:ring-white/10 outline-none transition-all placeholder:text-slate-600 text-slate-200"
        />
        <select
          value={slot.category}
          onChange={(e) => onUpdate(slot.id, slot.activity, e.target.value as Category)}
          className={`w-full sm:w-auto px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border appearance-none cursor-pointer outline-none bg-transparent ${CATEGORY_COLORS[slot.category]}`}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat} className="bg-slate-950 text-slate-200">{cat}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
