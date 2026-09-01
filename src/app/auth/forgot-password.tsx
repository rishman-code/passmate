import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { friendlyAuthError, requestPasswordReset } from '@/lib/auth';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {sent ? (
              <View style={styles.confirmation} testID="forgot-password-sent">
                <View
                  style={[
                    styles.confirmationIcon,
                    { backgroundColor: theme.successLight, borderColor: theme.success },
                  ]}>
                  <Ionicons name="mail-outline" size={32} color={theme.success} />
                </View>
                <ThemedText type="title" style={styles.centeredText}>
                  Check your email
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.centeredText}>
                  If there's a GreenLight account for {email.trim()}, we've sent a link to reset your password.
                </ThemedText>
                <Button title="Back to Sign In" onPress={() => router.replace('/auth/sign-in')} fullWidth />
              </View>
            ) : (
              <>
                <View style={styles.header}>
                  <ThemedText type="title">Forgot password?</ThemedText>
                  <ThemedText themeColor="textSecondary">
                    Enter your email and we'll send you a link to reset it.
                  </ThemedText>
                </View>

                <View style={styles.form}>
                  <View style={styles.field}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      Email
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.card, borderColor: theme.borderHard, color: theme.text },
                      ]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      returnKeyType="done"
                      onSubmitEditing={handleSend}
                      testID="forgot-password-email-input"
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
                    title="Send Reset Link"
                    onPress={handleSend}
                    loading={isLoading}
                    fullWidth
                    testID="forgot-password-send-button"
                  />
                </View>

                <ThemedText
                  type="linkPrimary"
                  style={styles.centeredText}
                  onPress={() => router.replace('/auth/sign-in')}>
                  Back to Sign In
                </ThemedText>
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
  confirmationIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
});
