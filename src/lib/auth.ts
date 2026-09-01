import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';

import { supabase } from './supabase';

/**
 * Apple requires the ID token's embedded nonce to be a SHA256 hash of a
 * value we generate, but Supabase verifies against the raw (unhashed) value
 * — so we hand Apple the hash and Supabase the original.
 */
export async function signInWithApple() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('Apple sign-in did not return an identity token.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  const name = credential.fullName?.givenName
    ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
    : undefined;
  if (name && !data.user.user_metadata?.name) {
    await supabase.auth.updateUser({ data: { name } });
  }

  return data;
}

export async function signUp(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Sends a "reset your password" email via Supabase Auth. The link inside it
 * opens auth/reset-password.tsx with a one-time `code` param, which that
 * screen exchanges for a short-lived recovery session.
 *
 * The redirect URL this builds has to be allow-listed in the Supabase
 * dashboard (Authentication → URL Configuration → Redirect URLs) or
 * Supabase silently falls back to the project's default Site URL instead —
 * see CLAUDE.md.
 */
export async function requestPasswordReset(email: string) {
  const redirectTo = Linking.createURL('/auth/reset-password');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

/** Exchanges the one-time code from the reset-password deep link for a recovery session. */
export async function exchangePasswordResetCode(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data;
}

/** Sets a new password. Must be called while a recovery session (from exchangePasswordResetCode) is active. */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

export function friendlyAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (message.includes('Email not confirmed')) return 'Please confirm your email before signing in.';
  if (message.includes('User already registered')) return 'An account with this email already exists.';
  if (message.includes('Password should be')) return 'Password must be at least 6 characters.';
  if (message.includes('New password should be different')) {
    return 'Please choose a password different from your current one.';
  }
  if (message.includes('Email rate limit exceeded') || message.includes('you can only request this after')) {
    return "You've requested this recently — please check your inbox, or wait a minute before trying again.";
  }
  if (
    message.includes('code verifier') ||
    message.includes('Email link is invalid or has expired') ||
    message.includes('flow_state_not_found') ||
    message.includes('flow_state_expired')
  ) {
    return 'This reset link is invalid or has expired. Please request a new one.';
  }
  return 'Something went wrong. Please try again.';
}
