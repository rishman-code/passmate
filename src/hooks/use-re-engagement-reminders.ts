import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { scheduleReEngagementReminders } from '@/services/re-engagement-notifications';

/**
 * Reschedules the "come back" reminder chain every time the app is opened
 * or returns to the foreground, so it's always pushed two-plus days out
 * from whenever the user was last actually seen using it. `enabled` should
 * stay false until the user is past onboarding -- we don't want to prompt
 * for notification permission before they've even reached the app.
 */
export function useReEngagementReminders(enabled: boolean) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    scheduleReEngagementReminders();

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current !== 'active' && next === 'active') {
        scheduleReEngagementReminders();
      }
      appState.current = next;
    });

    return () => subscription.remove();
  }, [enabled]);
}
