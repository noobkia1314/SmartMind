
// Application type definitions

export enum RecordType {
  DIET = 'DIET',
  EXERCISE = 'EXERCISE',
  READING = 'READING',
  FINANCE = 'FINANCE',
  TASK = 'TASK'
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  feedback?: string;
  category: string;
  date: string;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  date: string;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  duration: number;
  caloriesBurned: number;
  date: string;
}

export interface ReadingHistory {
  date: string;
  pagesRead: number;
  summary: string;
}

export interface ReadingEntry {
  id: string;
  title: string;
  totalPages: number;
  currentPages: number;
  history: ReadingHistory[];
  predictedFinishDate?: string;
}

export interface FinanceEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export interface UserGoal {
  id: string;
  title: string;
  description: string;
  startDate: string;
  mindMap?: MindMapNode;
  tasks: Task[];
  foodLogs: FoodEntry[];
  exerciseLogs: ExerciseEntry[];
  readingLogs: ReadingEntry[];
  financeLogs: FinanceEntry[];
}

export interface UserProfile {
  name: string;
  isLoggedIn: boolean;
  provider: 'google' | 'anonymous' | null;
}

export interface AppState {
  user: UserProfile;
  goals: UserGoal[];
  activeGoalId: string | null;
}
