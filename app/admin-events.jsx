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
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('draft');

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles:organizer_id(full_name, phone)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllEvents(data || []);
      setEvents((data || []).filter(e => e.status === 'draft'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilter(status) {
    setFilter(status);
    setEvents(allEvents.filter(e => e.status === status));
  }

  async function handleApprove(eventId) {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'published' })
        .eq('id', eventId);
      if (error) throw error;
      Alert.alert('Succès', 'Événement approuvé !');
      fetchEvents();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  }

  async function handleReject(eventId) {
    Alert.alert(
      'Rejeter l\'événement',
      'L\'événement sera repassé en brouillon.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('events')
                .update({ status: 'draft' })
                .eq('id', eventId);
              if (error) throw error;
              Alert.alert('Événement rejeté');
              fetchEvents();
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  }

  async function handleDelete(eventId) {
    Alert.alert(
      '🗑️ Supprimer définitivement',
      'Cette action est irréversible. L\'événement et tous ses billets seront supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('ticket_types').delete().eq('event_id', eventId);
              const { error } = await supabase.from('events').delete().eq('id', eventId);
              if (error) throw error;
              Alert.alert('Événement supprimé définitivement');
              fetchEvents();
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  }

  function renderEvent({ item }) {
    const organizer = item.profiles;
    return (
      <View style={styles.card}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.organizer}>
          Par : {organizer?.full_name || 'Inconnu'} ({organizer?.phone || '—'})
        </Text>
        <Text style={styles.location}>📍 {item.location}</Text>
        <Text style={styles.date}>
          📅 {new Date(item.date).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </Text>
        <View style={[styles.statusBadge,
          item.status === 'published' ? styles.statusPublished :
          item.status === 'draft' ? styles.statusDraft :
          styles.statusEnded
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>

        <View style={styles.actions}>
          {item.status === 'draft' && (
            <TouchableOpacity style={styles.approveButton} onPress={() => handleApprove(item.id)}>
              <Text style={styles.approveText}>✓ Approuver</Text>
            </TouchableOpacity>
          )}
          {item.status === 'published' && (
            <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(item.id)}>
              <Text style={styles.rejectText}>⏸ Suspendre</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteText}>🗑️ Supprimer</Text>
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
        <Text style={styles.title}>Gestion des événements</Text>
      </View>

      <View style={styles.filterRow}>
        {['draft', 'published', 'ended'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterButton, filter === status && styles.filterActive]}
            onPress={() => applyFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {status === 'draft' ? 'En attente' : status === 'published' ? 'Publiés' : 'Terminés'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Aucun événement dans cette catégorie</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 24, paddingTop: 48 },
  backButton: { marginBottom: 8 },
  backText: { color: '#6C47FF', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  filterRow: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: '#fff', marginBottom: 8 },
  filterButton: { flex: 1, padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  filterActive: { backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  filterText: { color: '#666', fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  organizer: { color: '#6C47FF', fontWeight: '600', fontSize: 13, marginBottom: 8 },
  location: { color: '#666', marginBottom: 4, fontSize: 13 },
  date: { color: '#666', fontSize: 13, marginBottom: 8 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  statusPublished: { backgroundColor: '#dcfce7' },
  statusDraft: { backgroundColor: '#fef9c3' },
  statusEnded: { backgroundColor: '#f3f4f6' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#444' },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  approveButton: { flex: 1, backgroundColor: '#6C47FF', padding: 12, borderRadius: 12, alignItems: 'center' },
  approveText: { color: '#fff', fontWeight: 'bold' },
  rejectButton: { flex: 1, backgroundColor: '#fef9c3', padding: 12, borderRadius: 12, alignItems: 'center' },
  rejectText: { color: '#92400e', fontWeight: 'bold' },
  deleteButton: { flex: 1, backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, alignItems: 'center' },
  deleteText: { color: '#ef4444', fontWeight: 'bold' },
  empty: { color: '#666', fontSize: 16 },
});