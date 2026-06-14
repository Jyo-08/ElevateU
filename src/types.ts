export interface StudentProfile {
  userId: string;
  displayName: string;
  cgpa: number;
  prevCgpa?: number;
  cgpaHistory?: { semester: string; cgpa: number; credits?: number }[];
  backlogs: number;
  attendance: number;
  studyHours: number;
  confidenceLevel: number; // 1-10
  xp: number;
  streak: number;
  subjects: string; // Packed comma-separated subjects
  goal?: string; // e.g. "Placement", "GATE", "9+ CGPA", etc.
  targetCgpa?: number; // Target/Aim CGPA
  careerGoal?: string; // Career Goal
  createdAt?: any;
  updatedAt?: any;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  stressLevel: number; // 1-10
  analysis: {
    stressIndex: number;
    confidenceBoost: string;
    motivationLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    actionableTips: string[];
  };
  createdAt: string; // Date string
  updatedAt?: string;
}

export interface RecoveryPlan {
  userId: string;
  planText: string;
  dailyTasks: { title: string; category: string; xpReward: number }[];
  weeklyTasks: { title: string; category: string; xpReward: number }[];
  updatedAt: string;
}

export interface AcademicTask {
  id: string;
  userId: string;
  title: string;
  category: 'attendance' | 'backlog' | 'exam' | 'assignment' | 'habit';
  done: boolean;
  xpReward: number;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
