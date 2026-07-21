import { supabase } from './supabase';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    // Vérifier activement que la session est prête, jusqu'à 5 fois
    let sessionReady = false;
    for (let i = 0; i < 5; i++) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        sessionReady = true;
        break;
      }
      await wait(400);
    }

    if (!sessionReady) {
      console.log('Session jamais prête, tentative d\'insert quand même');
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      phone: fullPhone,
      country_code: countryCode,
      role,
    });

    if (profileError) {
      console.log('Erreur création profil:', JSON.stringify(profileError));
      throw new Error('Compte créé mais profil non enregistré (' + profileError.message + ')');
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