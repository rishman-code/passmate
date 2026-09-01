import { create } from 'zustand';

// Deliberately not persisted: the welcome screen should be shown again every
// time the app is cold-started, not just once per device. This resets
// naturally on every JS reload/relaunch and stays stable across in-app
// navigation for the lifetime of the running app.
interface WelcomeSessionState {
  hasSeenWelcome: boolean;
  markWelcomeSeen: () => void;
  resetWelcomeSeen: () => void;
}

export const useWelcomeSessionStore = create<WelcomeSessionState>((set) => ({
  hasSeenWelcome: false,
  markWelcomeSeen: () => set({ hasSeenWelcome: true }),
  resetWelcomeSeen: () => set({ hasSeenWelcome: false }),
}));
