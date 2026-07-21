import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { signUp } from '../../services/auth';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('participant');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !phone || !password) {
      Alert.alert('Erreur', 'Remplis tous les champs');
      return;
    }
    setLoading(true);
    try {
      await signUp({ fullName, email, phone, password, countryCode: '+229', role });
      Alert.alert('Succès', 'Compte créé avec succès !');
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>EventPass</Text>
      <Text style={styles.subtitle}>Créer un compte</Text>
      <TextInput style={styles.input} placeholder="Nom complet" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
      <View style={styles.roleContainer}>
        <TouchableOpacity style={[styles.roleButton, role === 'participant' && styles.roleActive]} onPress={() => setRole('participant')}>
          <Text style={[styles.roleText, role === 'participant' && styles.roleTextActive]}>Participant</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roleButton, role === 'organisateur' && styles.roleActive]} onPress={() => setRole('organisateur')}>
          <Text style={[styles.roleText, role === 'organisateur' && styles.roleTextActive]}>Organisateur</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Création...' : "S'inscrire"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#6C47FF', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  roleContainer: { flexDirection: 'row', marginBottom: 24, gap: 12 },
  roleButton: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  roleActive: { backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  roleText: { color: '#666', fontWeight: '600' },
  roleTextActive: { color: '#fff' },
  button: { backgroundColor: '#6C47FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginButton: { marginTop: 16, alignItems: 'center' },
  loginText: { color: '#6C47FF', fontSize: 16 },
});