import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../services/supabase';

export default function ExploreScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(text) {
    setSearch(text);
    if (text.length < 2) {
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .ilike('title', `%${text}%`)
        .in('status', ['published', 'live']);
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function renderEvent({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.location}>📍 {item.location}</Text>
        <Text style={styles.date}>📅 {new Date(item.date).toLocaleDateString('fr-FR')}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explorer</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un événement..."
        value={search}
        onChangeText={handleSearch}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#6C47FF" style={styles.loader} />
      ) : events.length === 0 && search.length > 1 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Aucun résultat pour "{search}"</Text>
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
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#6C47FF', marginBottom: 16, marginTop: 48 },
  searchInput: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#ddd' },
  list: { gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  eventTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  location: { color: '#666', marginBottom: 4 },
  date: { color: '#666' },
  loader: { marginTop: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#666', fontSize: 16 },
});