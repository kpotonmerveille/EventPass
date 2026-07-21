import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';

export default function AdminEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  async function fetchPendingEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles:organizer_id(full_name, phone)')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(eventId) {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'published' })
        .eq('id', eventId);
      if (error) throw error;
      Alert.alert('Succès', 'Événement approuvé !');
      fetchPendingEvents();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  }

  async function handleReject(eventId) {
    Alert.alert(
      'Rejeter l\'événement',
      'Es-tu sûr de vouloir rejeter cet événement ? Il sera supprimé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('events').delete().eq('id', eventId);
              if (error) throw error;
              Alert.alert('Événement rejeté');
              fetchPendingEvents();
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  }

  function renderEvent({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.organizer}>
          Par : {item.profiles?.full_name || 'Inconnu'} ({item.profiles?.phone || '—'})
        </Text>
        <Text style={styles.location}>📍 {item.location}</Text>
        <Text style={styles.date}>
          📅 {new Date(item.date).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleReject(item.id)}
          >
            <Text style={styles.rejectText}>Rejeter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApprove(item.id)}
          >
            <Text style={styles.approveText}>Approuver</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Événements en attente</Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Aucun événement en attente</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#fff', padding: 24, paddingTop: 48 },
  backButton: { marginBottom: 8 },
  backText: { color: '#6C47FF', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  eventTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  organizer: { color: '#6C47FF', fontWeight: '600', fontSize: 13, marginBottom: 8 },
  location: { color: '#666', marginBottom: 4 },
  date: { color: '#666', marginBottom: 8 },
  description: { color: '#444', marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  rejectButton: { flex: 1, backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, alignItems: 'center' },
  rejectText: { color: '#ef4444', fontWeight: 'bold' },
  approveButton: { flex: 1, backgroundColor: '#6C47FF', padding: 12, borderRadius: 12, alignItems: 'center' },
  approveText: { color: '#fff', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#666', fontSize: 16 },
});