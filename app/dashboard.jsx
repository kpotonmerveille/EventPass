import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: myEvents } = await supabase
        .from('events')
        .select('*, ticket_types(*, orders(quantity, total_amount, organizer_share, status, organizer_paid))')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      let totalRevenue = 0;
      let totalTicketsSold = 0;
      let totalOrders = 0;
      let totalPending = 0;

      const eventsWithStats = (myEvents || []).map((event) => {
        let eventRevenue = 0;
        let eventTicketsSold = 0;
        let eventOrders = 0;
        let eventPending = 0;

        event.ticket_types?.forEach((tt) => {
          tt.orders?.forEach((order) => {
            if (order.status === 'paid') {
              const share = order.organizer_share || 0;
              eventRevenue += share;
              eventTicketsSold += order.quantity;
              eventOrders += 1;
              if (!order.organizer_paid) {
                eventPending += share;
              }
            }
          });
        });

        totalRevenue += eventRevenue;
        totalTicketsSold += eventTicketsSold;
        totalOrders += eventOrders;
        totalPending += eventPending;

        return { ...event, eventRevenue, eventTicketsSold, eventOrders, eventPending };
      });

      setStats({
        totalRevenue,
        totalTicketsSold,
        totalOrders,
        totalEvents: myEvents?.length || 0,
        totalPending,
      });
      setEvents(eventsWithStats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mon Dashboard</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalEvents || 0}</Text>
          <Text style={styles.statLabel}>Événements</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalTicketsSold || 0}</Text>
          <Text style={styles.statLabel}>Billets vendus</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalOrders || 0}</Text>
          <Text style={styles.statLabel}>Commandes</Text>
        </View>
        <View style={[styles.statCard, styles.statCardRevenue]}>
          <Text style={[styles.statValue, styles.statValueRevenue]}>
            {(stats?.totalRevenue || 0).toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, styles.statLabelRevenue]}>FCFA gagnés (90%)</Text>
        </View>
        {stats?.totalPending > 0 && (
          <View style={[styles.statCard, styles.statCardPending]}>
            <Text style={[styles.statValue, styles.statValuePending]}>
              {stats.totalPending.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, styles.statLabelPending]}>
              FCFA en attente de versement
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes événements</Text>
        {events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun événement créé</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateEvent')}
            >
              <Text style={styles.createButtonText}>+ Créer un événement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={[
                  styles.statusBadge,
                  event.status === 'published' ? styles.statusPublished :
                  event.status === 'draft' ? styles.statusDraft :
                  styles.statusEnded
                ]}>
                  <Text style={styles.statusText}>{event.status}</Text>
                </View>
              </View>
              <Text style={styles.eventDate}>
                📅 {new Date(event.date).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
              <Text style={styles.eventLocation}>📍 {event.location}</Text>
              <View style={styles.eventStats}>
                <View style={styles.eventStat}>
                  <Text style={styles.eventStatValue}>{event.eventTicketsSold}</Text>
                  <Text style={styles.eventStatLabel}>billets</Text>
                </View>
                <View style={styles.eventStat}>
                  <Text style={styles.eventStatValue}>{event.eventOrders}</Text>
                  <Text style={styles.eventStatLabel}>commandes</Text>
                </View>
                <View style={styles.eventStat}>
                  <Text style={[styles.eventStatValue, { color: '#6C47FF' }]}>
                    {event.eventRevenue.toLocaleString()} FCFA
                  </Text>
                  <Text style={styles.eventStatLabel}>ta part (90%)</Text>
                </View>
              </View>
              {event.eventPending > 0 && (
                <Text style={styles.pendingNote}>
                  ⏳ {event.eventPending.toLocaleString()} FCFA en attente de versement
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 24, paddingTop: 48 },
  backButton: { marginBottom: 8 },
  backText: { color: '#6C47FF', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' },
  statCardRevenue: { backgroundColor: '#6C47FF', minWidth: '100%' },
  statCardPending: { backgroundColor: '#fef9c3', minWidth: '100%' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  statValueRevenue: { color: '#fff', fontSize: 24 },
  statValuePending: { color: '#92400e', fontSize: 24 },
  statLabel: { color: '#666', fontSize: 13, marginTop: 4 },
  statLabelRevenue: { color: '#EEE9FF' },
  statLabelPending: { color: '#92400e' },
  section: { backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#666', marginBottom: 16 },
  createButton: { backgroundColor: '#6C47FF', padding: 14, borderRadius: 12, paddingHorizontal: 24 },
  createButtonText: { color: '#fff', fontWeight: 'bold' },
  eventCard: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16, marginBottom: 12 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPublished: { backgroundColor: '#dcfce7' },
  statusDraft: { backgroundColor: '#fef9c3' },
  statusEnded: { backgroundColor: '#f3f4f6' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#444' },
  eventDate: { color: '#666', marginBottom: 4, fontSize: 13 },
  eventLocation: { color: '#666', fontSize: 13, marginBottom: 12 },
  eventStats: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  eventStat: { alignItems: 'center' },
  eventStatValue: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  eventStatLabel: { color: '#666', fontSize: 12, marginTop: 2 },
  pendingNote: { color: '#92400e', fontSize: 12, marginTop: 8, fontWeight: '600' },
});