import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../services/supabase';

export default function TicketsScreen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('tickets')
        .select('*, events(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function renderTicket({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.eventName}>{item.events?.title || 'Événement'}</Text>
          <View style={[styles.badge, item.is_used && styles.badgeUsed]}>
            <Text style={styles.badgeText}>{item.is_used ? 'Utilisé' : 'Valide'}</Text>
          </View>
        </View>
        <Text style={styles.ticketType}>{item.ticket_type}</Text>
        <Text style={styles.location}>📍 {item.events?.location || ''}</Text>
        <Text style={styles.date}>📅 {item.events?.date ? new Date(item.events.date).toLocaleDateString('fr-FR') : ''}</Text>
        <View style={styles.qrContainer}>
          <Text style={styles.qrLabel}>Code QR</Text>
          <Text style={styles.qrCode}>{item.qr_code}</Text>
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
      <Text style={styles.title}>Mes Billets</Text>
      {tickets.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Aucun billet pour le moment</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicket}
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
  list: { gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', flex: 1 },
  badge: { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeUsed: { backgroundColor: '#ef4444' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  ticketType: { color: '#6C47FF', fontWeight: '600', marginBottom: 8 },
  location: { color: '#666', marginBottom: 4 },
  date: { color: '#666', marginBottom: 12 },
  qrContainer: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, alignItems: 'center' },
  qrLabel: { color: '#666', fontSize: 12, marginBottom: 4 },
  qrCode: { color: '#1a1a1a', fontWeight: '600', fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#666', fontSize: 16 },
});