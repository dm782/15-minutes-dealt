
export type Category = 'Работа' | 'Отдых' | 'Спорт' | 'Еда' | 'Обучение' | 'Прочее' | 'Сон';

export interface TimeSlot {
  id: string;
  time: string;
  activity: string;
  category: Category;
}

export interface DayStats {
  date: string;
  slots: TimeSlot[];
}

export interface AdviceItem {
  title: string;
  content: string;
}
