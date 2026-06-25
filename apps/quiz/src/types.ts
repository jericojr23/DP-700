export type Difficulty = 'Foundation' | 'Intermediate' | 'Advanced';
export type QuestionStatus = 'Draft' | 'Verified';

export interface Choice {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  title: string;
  domain: string;
  topic: string;
  difficulty: Difficulty;
  questionType: string;
  source: {
    title: string;
    url: string;
  };
  lastVerified: string;
  status: QuestionStatus;
  prompt: string;
  choices: Choice[];
}

export interface DomainCoverage {
  domain: string;
  Foundation: number;
  Intermediate: number;
  Advanced: number;
  total: number;
}

export interface QuestionBank {
  questions: Question[];
  coverage: {
    domains: DomainCoverage[];
    total: number;
  };
}

export interface ProgressEntry {
  questionId: string;
  attempts: number;
  correct: number;
  accuracy: number;
  lastResult: 'correct' | 'incorrect' | null;
  lastAnswer: string | null;
  lastAttemptedAt: string | null;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  consecutiveCorrect: number;
  lapses: number;
  status: 'New' | 'Due' | 'Learning' | 'Scheduled' | 'Mature';
  isDue: boolean;
}

export interface ProgressSummary {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  attemptedQuestions: number;
  dueNow: number;
  scheduled: number;
  mature: number;
}

export interface ProgressResponse {
  entries: Record<string, ProgressEntry>;
  summary: ProgressSummary;
}

export interface AnswerReview {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  correctAnswer: string;
  correctAnswerText: string;
  explanation: string;
  reasons: Record<string, string>;
  progress: ProgressEntry;
  summary: ProgressSummary;
}

export interface SessionResult {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  timedOut: boolean;
  dueAt?: string;
}
