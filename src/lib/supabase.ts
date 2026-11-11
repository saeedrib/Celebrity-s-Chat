import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// BY CLICK must use its own Supabase project credentials supplied through Vercel
// environment variables. Never fall back to the old Celebrity Chat database.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = Boolean(url && anonKey);

const authStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

// A placeholder client keeps the app renderable during setup. Auth actions
// are blocked by isSupabaseConfigured until real BY CLICK credentials exist.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-key',
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);
