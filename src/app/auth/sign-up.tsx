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
import { friendlyAuthError, signUp } from '@/lib/auth';
import { setGuestMode } from '@/lib/guest-mode';
import { useTheme } from '@/hooks/use-theme';

export default function SignUpScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(null);
    setIsLoading(true);
    try {
      await signUp(name.trim(), email.trim().toLowerCase(), password);
      await setGuestMode(false);
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
              <ThemedText type="title">Create account</ThemedText>
              <ThemedText themeColor="textSecondary">
                Start preparing for your theory test.
              </ThemedText>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <ThemedText type="caption" themeColor="textSecondary">Name</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.borderHard, color: theme.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="caption" themeColor="textSecondary">Email</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.borderHard, color: theme.text }]}
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
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.borderHard, color: theme.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                />
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: theme.errorLight, borderColor: theme.error }]}>
                  <ThemedText type="small" style={{ color: theme.error }}>{error}</ThemedText>
                </View>
              ) : null}

              <Button
                title="Create Account"
                onPress={handleSignUp}
                loading={isLoading}
                fullWidth
              />
            </View>

            <View style={styles.footer}>
              <ThemedText themeColor="textSecondary">Already have an account? </ThemedText>
              <ThemedText
                type="linkPrimary"
                onPress={() => router.replace('/auth/sign-in')}>
                Sign in
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
