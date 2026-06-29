import { create } from 'zustand';

import type { AnswerOption, Question } from '@/types/database';

interface PracticeState {
  questions: Question[];
  currentIndex: number;
  selectedAnswer: AnswerOption | null;
  showResult: boolean;
  correctCount: number;
  categoryFilter: string | null;
  isLoading: boolean;
  setQuestions: (questions: Question[]) => void;
  setCategoryFilter: (category: string | null) => void;
  selectAnswer: (answer: AnswerOption) => void;
  nextQuestion: () => void;
  reset: () => void;
  getCurrentQuestion: () => Question | null;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  selectedAnswer: null,
  showResult: false,
  correctCount: 0,
  categoryFilter: null,
  isLoading: false,

  setQuestions: (questions) =>
    set({
      questions,
      currentIndex: 0,
      selectedAnswer: null,
      showResult: false,
      correctCount: 0,
      isLoading: false,
    }),

  setCategoryFilter: (category) => set({ categoryFilter: category }),

  selectAnswer: (answer) => {
    const { questions, currentIndex, showResult } = get();
    if (showResult) {
      return;
    }

    const question = questions[currentIndex];
    const isCorrect = question.correct_answer === answer;

    set({
      selectedAnswer: answer,
      showResult: true,
      correctCount: get().correctCount + (isCorrect ? 1 : 0),
    });
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex >= questions.length - 1) {
      return;
    }

    set({
      currentIndex: currentIndex + 1,
      selectedAnswer: null,
      showResult: false,
    });
  },

  reset: () =>
    set({
      questions: [],
      currentIndex: 0,
      selectedAnswer: null,
      showResult: false,
      correctCount: 0,
      categoryFilter: null,
      isLoading: false,
    }),

  getCurrentQuestion: () => {
    const { questions, currentIndex } = get();
    return questions[currentIndex] ?? null;
  },
}));
