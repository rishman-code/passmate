export interface Question {
  id: string;
  category: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  image_url?: string;
}

export interface UserProgress {
  question_id: string;
  answered_correctly: boolean;
  answered_at: string;
  attempt_count: number;
}

export interface CategoryScore {
  category: string;
  total_questions: number;
  correct_answers: number;
  accuracy_percentage: number;
}

export interface AIExplanationCache {
  question_id: string;
  wrong_answer: string;
  ai_explanation: string;
  created_at: string;
}

export interface MockTestResult {
  id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  completed_at: string;
  time_taken_seconds: number;
}

export type AnswerOption = Question['correct_answer'];
