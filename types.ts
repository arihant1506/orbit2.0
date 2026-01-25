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

export interface UserPreferences {
  theme: ThemeMode;
  startOfWeek: 'Monday' | 'Sunday';
  timeFormat: '12h' | '24h';
  notifications: {
    dailyReminder: boolean;
    taskAlerts: boolean;
  };
}

export interface UserProfile {
  username: string;
  password?: string;
  email?: string;       // New: For profile identity
  avatar?: string;      // New: Profile picture URL/Base64
  joinedDate: string;
  schedule: WeekSchedule;
  academicSchedule: UniversitySchedule; 
  lastResetDate?: string; 
  lastWeekStats?: WeeklyStats;
  waterConfig?: WaterConfig;
  preferences?: UserPreferences; // New: Local settings
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