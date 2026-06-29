import { useEffect, useMemo, useState } from 'react';

import { fetchAllQuestions } from '@/services/questions';
import { useProgressStore } from '@/stores/progress-store';
import type { Question } from '@/types/database';
import { computeCategoryScores, getWeakestCategories } from '@/utils/category-scores';

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchAllQuestions()
      .then((data) => {
        if (mounted) {
          setQuestions(data);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const questionCategories = useMemo(
    () => Object.fromEntries(questions.map((q) => [q.id, q.category])),
    [questions],
  );

  const progress = useProgressStore((s) => s.progress);
  const categoryScores = useMemo(
    () => computeCategoryScores(progress, questionCategories),
    [progress, questionCategories],
  );
  const weakestCategories = useMemo(
    () => getWeakestCategories(categoryScores),
    [categoryScores],
  );

  return {
    questions,
    isLoading,
    questionCategories,
    categoryScores,
    weakestCategories,
  };
}
