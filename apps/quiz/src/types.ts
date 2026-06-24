export type Difficulty = 'Foundation' | 'Intermediate' | 'Advanced';
export type QuestionStatus = 'Draft' | 'Verified';
export type Confidence = 'Low' | 'Medium' | 'High' | 'Not recorded';

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
  correctAnswer: string;
  correctAnswerText: string;
  explanation: string;
  reasons: Record<string, string>;
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
  attempts: number;
  correct: number;
  lastResult: 'correct' | 'incorrect';
  lastConfidence: Confidence;
  lastAttemptedAt: string;
}

export interface SessionResult {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  confidence: Confidence;
}
