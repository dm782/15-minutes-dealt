
import { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  'Работа': 'border-cyan-500 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
  'Отдых': 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10 shadow-[0_0_10px_rgba(217,70,239,0.3)]',
  'Спорт': 'border-lime-500 text-lime-400 bg-lime-500/10 shadow-[0_0_10px_rgba(132,204,22,0.3)]',
  'Еда': 'border-orange-500 text-orange-400 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
  'Обучение': 'border-violet-500 text-violet-400 bg-violet-500/10 shadow-[0_0_10px_rgba(139,92,246,0.3)]',
  'Прочее': 'border-slate-500 text-slate-400 bg-slate-500/10 shadow-[0_0_10px_rgba(100,116,139,0.3)]',
  'Сон': 'border-blue-600 text-blue-400 bg-blue-600/10 shadow-[0_0_10px_rgba(37,99,235,0.3)]',
};

export const CATEGORIES: Category[] = ['Работа', 'Отдых', 'Спорт', 'Еда', 'Обучение', 'Сон', 'Прочее'];
