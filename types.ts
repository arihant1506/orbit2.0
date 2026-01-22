
export type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type Category = 'Physical' | 'Academic' | 'Coding' | 'Creative' | 'Rest' | 'Logistics';

export type ThemeMode = 'dark' | 'light' | 'system';

export type ClassType = 'Lecture' | 'Lab' | 'Tutorial';

export interface ScheduleSlot {
  id: string;
  timeRange: string;
  title: string;
  description?: string;
  category: Category;
  isCompleted: boolean;
  notes?: string;
}

export interface ClassSession {
  id: string;
  subject: string;
  type: ClassType;
  professor: string;
  venue: string;
  batch: string;
  startTime: string; // Format: "HH:MM AM/PM"
  endTime: string;   // Format: "HH:MM AM/PM"
}

export interface WeekSchedule {
  [key: string]: ScheduleSlot[];
}

export interface UniversitySchedule {
  [key: string]: ClassSession[];
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
  academicSchedule: UniversitySchedule; // Added this field
  lastResetDate?: string; 
  lastWeekStats?: WeeklyStats;
  waterConfig?: WaterConfig;
}

export interface AuthState {
  currentUser: string | null;
  users: Record<string, UserProfile>;
}

export interface WaterConfig {
  dailyGoal: number; // Liters (5-10)
  adaptiveMode: boolean;
  lastDate: string; // To reset daily
  progress: string[]; // Array of completed time slot IDs
}

export interface OrbitNotification {
  id: string;
  type: 'task' | 'class' | 'water';
  title: string;
  subtitle: string;
  startTimeStr: string; // "10:00 AM"
  minutesUntil: number; // For sorting/priority
  progress: number; // 0 to 100 (How close to starting)
  accentColor: string;
}
