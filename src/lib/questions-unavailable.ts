import { Alert, Platform } from 'react-native';

const TITLE = "Couldn't load questions";
const MESSAGE =
  "We couldn't load the question bank right now. Check your connection and try again in a moment.";

/** Tells the user a practice / mock-test session couldn't start because no questions loaded. */
export function showQuestionsUnavailable(): void {
  if (Platform.OS === 'web') {
    // Alert.alert is a no-op on react-native-web.
    if (typeof window !== 'undefined') {
      window.alert(`${TITLE}\n\n${MESSAGE}`);
    }
    return;
  }

  Alert.alert(TITLE, MESSAGE);
}
