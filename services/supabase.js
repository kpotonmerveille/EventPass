import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://xlffvowghjmpbzehrqay.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OHGazGONg95f8uDnYY1wKQ_HcjKy6PP';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});