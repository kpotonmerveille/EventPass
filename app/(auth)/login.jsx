import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { signIn } from '../../services/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erreur', 'Remplis tous les champs');
      return;
    }
    setLoading(true);
    try {
      await signIn({ email, password });
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EventPass</Text>
      <Text style={styles.subtitle}>Connexion</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotButton}
      >
        <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.registerText}>Pas de compte ? S'inscrire</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#6C47FF', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  forgotButton: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { color: '#6C47FF', fontSize: 14 },
  button: { backgroundColor: '#6C47FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  registerButton: { marginTop: 16, alignItems: 'center' },
  registerText: { color: '#6C47FF', fontSize: 16 },
});