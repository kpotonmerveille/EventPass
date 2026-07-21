import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../services/supabase';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email) {
      Alert.alert('Erreur', 'Entre ton adresse email');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://dist-iemedfb4x-eventpass.vercel.app',
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.successIcon}>📧</Text>
        <Text style={styles.successTitle}>Email envoyé !</Text>
        <Text style={styles.successText}>
          Vérifie ta boîte mail et clique sur le lien pour réinitialiser ton mot de passe.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>
        Entre ton email et on t'enverra un lien pour réinitialiser ton mot de passe.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ton adresse email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Envoyer le lien</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  backButton: { position: 'absolute', top: 48, left: 24 },
  backText: { color: '#6C47FF', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  subtitle: { color: '#666', fontSize: 15, lineHeight: 22, marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#6C47FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  successIcon: { fontSize: 60, textAlign: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 12 },
  successText: { color: '#666', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 32 },
});