
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TimeSlot, Category } from './types';
import { TimeSlotCard } from './components/TimeSlotCard';
import { getGeminiAdvice } from './services/gemini';
import { CATEGORY_COLORS } from './constants';

const getTodayKey = () => new Date().toISOString().split('T')[0];

const generateEmptySlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      slots.push({
        id: time,
        time,
        activity: '',
        category: 'Прочее'
      });
    }
  }
  return slots;
};

const formatMarkdown = (text: string) => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-400 font-black">$1</strong>')
    .replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc text-slate-300 mb-2">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-5">')
    .replace(/\n/g, '<br/>');
};

const App: React.FC = () => {
  const todayKey = getTodayKey();
  
  const [slots, setSlots] = useState<TimeSlot[]>(() => {
    const saved = localStorage.getItem(`slots_${todayKey}`);
    return saved ? JSON.parse(saved) : generateEmptySlots();
  });

  const [advice, setAdvice] = useState<string>(() => {
    return localStorage.getItem(`advice_${todayKey}`) || '';
  });

  const [activeTab, setActiveTab] = useState<'tracker' | 'stats' | 'advice'>(() => {
    return (localStorage.getItem('active_tab') as any) || 'tracker';
  });

  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Сохранение данных
  useEffect(() => {
    localStorage.setItem(`slots_${todayKey}`, JSON.stringify(slots));
  }, [slots, todayKey]);

  useEffect(() => {
    localStorage.setItem(`advice_${todayKey}`, advice);
    localStorage.setItem('active_tab', activeTab);
  }, [advice, activeTab]);

  // Скролл к конкретному часу
  const scrollToHour = useCallback((hour: number) => {
    const timeId = `${hour.toString().padStart(2, '0')}:00`;
    const element = document.getElementById(`slot-${timeId}`);
    if (element) {
      const header = document.querySelector('header');
      const offset = header ? header.offsetHeight + 20 : 150;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
      
      element.classList.add('ring-2', 'ring-cyan-500', 'ring-opacity-50');
      setTimeout(() => element.classList.remove('ring-2', 'ring-cyan-500', 'ring-opacity-50'), 2000);
    }
  }, []);

  // Авто-скролл к текущему часу при загрузке
  useEffect(() => {
    if (activeTab === 'tracker') {
      const now = new Date();
      setTimeout(() => scrollToHour(now.getHours()), 500);
    }
  }, [activeTab, scrollToHour]);

  const handleUpdateSlot = useCallback((id: string, activity: string, category: Category) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, activity, category } : s));
  }, []);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    slots.forEach(slot => {
      if (slot.activity.trim()) {
        counts[slot.category] = (counts[slot.category] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [slots]);

  const NEON_COLORS = ['#06b6d4', '#d946ef', '#84cc16', '#f97316', '#8b5cf6', '#2563eb', '#64748b'];

  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    const result = await getGeminiAdvice(slots);
    setAdvice(result);
    setLoadingAdvice(false);
    setActiveTab('advice');
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = new Date().getHours();

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-slate-950 text-slate-200 flex flex-col pb-32">
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/10 blur-[120px] rounded-full -z-10" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-6 py-5 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">NEON_PROTOCOL:15</h1>
            <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.3em] opacity-70">
              ACTIVE_SESSION // {todayKey}
            </p>
          </div>
          <button 
            onClick={fetchAdvice}
            disabled={loadingAdvice}
            className="bg-white text-black px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
          >
            {loadingAdvice ? 'WAIT...' : '✨ GET ADVICE'}
          </button>
        </div>

        {activeTab === 'tracker' && (
          <div className="flex overflow-x-auto gap-2 py-1 no-scrollbar mask-fade">
            {hours.map(h => (
              <button
                key={h}
                onClick={() => scrollToHour(h)}
                className={`flex-shrink-0 w-11 h-11 flex flex-col items-center justify-center rounded-xl border transition-all ${
                  h === currentHour 
                  ? 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.3)]' 
                  : 'border-white/5 text-slate-600 hover:text-cyan-400 bg-white/5'
                }`}
              >
                <span className="text-xs font-black">{h.toString().padStart(2, '0')}</span>
                <span className="text-[7px] uppercase opacity-40">H</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="p-4 md:p-8 flex-grow">
        {activeTab === 'tracker' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-4 bg-cyan-500"></span> Timeline
              </h2>
              <button onClick={() => confirm('Clear all?') && setSlots(generateEmptySlots())} className="text-[9px] text-slate-600 hover:text-red-500 uppercase font-bold">Reset</button>
            </div>
            <div className="grid gap-3">
              {slots.map(slot => (
                <div key={slot.id} id={`slot-${slot.id}`}>
                  <TimeSlotCard slot={slot} onUpdate={handleUpdateSlot} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-in zoom-in-95 duration-300">
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
              <span className="w-1 h-4 bg-fuchsia-500"></span> Analytics
            </h2>
            <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5">
              {chartData.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={chartData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                        {chartData.map((_, i) => <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} stroke="none" />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#020617', border: 'none', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-600 font-bold uppercase text-xs tracking-widest">No data logged</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'advice' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-500"></span> AI Insights
            </h2>
            <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-cyan-500/20 shadow-2xl">
              {advice ? (
                <div className="text-slate-300 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: formatMarkdown(advice) }} />
              ) : (
                <p className="text-slate-600 text-center py-10 uppercase text-[10px] font-bold tracking-widest">Log activities to get insights</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex justify-around z-50 shadow-2xl">
        {[
          { id: 'tracker', label: 'LOG', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'stats', label: 'DATA', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2' },
          { id: 'advice', label: 'AI', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)}
            className={`flex flex-col items-center py-2 px-6 rounded-xl transition-all ${activeTab === t.id ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-600'}`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d={t.icon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[8px] font-black">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
