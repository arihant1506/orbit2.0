
import { WeekSchedule, ScheduleSlot, Category, UniversitySchedule } from './types';

// Helper to create IDs
const mkId = (day: string, idx: number) => `${day}-${idx}`;

// --- BLANK TEMPLATES FOR NEW USERS ---
export const BLANK_SCHEDULE: WeekSchedule = {
  Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
};

export const BLANK_UNI_SCHEDULE: UniversitySchedule = {
  Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
};

// --- OWNER (ARIHANT) UNIVERSITY SCHEDULE DATA ---
export const UNI_SCHEDULE: UniversitySchedule = {
  Monday: [
    { id: 'm-c1', subject: 'Science of Happiness', type: 'Lecture', professor: 'Dr. Badri Bajaj', venue: 'FF8', batch: 'A1-8, A10, A15-18, C1-3, G1-2', startTime: '10:00 AM', endTime: '10:50 AM' },
    { id: 'm-c2', subject: 'Telecommunication Networks', type: 'Lecture', professor: 'Dr Radha Raman Pandey', venue: 'FF7', batch: 'A5, A6', startTime: '11:00 AM', endTime: '11:50 AM' },
    { id: 'm-c3', subject: 'Information Theory and Applications', type: 'Lecture', professor: 'Simmi Sharma', venue: 'FF5', batch: 'A1-10, A15-18', startTime: '12:00 PM', endTime: '12:50 PM' },
    { id: 'm-c4', subject: 'Analog and Digital Communication', type: 'Lecture', professor: 'Vishal Narain Saxena', venue: 'FF5', batch: 'A5, A6', startTime: '03:00 PM', endTime: '03:50 PM' }
  ],
  Tuesday: [
    { id: 't-c1', subject: 'Digital Signal Processing', type: 'Lecture', professor: 'Joysmita', venue: 'FF6', batch: 'A5, A6', startTime: '09:00 AM', endTime: '09:50 AM' },
    { id: 't-c2', subject: 'Analog and Digital Communication', type: 'Lecture', professor: 'Vishal Narain Saxena', venue: 'FF8', batch: 'A5, A6', startTime: '10:00 AM', endTime: '10:50 AM' },
    { id: 't-c3', subject: 'Information Theory and Applications', type: 'Lecture', professor: 'Simmi Sharma', venue: 'FF5', batch: 'A1-10, A15-18', startTime: '12:00 PM', endTime: '12:50 PM' },
    { id: 't-c4', subject: 'Science of Happiness', type: 'Lecture', professor: 'Dr. Badri Bajaj', venue: 'G9', batch: 'A1-8, A10, A15-18, C1-3, G1-2', startTime: '02:00 PM', endTime: '02:50 PM' },
    { id: 't-c5', subject: 'Analog and Digital Communication', type: 'Tutorial', professor: 'Vishal Narain Saxena', venue: 'TS17', batch: 'A5', startTime: '03:00 PM', endTime: '03:50 PM' },
    { id: 't-c6', subject: 'Digital Signal Processing', type: 'Tutorial', professor: 'Jyoti Mishra', venue: 'TS17', batch: 'A5', startTime: '04:00 PM', endTime: '04:50 PM' }
  ],
  Wednesday: [
    { id: 'w-c1', subject: 'Digital Signal Processing', type: 'Lecture', professor: 'Joysmita', venue: 'FF7', batch: 'A5, A6', startTime: '10:00 AM', endTime: '10:50 AM' },
    { id: 'w-c2', subject: 'Analogue Electronics', type: 'Lecture', professor: 'Dr Hemant Kumar', venue: 'FF5', batch: 'A5, A6', startTime: '12:00 PM', endTime: '12:50 PM' },
    { id: 'w-c3', subject: 'Science of Happiness', type: 'Tutorial', professor: 'Dr. Badri Bajaj', venue: 'TS13', batch: 'A1-8, G1-2', startTime: '02:00 PM', endTime: '02:50 PM' },
    { id: 'w-c4', subject: '15B11EC471', type: 'Lab', professor: 'Dr. Rituraj, Astha Sharma', venue: 'EDC', batch: 'A5', startTime: '03:00 PM', endTime: '04:50 PM' }
  ],
  Thursday: [
    { id: 'th-c1', subject: '15B17EC473', type: 'Lab', professor: 'Dr. Vijay Khare, TA 3', venue: 'SPL', batch: 'A5', startTime: '11:00 AM', endTime: '12:50 PM' },
    { id: 'th-c2', subject: 'Analog Electronics', type: 'Tutorial', professor: 'Dr. Hemant Kumar', venue: 'TS16', batch: 'A5', startTime: '03:00 PM', endTime: '04:00 PM' }
  ],
  Friday: [
    { id: 'f-c1', subject: 'Analog and Digital Communication', type: 'Lecture', professor: 'Vishal Narain Saxena', venue: 'FF7', batch: 'A5, A6', startTime: '09:00 AM', endTime: '09:50 AM' },
    { id: 'f-c2', subject: 'Telecommunication Networks', type: 'Lecture', professor: 'Dr Radha Raman Pandey', venue: 'G4', batch: 'A5, A6', startTime: '10:00 AM', endTime: '10:50 AM' },
    { id: 'f-c3', subject: 'Analogue Electronics', type: 'Lecture', professor: 'Dr Hemant Kumar', venue: 'FF5', batch: 'A5, A6', startTime: '12:00 PM', endTime: '12:50 PM' },
    { id: 'f-c4', subject: '18B15EC212', type: 'Lab', professor: 'Dr. Reema Buddhiraja, Dr. Smriti Kalia', venue: 'ADC', batch: 'A5', startTime: '03:00 PM', endTime: '04:50 PM' }
  ],
  Saturday: [
    { id: 's-c1', subject: 'Information Theory and Applications', type: 'Lecture', professor: 'Simmi Sharma', venue: 'FF6', batch: 'A1-10, A15-18', startTime: '09:00 AM', endTime: '09:50 AM' },
    { id: 's-c2', subject: 'Digital Signal Processing', type: 'Lecture', professor: 'Joysmita', venue: 'FF5', batch: 'A5, A6', startTime: '10:00 AM', endTime: '10:50 AM' },
    { id: 's-c3', subject: 'Telecommunication Networks', type: 'Lecture', professor: 'Dr Radha Raman Pandey', venue: 'FF5', batch: 'A5, A6', startTime: '11:00 AM', endTime: '11:50 AM' },
    { id: 's-c4', subject: 'Analogue Electronics', type: 'Lecture', professor: 'Dr Hemant Kumar', venue: 'FF6', batch: 'A5, A6', startTime: '12:00 PM', endTime: '12:50 PM' }
  ],
  Sunday: []
};


// --- OWNER (ARIHANT) ROUTINE SCHEDULE DATA ---

const MONDAY: ScheduleSlot[] = [
  { id: mkId('Mon', 1), timeRange: '07:30 AM - 07:35 AM', title: 'Wake Up & Hydrate', category: 'Physical', description: 'Momentum & Activation (Phase 1)', notes: 'Do not snooze.', isCompleted: false },
  { id: mkId('Mon', 2), timeRange: '07:35 AM - 08:05 AM', title: 'Warmup', category: 'Physical', description: '30 mins activation', isCompleted: false },
  { id: mkId('Mon', 3), timeRange: '08:05 AM - 09:05 AM', title: 'Gym Session', category: 'Physical', description: '1 hr solid session', isCompleted: false },
  { id: mkId('Mon', 4), timeRange: '09:05 AM - 09:40 AM', title: 'Get Ready', category: 'Logistics', description: 'Shower & Dressing', notes: 'Outfit laid out night before.', isCompleted: false },
  { id: mkId('Mon', 5), timeRange: '09:40 AM - 10:00 AM', title: 'Breakfast', category: 'Physical', description: 'High protein intake', isCompleted: false },
  { id: mkId('Mon', 6), timeRange: '10:00 AM - 01:00 PM', title: 'Class / Lectures', category: 'Academic', description: 'Absorption & Attendance (Phase 2)', isCompleted: false },
  { id: mkId('Mon', 7), timeRange: '01:00 PM - 02:00 PM', title: 'Lunch Break', category: 'Rest', isCompleted: false },
  { id: mkId('Mon', 8), timeRange: '02:00 PM - 03:00 PM', title: 'Secret Weapon Hour', category: 'Academic', description: 'Class Break / Revision', notes: 'Do NOT waste this hour.', isCompleted: false },
  { id: mkId('Mon', 9), timeRange: '03:00 PM - 04:00 PM', title: 'Class / Lectures', category: 'Academic', isCompleted: false },
  { id: mkId('Mon', 10), timeRange: '04:00 PM - 06:00 PM', title: 'Post-Class Break', category: 'Rest', description: 'Decompression (Phase 3)', notes: 'Nap, socialize, walk. Disconnect.', isCompleted: false },
  { id: mkId('Mon', 11), timeRange: '06:00 PM - 07:30 PM', title: 'Study Session', category: 'Academic', description: 'Deep Work Grind (Phase 4)', notes: 'Tackle hardest subjects.', isCompleted: false },
  { id: mkId('Mon', 12), timeRange: '07:30 PM - 08:30 PM', title: 'Coding', category: 'Coding', description: 'Logic and syntax practice', isCompleted: false },
  { id: mkId('Mon', 13), timeRange: '08:30 PM - 09:45 PM', title: 'Dinner & Relaxation', category: 'Rest', description: '75 mins to protect sleep', isCompleted: false },
  { id: mkId('Mon', 14), timeRange: '09:45 PM - 10:45 PM', title: 'Editing Work', category: 'Creative', description: 'Creative flow-state', isCompleted: false },
  { id: mkId('Mon', 15), timeRange: '10:45 PM - 12:30 AM', title: 'NETFLIX & CHILL', category: 'Rest', isCompleted: false },
];

const TUESDAY: ScheduleSlot[] = [
  { id: mkId('Tue', 1), timeRange: '07:30 AM - 08:40 AM', title: 'Wake Up & Get Ready', category: 'Logistics', description: 'Hygiene & Bag Prep', isCompleted: false },
  { id: mkId('Tue', 2), timeRange: '08:40 AM - 09:00 AM', title: 'Breakfast', category: 'Physical', isCompleted: false },
  { id: mkId('Tue', 3), timeRange: '09:00 AM - 11:00 AM', title: 'Academic Block I', category: 'Academic', isCompleted: false },
  { id: mkId('Tue', 4), timeRange: '11:00 AM - 12:00 PM', title: 'Coding Session', category: 'Coding', description: 'High energy logic block', isCompleted: false },
  { id: mkId('Tue', 5), timeRange: '12:00 PM - 01:00 PM', title: 'Class', category: 'Academic', isCompleted: false },
  { id: mkId('Tue', 6), timeRange: '01:00 PM - 02:00 PM', title: 'Lunch', category: 'Rest', isCompleted: false },
  { id: mkId('Tue', 7), timeRange: '02:00 PM - 05:00 PM', title: 'Academic Block II', category: 'Academic', isCompleted: false },
  { id: mkId('Tue', 8), timeRange: '05:00 PM - 07:00 PM', title: 'Freshness Break', category: 'Rest', description: 'Relax, nap, decompress', isCompleted: false },
  { id: mkId('Tue', 9), timeRange: '07:00 PM - 09:00 PM', title: 'Study Session', category: 'Academic', description: 'Academic review', isCompleted: false },
  { id: mkId('Tue', 10), timeRange: '09:00 PM - 10:00 PM', title: 'Dinner', category: 'Rest', isCompleted: false },
  { id: mkId('Tue', 11), timeRange: '10:00 PM - 11:30 PM', title: 'Edit Work', category: 'Creative', description: 'Creative Block', isCompleted: false },
  { id: mkId('Tue', 12), timeRange: '11:30 PM - 12:30 AM', title: 'NETFLIX & CHILL', category: 'Rest', isCompleted: false },
  { id: mkId('Tue', 13), timeRange: '12:30 AM', title: 'Sleep', category: 'Physical', notes: 'Critical for recovery.', isCompleted: false },
];

const WEDNESDAY: ScheduleSlot[] = [
  { id: mkId('Wed', 1), timeRange: '07:30 AM - 07:40 AM', title: 'Wake Up & Quick Warmup', category: 'Physical', description: 'Speed Run Morning', notes: '10 mins dynamic stretches', isCompleted: false },
  { id: mkId('Wed', 2), timeRange: '07:40 AM - 08:40 AM', title: 'Gym Session', category: 'Physical', description: 'Solid 1 hour', isCompleted: false },
  { id: mkId('Wed', 3), timeRange: '08:40 AM - 09:00 AM', title: 'Breakfast', category: 'Physical', notes: 'Mess closes at 9:00!', isCompleted: false },
  { id: mkId('Wed', 4), timeRange: '09:00 AM - 09:40 AM', title: 'Get Ready', category: 'Logistics', description: 'Shower, dress, pack', isCompleted: false },
  { id: mkId('Wed', 5), timeRange: '09:40 AM - 10:00 AM', title: 'Commute / Buffer', category: 'Logistics', isCompleted: false },
  { id: mkId('Wed', 6), timeRange: '10:00 AM - 11:00 AM', title: 'Class', category: 'Academic', isCompleted: false },
  { id: mkId('Wed', 7), timeRange: '11:00 AM - 12:00 PM', title: 'The Coding Hour', category: 'Coding', description: 'Frees up the night', isCompleted: false },
  { id: mkId('Wed', 8), timeRange: '12:00 PM - 01:00 PM', title: 'Class', category: 'Academic', isCompleted: false },
  { id: mkId('Wed', 9), timeRange: '01:00 PM - 02:00 PM', title: 'Lunch', category: 'Rest', isCompleted: false },
  { id: mkId('Wed', 10), timeRange: '02:00 PM - 05:00 PM', title: 'Class', category: 'Academic', isCompleted: false },
  { id: mkId('Wed', 11), timeRange: '05:00 PM - 07:00 PM', title: 'Freshness Break', category: 'Rest', description: 'Sleep, shower, or Netflix', isCompleted: false },
  { id: mkId('Wed', 12), timeRange: '07:00 PM - 08:30 PM', title: 'Study Session', category: 'Academic', description: 'Primary focus time', isCompleted: false },
  { id: mkId('Wed', 13), timeRange: '08:30 PM - 10:00 PM', title: 'Dinner & Chill', category: 'Rest', isCompleted: false },
  { id: mkId('Wed', 14), timeRange: '10:00 PM - 11:00 PM', title: 'Editing', category: 'Creative', description: 'Color grading or cuts', isCompleted: false },
  { id: mkId('Wed', 15), timeRange: '11:00 PM - 01:00 AM', title: 'Netflix & Chill', category: 'Rest', description: 'Wind down', isCompleted: false },
  { id: mkId('Wed', 16), timeRange: '01:00 AM', title: 'Sleep', category: 'Physical', isCompleted: false },
];

const THURSDAY: ScheduleSlot[] = [
  { id: mkId('Thu', 1), timeRange: '08:00 AM - 08:30 AM', title: 'Morning Routine', category: 'Logistics', isCompleted: false },
  { id: mkId('Thu', 2), timeRange: '08:30 AM - 09:30 AM', title: 'Study Session', category: 'Academic', isCompleted: false },
  { id: mkId('Thu', 3), timeRange: '09:30 AM - 10:30 AM', title: 'Get Ready', category: 'Logistics', description: 'Shower & Groom', isCompleted: false },
  { id: mkId('Thu', 4), timeRange: '10:30 AM - 11:00 AM', title: 'Buffer / Breakfast', category: 'Logistics', isCompleted: false },
  { id: mkId('Thu', 5), timeRange: '11:00 AM - 01:00 PM', title: 'Class (Fixed)', category: 'Academic', isCompleted: false },
  { id: mkId('Thu', 6), timeRange: '01:00 PM - 02:00 PM', title: 'Lunch', category: 'Rest', isCompleted: false },
  { id: mkId('Thu', 7), timeRange: '02:00 PM - 03:00 PM', title: 'Freshness Break', category: 'Rest', description: 'Mental recovery', isCompleted: false },
  { id: mkId('Thu', 8), timeRange: '03:00 PM - 04:00 PM', title: 'Class (Fixed)', category: 'Academic', isCompleted: false },
  { id: mkId('Thu', 9), timeRange: '04:00 PM - 05:30 PM', title: 'REST Block', category: 'Rest', isCompleted: false },
  { id: mkId('Thu', 10), timeRange: '05:30 PM - 06:30 PM', title: 'Gym Session', category: 'Physical', description: 'Productivity Sprint', isCompleted: false },
  { id: mkId('Thu', 11), timeRange: '07:00 PM - 08:00 PM', title: 'Coding', category: 'Coding', description: 'Logic & Syntax', isCompleted: false },
  { id: mkId('Thu', 12), timeRange: '08:00 PM - 09:00 PM', title: 'Edit Work', category: 'Creative', isCompleted: false },
  { id: mkId('Thu', 13), timeRange: '09:00 PM - 10:00 PM', title: 'Dinner', category: 'Rest', isCompleted: false },
  { id: mkId('Thu', 14), timeRange: '10:00 PM - 12:30 AM', title: 'Netflix & Chill', category: 'Rest', isCompleted: false },
  { id: mkId('Thu', 15), timeRange: '12:30 AM', title: 'Sleep', category: 'Physical', isCompleted: false },
];

const FRIDAY: ScheduleSlot[] = [
  { id: mkId('Fri', 1), timeRange: '07:30 AM - 08:40 AM', title: 'Wake Up & Get Ready', category: 'Logistics', description: 'Physical Prime', isCompleted: false },
  { id: mkId('Fri', 2), timeRange: '08:40 AM - 09:00 AM', title: 'Breakfast', category: 'Physical', isCompleted: false },
  { id: mkId('Fri', 3), timeRange: '09:00 AM - 11:00 AM', title: 'Class Block 1', category: 'Academic', isCompleted: false },
  { id: mkId('Fri', 4), timeRange: '11:00 AM - 12:00 PM', title: 'Coding Hour', category: 'Coding', description: 'Gap Productivity', isCompleted: false },
  { id: mkId('Fri', 5), timeRange: '12:00 PM - 01:00 PM', title: 'Class Block 2', category: 'Academic', isCompleted: false },
  { id: mkId('Fri', 6), timeRange: '01:00 PM - 02:00 PM', title: 'Lunch', category: 'Rest', isCompleted: false },
  { id: mkId('Fri', 7), timeRange: '02:00 PM - 03:00 PM', title: 'Break', category: 'Rest', isCompleted: false },
  { id: mkId('Fri', 8), timeRange: '03:00 PM - 05:00 PM', title: 'Class Block 3', category: 'Academic', isCompleted: false },
  { id: mkId('Fri', 9), timeRange: '05:00 PM - 07:00 PM', title: 'Freshness Break', category: 'Rest', description: 'Nap, walk, no work', isCompleted: false },
  { id: mkId('Fri', 10), timeRange: '07:00 PM - 08:30 PM', title: 'Study Session', category: 'Academic', isCompleted: false },
  { id: mkId('Fri', 11), timeRange: '08:30 PM - 09:30 PM', title: 'Dinner & Relax', category: 'Rest', isCompleted: false },
  { id: mkId('Fri', 12), timeRange: '09:30 PM - 12:30 AM', title: 'Netflix & Chill', category: 'Rest', description: 'Rewards', isCompleted: false },
];

const SATURDAY: ScheduleSlot[] = [
  { id: mkId('Sat', 1), timeRange: '07:30 AM - 08:00 AM', title: 'Wake Up & Hydrate', category: 'Physical', isCompleted: false },
  { id: mkId('Sat', 2), timeRange: '08:00 AM - 08:30 AM', title: 'Get Ready', category: 'Logistics', description: 'Shower + Dress', isCompleted: false },
  { id: mkId('Sat', 3), timeRange: '08:30 AM - 09:00 AM', title: 'Breakfast', category: 'Physical', notes: 'Finish by 9:00', isCompleted: false },
  { id: mkId('Sat', 4), timeRange: '09:00 AM - 01:00 PM', title: 'Class', category: 'Academic', isCompleted: false },
  { id: mkId('Sat', 5), timeRange: '01:00 PM - 02:00 PM', title: 'Lunch', category: 'Rest', isCompleted: false },
  { id: mkId('Sat', 6), timeRange: '02:00 PM - 03:30 PM', title: 'Post-Class Break', category: 'Rest', description: 'Reset from class', isCompleted: false },
  { id: mkId('Sat', 7), timeRange: '03:30 PM - 04:00 PM', title: 'Warmup / Pre-workout', category: 'Physical', isCompleted: false },
  { id: mkId('Sat', 8), timeRange: '04:00 PM - 05:00 PM', title: 'Gym Session', category: 'Physical', isCompleted: false },
  { id: mkId('Sat', 9), timeRange: '05:00 PM - 05:30 PM', title: 'Shower & Snack', category: 'Physical', isCompleted: false },
  { id: mkId('Sat', 10), timeRange: '05:30 PM - 07:30 PM', title: 'Deep Study', category: 'Academic', description: 'High-focus professional block', isCompleted: false },
  { id: mkId('Sat', 11), timeRange: '07:30 PM - 08:30 PM', title: 'Edit Work', category: 'Creative', isCompleted: false },
  { id: mkId('Sat', 12), timeRange: '08:30 PM - 09:00 PM', title: 'File Making', category: 'Creative', description: 'Sprint session', isCompleted: false },
  { id: mkId('Sat', 13), timeRange: '09:00 PM - 10:00 PM', title: 'Dinner + Netflix', category: 'Rest', isCompleted: false },
  { id: mkId('Sat', 14), timeRange: '10:00 PM - 11:00 PM', title: 'Coding', category: 'Coding', isCompleted: false },
  { id: mkId('Sat', 15), timeRange: '11:00 PM - 12:00 AM', title: 'Final Edit / Files', category: 'Creative', isCompleted: false },
  { id: mkId('Sat', 16), timeRange: '12:00 AM', title: 'Free Time', category: 'Rest', isCompleted: false },
];

const SUNDAY: ScheduleSlot[] = [
  { id: mkId('Sun', 1), timeRange: 'All Day', title: 'App Work & Certificates', category: 'Coding', description: 'Chill & Relax', isCompleted: false }
];

export const INITIAL_SCHEDULE: WeekSchedule = {
  Monday: MONDAY,
  Tuesday: TUESDAY,
  Wednesday: WEDNESDAY,
  Thursday: THURSDAY,
  Friday: FRIDAY,
  Saturday: SATURDAY,
  Sunday: SUNDAY
};

// Cyberpunk Neon Palette
export const CATEGORY_COLORS: Record<Category, string> = {
  Physical: 'border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
  Academic: 'border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]',
  Coding: 'border-green-400 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]',
  Creative: 'border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  Rest: 'border-pink-500 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]',
  Logistics: 'border-slate-500 text-slate-300',
};

export const CATEGORY_BG: Record<Category, string> = {
  Physical: 'bg-orange-900/20 hover:bg-orange-900/30',
  Academic: 'bg-cyan-900/20 hover:bg-cyan-900/30',
  Coding: 'bg-green-900/20 hover:bg-green-900/30',
  Creative: 'bg-purple-900/20 hover:bg-purple-900/30',
  Rest: 'bg-pink-900/20 hover:bg-pink-900/30',
  Logistics: 'bg-slate-800/40 hover:bg-slate-800/50',
};
