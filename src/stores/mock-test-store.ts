import { create } from 'zustand';

import {
  MOCK_TEST_DURATION_SECONDS,
  MOCK_TEST_PASS_SCORE,
  MOCK_TEST_QUESTION_COUNT,
} from '@/constants/categories';
import type { AnswerOption, Question } from '@/types/database';

interface MockAnswer {
  questionId: string;
  selected: AnswerOption;
  correct: boolean;
}

interface MockTestState {
  questions: Question[];
  currentIndex: number;
  answers: MockAnswer[];
  selectedAnswer: AnswerOption | null;
  startedAt: number | null;
  timeRemaining: number;
  isActive: boolean;
  isComplete: boolean;
  setQuestions: (questions: Question[]) => void;
  startTest: () => void;
  selectAnswer: (answer: AnswerOption) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  tick: () => void;
  finishTest: () => void;
  reset: () => void;
  getScore: () => number;
  getPassed: () => boolean;
  getCurrentQuestion: () => Question | null;
  getTimeTaken: () => number;
}

export const useMockTestStore = create<MockTestState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: [],
  selectedAnswer: null,
  startedAt: null,
  timeRemaining: MOCK_TEST_DURATION_SECONDS,
  isActive: false,
  isComplete: false,

  setQuestions: (questions) =>
    set({
      questions: questions.slice(0, MOCK_TEST_QUESTION_COUNT),
      currentIndex: 0,
      answers: [],
      selectedAnswer: null,
      startedAt: null,
      timeRemaining: MOCK_TEST_DURATION_SECONDS,
      isActive: false,
      isComplete: false,
    }),

  startTest: () =>
    set({
      startedAt: Date.now(),
      isActive: true,
      isComplete: false,
      timeRemaining: MOCK_TEST_DURATION_SECONDS,
    }),

  selectAnswer: (answer) => {
    const { questions, currentIndex, answers } = get();
    const question = questions[currentIndex];
    if (!question) {
      return;
    }

    const correct = question.correct_answer === answer;
    const filtered = answers.filter((a) => a.questionId !== question.id);

    set({
      selectedAnswer: answer,
      answers: [...filtered, { questionId: question.id, selected: answer, correct }],
    });
  },

  nextQuestion: () => {
    const { currentIndex, questions, answers } = get();
    if (currentIndex >= questions.length - 1) {
      get().finishTest();
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextQuestion = questions[nextIndex];
    const existing = answers.find((a) => a.questionId === nextQuestion.id);

    set({
      currentIndex: nextIndex,
      selectedAnswer: existing?.selected ?? null,
    });
  },

  previousQuestion: () => {
    const { currentIndex, questions, answers } = get();
    if (currentIndex <= 0) {
      return;
    }

    const prevIndex = currentIndex - 1;
    const prevQuestion = questions[prevIndex];
    const existing = answers.find((a) => a.questionId === prevQuestion.id);

    set({
      currentIndex: prevIndex,
      selectedAnswer: existing?.selected ?? null,
    });
  },

  tick: () => {
    const { timeRemaining, isActive, isComplete } = get();
    if (!isActive || isComplete) {
      return;
    }

    if (timeRemaining <= 1) {
      get().finishTest();
      return;
    }

    set({ timeRemaining: timeRemaining - 1 });
  },

  finishTest: () =>
    set({
      isActive: false,
      isComplete: true,
    }),

  reset: () =>
    set({
      questions: [],
      currentIndex: 0,
      answers: [],
      selectedAnswer: null,
      startedAt: null,
      timeRemaining: MOCK_TEST_DURATION_SECONDS,
      isActive: false,
      isComplete: false,
    }),

  getScore: () => get().answers.filter((a) => a.correct).length,

  getPassed: () => get().getScore() >= MOCK_TEST_PASS_SCORE,

  getCurrentQuestion: () => {
    const { questions, currentIndex } = get();
    return questions[currentIndex] ?? null;
  },

  getTimeTaken: () => {
    const { startedAt } = get();
    if (!startedAt) {
      return 0;
    }
    return Math.round((Date.now() - startedAt) / 1000);
  },
}));
