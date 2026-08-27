import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

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

export function friendlyAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (message.includes('Email not confirmed')) return 'Please confirm your email before signing in.';
  if (message.includes('User already registered')) return 'An account with this email already exists.';
  if (message.includes('Password should be')) return 'Password must be at least 6 characters.';
  return 'Something went wrong. Please try again.';
}
