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
import { friendlyAuthError, signIn } from '@/lib/auth';
import { useTheme } from '@/hooks/use-theme';
import { useProgressStore } from '@/stores/progress-store';

export default function SignInScreen() {
  const theme = useTheme();
  const loadFromSupabase = useProgressStore((s) => s.loadFromSupabase);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const { user } = await signIn(email.trim().toLowerCase(), password);
      if (user) await loadFromSupabase(user.id);
      router.replace('/');
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : ''));
    } finally {
      setIsLoading(false);
    }
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
});
