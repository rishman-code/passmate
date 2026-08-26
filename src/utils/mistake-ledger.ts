import type { Question, UserProgress } from '@/types/database';

export type MistakeReason = 'wrong' | 'flagged' | 'both';

export interface MistakeEntry {
  question: Question;
  reason: MistakeReason;
}

/**
 * Every question the user has ever answered incorrectly or flagged, DVSA
 * category tagging included so the ledger can be filtered by topic. Never
 * clears itself — an entry only disappears if the caller decides to, which
 * this app never does automatically.
 */
export function buildMistakeLedger(
  questions: Question[],
  progress: Record<string, UserProgress>,
  flaggedIds: Record<string, true>,
  categoryFilter: string | null = null,
): MistakeEntry[] {
  const entries: MistakeEntry[] = [];

  for (const question of questions) {
    if (categoryFilter && question.category !== categoryFilter) continue;

    const wasWrong = progress[question.id]?.answered_correctly === false;
    const isFlagged = Boolean(flaggedIds[question.id]);

    if (!wasWrong && !isFlagged) continue;

    const reason: MistakeReason = wasWrong && isFlagged ? 'both' : wasWrong ? 'wrong' : 'flagged';
    entries.push({ question, reason });
  }

  return entries;
}
