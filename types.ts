export type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type Category = 'Physical' | 'Academic' | 'Coding' | 'Creative' | 'Rest' | 'Logistics';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ScheduleSlot {
  id: string;
  timeRange: string;
  title: string;
  description?: string;
  category: Category;
  isCompleted: boolean;
  notes?: string;
}

export interface WeekSchedule {
  [key: string]: ScheduleSlot[];
}

export interface WeeklyStats {
  completed: number;
  total: number;
  percentage: number;
  dateRange: string;
}

export interface UserProfile {
  username: string;
  password?: string;
  joinedDate: string;
  schedule: WeekSchedule;
  lastResetDate?: string; // ISO string of the Monday of the last reset week
  lastWeekStats?: WeeklyStats;
}

export interface AuthState {
  currentUser: string | null;
  users: Record<string, UserProfile>;
}