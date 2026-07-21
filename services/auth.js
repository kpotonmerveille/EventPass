import { supabase } from './supabase';

export async function signUp({ phone, countryCode, fullName, email, password, role }) {
  const fullPhone = countryCode.replace(/[^+0-9]/g, '') + phone;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: fullPhone,
        country_code: countryCode,
        role
      }
    }
  });

  if (error) throw error;

  if (data.user) {
    // Utiliser l'Edge Function pour créer le profil (contourne le RLS)
    const { error: fnError } = await supabase.functions.invoke('create-profile', {
      body: {
        id: data.user.id,
        full_name: fullName,
        phone: fullPhone,
        country_code: countryCode,
        role,
      },
    });

    if (fnError) {
      console.log('Erreur Edge Function:', JSON.stringify(fnError));
    }
  }

  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { ...user, profile };
}