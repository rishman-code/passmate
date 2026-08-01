import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { supabase } from '@/lib/supabase';
import type { MockTestResult, UserProgress } from '@/types/database';

function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface ProgressState {
  userId: string | null;
  progress: Record<string, UserProgress>;
  mockTestResults: MockTestResult[];
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  setUserId: (userId: string | null) => void;
  loadFromSupabase: (userId: string) => Promise<void>;
  recordAnswer: (questionId: string, correct: boolean) => void;
  recordMockTestResult: (result: Omit<MockTestResult, 'id'>) => void;
  getTotalAnswered: () => number;
  getOverallAccuracy: () => number;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      userId: null,
      progress: {},
      mockTestResults: [],
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,

      setUserId: (userId) => set({ userId }),

      loadFromSupabase: async (userId) => {
        set({ userId });

        const [{ data: progressRows }, { data: mockRows }] = await Promise.all([
          supabase
            .from('user_progress')
            .select('question_id, answered_correctly, answered_at, attempt_count')
            .eq('user_id', userId),
          supabase
            .from('mock_test_results')
            .select('id, score, total_questions, passed, completed_at, time_taken_seconds')
            .eq('user_id', userId)
            .order('completed_at', { ascending: false }),
        ]);

        const progress: Record<string, UserProgress> = {};
        for (const row of progressRows ?? []) {
          progress[row.question_id] = row as UserProgress;
        }

        set({
          progress,
          mockTestResults: (mockRows ?? []) as MockTestResult[],
        });
      },

      recordAnswer: (questionId, correct) => {
        set((state) => {
          const existing = state.progress[questionId];
          const updated: UserProgress = {
            question_id: questionId,
            answered_correctly: correct,
            answered_at: new Date().toISOString(),
            attempt_count: (existing?.attempt_count ?? 0) + 1,
          };

          const { userId } = state;
          if (userId) {
            supabase.from('user_progress').upsert({
              user_id: userId,
              ...updated,
            }).then();
          }

          const today = localDateStr();
          const yesterday = localDateStr(new Date(Date.now() - 86400000));
          let { currentStreak, longestStreak, lastActiveDate } = state;

          if (lastActiveDate !== today) {
            if (lastActiveDate === yesterday) {
              currentStreak += 1;
            } else {
              currentStreak = 1;
            }
            longestStreak = Math.max(longestStreak, currentStreak);
            lastActiveDate = today;
          }

          return {
            progress: { ...state.progress, [questionId]: updated },
            currentStreak,
            longestStreak,
            lastActiveDate,
          };
        });
      },

      recordMockTestResult: (result) => {
        set((state) => {
          const entry: MockTestResult = { ...result, id: `mock-${Date.now()}` };

          const { userId } = state;
          if (userId) {
            supabase.from('mock_test_results').insert({
              user_id: userId,
              score: result.score,
              total_questions: result.total_questions,
              passed: result.passed,
              completed_at: result.completed_at,
              time_taken_seconds: result.time_taken_seconds,
            }).then();
          }

          return { mockTestResults: [entry, ...state.mockTestResults] };
        });
      },

      getTotalAnswered: () => Object.keys(get().progress).length,

      getOverallAccuracy: () => {
        const entries = Object.values(get().progress);
        if (entries.length === 0) return 0;
        const correct = entries.filter((e) => e.answered_correctly).length;
        return Math.round((correct / entries.length) * 100);
      },

      reset: () => set({ userId: null, progress: {}, mockTestResults: [], currentStreak: 0, longestStreak: 0, lastActiveDate: null }),
    }),
    {
      name: 'passmate-progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        progress: state.progress,
        mockTestResults: state.mockTestResults,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastActiveDate: state.lastActiveDate,
      }),
    },
  ),
);
