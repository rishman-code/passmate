import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { friendlyAuthError, signIn, signInWithApple } from '@/lib/auth';
import { setGuestMode } from '@/lib/guest-mode';
import { useJourneyStore } from '@/stores/journey-store';
import { useProgressStore } from '@/stores/progress-store';

export default function SignInScreen() {
  const theme = useTheme();
  const loadFromSupabase = useProgressStore((s) => s.loadFromSupabase);
  const loadJourneyFromSupabase = useJourneyStore((s) => s.loadFromSupabase);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const enterApp = async (userId: string | undefined) => {
    await setGuestMode(false);
    if (userId) await Promise.all([loadFromSupabase(userId), loadJourneyFromSupabase(userId)]);
    router.replace('/');
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const { user } = await signIn(email.trim().toLowerCase(), password);
      await enterApp(user?.id);
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setIsAppleLoading(true);
    try {
      const { user } = await signInWithApple();
      await enterApp(user?.id);
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      if (code !== 'ERR_REQUEST_CANCELED') {
        setError('Apple sign-in failed. Please try again.');
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    await setGuestMode(true);
    router.replace('/');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText type="title">Welcome back</ThemedText>
              <ThemedText themeColor="textSecondary">Sign in to your PassMate account.</ThemedText>
            </View>

            {Platform.OS === 'ios' ? (
              <View style={styles.appleSection}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={28}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                  testID="apple-sign-in-button"
                />
                {isAppleLoading ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.centeredText}>
                    Signing in…
                  </ThemedText>
                ) : null}

                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                  <ThemedText type="small" themeColor="textSecondary">
                    or
                  </ThemedText>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                </View>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={styles.field}>
                <ThemedText type="caption" themeColor="textSecondary">Email</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.borderHard,
                      color: theme.text,
                    },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="caption" themeColor="textSecondary">Password</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.borderHard,
                      color: theme.text,
                    },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: theme.errorLight, borderColor: theme.error }]}>
                  <ThemedText type="small" style={{ color: theme.error }}>{error}</ThemedText>
                </View>
              ) : null}

              <Button
                title="Sign In"
                onPress={handleSignIn}
                loading={isLoading}
                fullWidth
              />
            </View>

            <View style={styles.footer}>
              <ThemedText themeColor="textSecondary">Don't have an account? </ThemedText>
              <ThemedText
                type="linkPrimary"
                onPress={() => router.replace('/auth/sign-up')}>
                Create one
              </ThemedText>
            </View>

            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.guestLink}
              onPress={handleContinueAsGuest}
              testID="continue-as-guest-link">
              Not now — continue without an account
            </ThemedText>
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
  scroll: {
    flexGrow: 1,
    padding: Spacing.four,
    gap: Spacing.five,
    justifyContent: 'center',
  },
  header: { gap: Spacing.one },
  appleSection: { gap: Spacing.three },
  appleButton: {
    width: '100%',
    height: 56,
  },
  centeredText: { textAlign: 'center' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestLink: {
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
