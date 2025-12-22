
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
type Category = 'Работа' | 'Отдых' | 'Спорт' | 'Еда' | 'Обучение' | 'Прочее' | 'Сон';

interface TimeSlot {
  id: string;
  time: string;
  activity: string;
  category: Category;
}

// --- CONSTANTS ---
const CATEGORIES: Category[] = ['Работа', 'Отдых', 'Спорт', 'Еда', 'Обучение', 'Сон', 'Прочее'];

const CATEGORY_COLORS: Record<Category, string> = {
  'Работа': 'border-cyan-500 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
  'Отдых': 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10 shadow-[0_0_10px_rgba(217,70,239,0.2)]',
  'Спорт': 'border-lime-500 text-lime-400 bg-lime-500/10 shadow-[0_0_10px_rgba(132,204,22,0.2)]',
  'Еда': 'border-orange-500 text-orange-400 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
  'Обучение': 'border-violet-500 text-violet-400 bg-violet-500/10 shadow-[0_0_10px_rgba(139,92,246,0.2)]',
  'Прочее': 'border-slate-500 text-slate-400 bg-slate-500/10 shadow-[0_0_10px_rgba(100,116,139,0.2)]',
  'Сон': 'border-blue-600 text-blue-400 bg-blue-600/10 shadow-[0_0_10px_rgba(37,99,235,0.2)]',
};

const NEON_COLORS = ['#06b6d4', '#d946ef', '#84cc16', '#f97316', '#8b5cf6', '#2563eb', '#64748b'];

// --- HELPERS ---
const getTodayKey = () => new Date().toISOString().split('T')[0];

const generateEmptySlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      slots.push({ id: time, time, activity: '', category: 'Прочее' });
    }
  }
  return slots;
};

// --- COMPONENTS ---
// Fix: Typed as React.FC to correctly handle standard props like 'key' in maps
const TimeSlotCard: React.FC<{ slot: TimeSlot, onUpdate: (id: string, activity: string, category: Category) => void }> = ({ slot, onUpdate }) => (
  <div id={`slot-${slot.id}`} className={`flex items-center gap-4 p-3 rounded-2xl border-l-4 transition-all duration-300 bg-slate-900/40 backdrop-blur-sm group hover:bg-slate-800/60 ${CATEGORY_COLORS[slot.category]}`}>
    <div className="w-14 flex-shrink-0 text-xs font-black tracking-tighter opacity-70 group-hover:opacity-100">{slot.time}</div>
    <div className="flex-grow flex gap-3 flex-col sm:flex-row items-center">
      <input
        type="text"
        value={slot.activity}
        onChange={(e) => onUpdate(slot.id, e.target.value, slot.category)}
        placeholder="Что делаем?"
        className="flex-grow w-full px-4 py-2 text-sm bg-black/20 border border-white/5 rounded-xl outline-none text-slate-200"
      />
      <select
        value={slot.category}
        onChange={(e) => onUpdate(slot.id, slot.activity, e.target.value as Category)}
        className={`w-full sm:w-auto px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border bg-transparent outline-none cursor-pointer ${CATEGORY_COLORS[slot.category]}`}
      >
        {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-slate-950 text-slate-200">{cat}</option>)}
      </select>
    </div>
  </div>
);

// --- MAIN APP ---
const App = () => {
  const todayKey = getTodayKey();
  const [slots, setSlots] = useState<TimeSlot[]>(() => {
    const saved = localStorage.getItem(`slots_${todayKey}`);
    return saved ? JSON.parse(saved) : generateEmptySlots();
  });
  const [advice, setAdvice] = useState('');
  const [activeTab, setActiveTab] = useState<'tracker' | 'stats' | 'advice'>('tracker');
  const [loading, setLoading] = useState(false);

  useEffect(() => { localStorage.setItem(`slots_${todayKey}`, JSON.stringify(slots)); }, [slots, todayKey]);

  const scrollToHour = useCallback((hour: number) => {
    const timeId = `${hour.toString().padStart(2, '0')}:00`;
    const element = document.getElementById(`slot-${timeId}`);
    if (element) {
      window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - 180, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => { if (activeTab === 'tracker') { const now = new Date(); setTimeout(() => scrollToHour(now.getHours()), 500); } }, [activeTab, scrollToHour]);

  const handleUpdate = (id: string, activity: string, category: Category) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, activity, category } : s));
  };

  const getAIAdvice = async () => {
    setLoading(true);
    try {
      // Fix: Use process.env.API_KEY directly for initialization according to guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const filled = slots.filter(s => s.activity.trim());
      const prompt = `Проанализируй мой день: ${filled.map(s => `${s.time}: ${s.activity}`).join(', ')}. Дай 3 совета на русском.`;
      const res = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
      // Fix: Access response text property directly
      setAdvice(res.text || 'Нет данных');
      setActiveTab('advice');
    } catch (e) { setAdvice('Ошибка API. Проверьте консоль.'); console.error(e); }
    setLoading(false);
  };

  const chartData = useMemo(() => {
    const counts: any = {};
    slots.forEach(s => { if (s.activity.trim()) counts[s.category] = (counts[s.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [slots]);

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col pb-32">
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 px-6 py-5">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black italic text-white tracking-tighter">NEON_PROTOCOL</h1>
          <button onClick={getAIAdvice} disabled={loading} className="bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
            {loading ? 'WAIT...' : '✨ AI ADVICE'}
          </button>
        </div>
        {activeTab === 'tracker' && (
          <div className="flex overflow-x-auto gap-2 py-1 no-scrollbar mask-fade">
            {Array.from({length: 24}, (_, i) => i).map(h => (
              <button key={h} onClick={() => scrollToHour(h)} className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border text-xs font-bold ${h === new Date().getHours() ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-white/5 text-slate-600'}`}>
                {h}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="p-4 md:p-8 flex-grow">
        {activeTab === 'tracker' ? (
          <div className="grid gap-3 animate-in fade-in duration-500">
            {slots.map(s => <TimeSlotCard key={s.id} slot={s} onUpdate={handleUpdate} />)}
          </div>
        ) : activeTab === 'stats' ? (
          <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={80} dataKey="value">
                  {chartData.map((_, i) => <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-slate-900/60 p-8 rounded-3xl border border-cyan-500/20 text-slate-300 whitespace-pre-wrap">{advice || 'Заполните журнал...'}</div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex justify-around shadow-2xl z-50">
        <button onClick={() => setActiveTab('tracker')} className={`p-3 rounded-xl ${activeTab === 'tracker' ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-600'}`}>LOG</button>
        <button onClick={() => setActiveTab('stats')} className={`p-3 rounded-xl ${activeTab === 'stats' ? 'text-fuchsia-400 bg-fuchsia-400/10' : 'text-slate-600'}`}>DATA</button>
        <button onClick={() => setActiveTab('advice')} className={`p-3 rounded-xl ${activeTab === 'advice' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-600'}`}>AI</button>
      </nav>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
