// Auth & User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'child';
  profilePicture?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

// Family & Child Types
export interface Family {
  id: string;
  familyName: string;
  parent: string;
  children: Child[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  avatar?: string;
  family: string;
  parent: string;
  isActive: boolean;
  readingLevel?: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  updatedAt: string;
}

// Story Types
export interface Story {
  id: string;
  title: string;
  author: string;
  description: string;
  ageGroup: 'toddler' | 'early-reader' | 'middle-grade' | 'young-adult';
  genres: string[];
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  coverImage: string;
  pageCount: number;
  source: 'internal' | 'google';
  googleBookId?: string;
  previewLink?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Reading Session Types
export interface ReadingSession {
  id: string;
  childId: string;
  storyId: string;
  pagesRead: number;
  totalPages: number;
  timeSpent: number; // in minutes
  completed: boolean;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Assignment Types
export interface Assignment {
  id: string;
  childId: string;
  storyId: string;
  assignedBy: string;
  familyId: string;
  status: 'assigned' | 'in_progress' | 'completed';
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Types
export interface DashboardStats {
  totalReadingTime: number;
  storiesRead: number;
  currentStreak: number;
  assignmentsCompleted: number;
  averageReadingTimePerDay: number;
}

export interface ChildDashboard {
  child: Child;
  stats: DashboardStats;
  upcomingAssignments: Assignment[];
  recentReadingSessions: ReadingSession[];
}

export interface FamilyDashboard {
  family: Family;
  children: ChildDashboard[];
  totalFamilyReadingTime: number;
  familyStats: DashboardStats;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// UI State Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ModalState {
  isOpen: boolean;
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}
