import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { getCurrentUser, signOut } from '../../services/auth';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const data = await getCurrentUser();
      setUser(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert(
      'Déconnexion',
      'Tu veux vraiment te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: async () => { await signOut(); } },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Mon Profil</Text>
      {user ? (
        <>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.profile?.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{user.profile?.full_name || 'Utilisateur'}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {user.profile?.role === 'organisateur'
                ? '🎪 Organisateur'
                : user.profile?.role === 'admin'
                ? '🛡️ Admin'
                : '🎟️ Participant'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{user.profile?.phone || 'Non renseigné'}</Text>
          </View>

          {user.profile?.role === 'organisateur' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Text style={styles.actionButtonText}>📊 Mon Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('CreateEvent')}
              >
                <Text style={styles.actionButtonText}>+ Créer un événement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Scanner')}
              >
                <Text style={styles.actionButtonText}>📷 Scanner un billet</Text>
              </TouchableOpacity>
            </>
          )}

          {user.profile?.role === 'admin' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('AdminEvents')}
              >
                <Text style={styles.actionButtonText}>🛡️ Valider les événements</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('AdminTransactions')}
              >
                <Text style={styles.actionButtonText}>💰 Versements en attente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Text style={styles.actionButtonText}>📊 Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('CreateEvent')}
              >
                <Text style={styles.actionButtonText}>+ Créer un événement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Scanner')}
              >
                <Text style={styles.actionButtonText}>📷 Scanner un billet</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.center}>
          <Text style={styles.empty}>Non connecté</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 24, alignItems: 'center', paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#6C47FF', marginBottom: 24, marginTop: 24, alignSelf: 'flex-start' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6C47FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  email: { fontSize: 14, color: '#666', marginBottom: 12 },
  badge: { backgroundColor: '#EEE9FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 24 },
  badgeText: { color: '#6C47FF', fontWeight: '600' },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', marginBottom: 16 },
  infoLabel: { color: '#666', fontSize: 12, marginBottom: 4 },
  infoValue: { color: '#1a1a1a', fontSize: 16, fontWeight: '600' },
  actionButton: { backgroundColor: '#6C47FF', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 8 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#666', fontSize: 16 },
});