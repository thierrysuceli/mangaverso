import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcyqkooivpcgvonrkgbb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeXFrb29pdnBjZ3ZvbnJrZ2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODkxNjgsImV4cCI6MjA3NzI2NTE2OH0.a8KfFSnraHHlEF0Pzcx8mX6Sd-6An0QZU1Fww1SKPfk';

// Storage wrapper para debug
const storageWrapper = {
  getItem: (key) => {
    const value = window.localStorage.getItem(key);
    console.log('[STORAGE] GET:', key, value ? 'EXISTS' : 'NULL');
    return value;
  },
  setItem: (key, value) => {
    console.log('[STORAGE] SET:', key, value ? 'DATA' : 'NULL');
    window.localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    console.log('[STORAGE] REMOVE:', key);
    window.localStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: storageWrapper,
  },
});
