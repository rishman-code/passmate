import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { exchangePasswordResetCode, friendlyAuthError, updatePassword } from '@/lib/auth';
import { setGuestMode } from '@/lib/guest-mode';
import { useJourneyStore } from '@/stores/journey-store';
import { useProgressStore } from '@/stores/progress-store';

type ExchangeState = 'exchanging' | 'ready' | 'failed';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  const loadFromSupabase = useProgressStore((s) => s.loadFromSupabase);
  const loadJourneyFromSupabase = useJourneyStore((s) => s.loadFromSupabase);

  const [exchangeState, setExchangeState] = useState<ExchangeState>('exchanging');
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) {
      setExchangeState('failed');
      setExchangeError('This reset link is missing its code. Please request a new one.');
      return;
    }
    exchangePasswordResetCode(code)
      .then(() => setExchangeState('ready'))
      .catch((e) => {
        setExchangeError(friendlyAuthError(e instanceof Error ? e.message : ''));
        setExchangeState('failed');
      });
    // Only ever exchange the code we landed with -- re-running this on every
    // render would burn the one-time code a second time and always fail.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const { user } = await updatePassword(password);
      await setGuestMode(false);
      if (user) await Promise.all([loadFromSupabase(user.id), loadJourneyFromSupabase(user.id)]);
      setDone(true);
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : ''));
    } finally {
      setIsLoading(false);
    }
  };

  if (exchangeState === 'exchanging') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (exchangeState === 'failed') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.centered}>
            <View style={styles.confirmation} testID="reset-password-invalid">
              <View style={[styles.iconBadge, { backgroundColor: theme.errorLight, borderColor: theme.error }]}>
                <Ionicons name="close-circle-outline" size={32} color={theme.error} />
              </View>
              <ThemedText type="title" style={styles.centeredText}>
                Link expired
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.centeredText}>
                {exchangeError}
              </ThemedText>
              <Button
                title="Request a New Link"
                onPress={() => router.replace('/auth/forgot-password')}
                fullWidth
              />
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {done ? (
              <View style={styles.confirmation} testID="reset-password-done">
                <View style={[styles.iconBadge, { backgroundColor: theme.successLight, borderColor: theme.success }]}>
                  <Ionicons name="checkmark-circle-outline" size={32} color={theme.success} />
                </View>
                <ThemedText type="title" style={styles.centeredText}>
                  Password updated
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.centeredText}>
                  You're all set. Let's get back to revising.
                </ThemedText>
                <Button title="Continue" onPress={() => router.replace('/')} fullWidth testID="reset-password-continue" />
              </View>
            ) : (
              <>
                <View style={styles.header}>
                  <ThemedText type="title">Set a new password</ThemedText>
                  <ThemedText themeColor="textSecondary">Choose something you'll remember this time.</ThemedText>
                </View>

                <View style={styles.form}>
                  <View style={styles.field}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      New password
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.card, borderColor: theme.borderHard, color: theme.text },
                      ]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry
                      returnKeyType="next"
                      testID="reset-password-new-input"
                    />
                  </View>

                  <View style={styles.field}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      Confirm password
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.card, borderColor: theme.borderHard, color: theme.text },
                      ]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry
                      returnKeyType="done"
                      onSubmitEditing={handleUpdatePassword}
                      testID="reset-password-confirm-input"
                    />
                  </View>

                  {error ? (
                    <View style={[styles.errorBox, { backgroundColor: theme.errorLight, borderColor: theme.error }]}>
                      <ThemedText type="small" style={{ color: theme.error }}>
                        {error}
                      </ThemedText>
                    </View>
                  ) : null}

                  <Button
                    title="Update Password"
                    onPress={handleUpdatePassword}
                    loading={isLoading}
                    fullWidth
                    testID="reset-password-submit-button"
                  />
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  scroll: {
    flexGrow: 1,
    padding: Spacing.four,
    gap: Spacing.five,
    justifyContent: 'center',
  },
  header: { gap: Spacing.one },
  form: { gap: Spacing.three },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.bodyRegular,
  },
  errorBox: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  centeredText: { textAlign: 'center' },
  confirmation: { alignItems: 'center', gap: Spacing.three },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
});
