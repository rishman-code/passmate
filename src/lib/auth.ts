import { supabase } from './supabase';

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
