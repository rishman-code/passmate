import { create } from 'zustand';

import type { MockTestResult, UserProgress } from '@/types/database';

interface ProgressState {
  progress: Record<string, UserProgress>;
  mockTestResults: MockTestResult[];
  recordAnswer: (questionId: string, correct: boolean) => void;
  recordMockTestResult: (result: Omit<MockTestResult, 'id'>) => void;
  getTotalAnswered: () => number;
  getOverallAccuracy: () => number;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: {},
  mockTestResults: [],

  recordAnswer: (questionId, correct) => {
    set((state) => {
      const existing = state.progress[questionId];
      const updated: UserProgress = {
        question_id: questionId,
        answered_correctly: correct,
        answered_at: new Date().toISOString(),
        attempt_count: (existing?.attempt_count ?? 0) + 1,
      };

      return {
        progress: {
          ...state.progress,
          [questionId]: updated,
        },
      };
    });
  },

  recordMockTestResult: (result) => {
    set((state) => ({
      mockTestResults: [
        {
          ...result,
          id: `mock-${Date.now()}`,
        },
        ...state.mockTestResults,
      ],
    }));
  },

  getTotalAnswered: () => Object.keys(get().progress).length,

  getOverallAccuracy: () => {
    const entries = Object.values(get().progress);
    if (entries.length === 0) {
      return 0;
    }

    const correct = entries.filter((e) => e.answered_correctly).length;
    return Math.round((correct / entries.length) * 100);
  },
}));
