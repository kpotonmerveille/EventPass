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

export default function AdminTransactionsScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingPayouts();
  }, []);

  async function fetchPendingPayouts() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, ticket_types(name, events(title, organizer_id, profiles:organizer_id(full_name, phone)))')
        .eq('status', 'paid')
        .eq('organizer_paid', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid(orderId) {
    Alert.alert(
      'Confirmer le versement',
      'As-tu bien envoyé l\'argent à l\'organisateur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, c\'est versé',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('orders')
                .update({ organizer_paid: true })
                .eq('id', orderId);
              if (error) throw error;
              Alert.alert('Succès', 'Versement marqué comme effectué');
              fetchPendingPayouts();
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  }

  function renderOrder({ item }) {
    const event = item.ticket_types?.events;
    const organizer = event?.profiles;

    return (
      <View style={styles.card}>
        <Text style={styles.eventTitle}>{event?.title || 'Événement inconnu'}</Text>
        <Text style={styles.organizer}>
          Organisateur : {organizer?.full_name || 'Inconnu'} ({organizer?.phone || '—'})
        </Text>
        <Text style={styles.ticketType}>{item.ticket_types?.name} x{item.quantity}</Text>

        <View style={styles.amountsRow}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total payé</Text>
            <Text style={styles.amountValue}>{item.total_amount?.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>À reverser (90%)</Text>
            <Text style={[styles.amountValue, { color: '#6C47FF' }]}>
              {item.organizer_share?.toLocaleString()} FCFA
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={() => handleMarkPaid(item.id)}
        >
          <Text style={styles.payButtonText}>✓ Marquer comme versé</Text>
        </TouchableOpacity>
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

  const totalToPayOut = orders.reduce((sum, o) => sum + (o.organizer_share || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Versements en attente</Text>
        {orders.length > 0 && (
          <Text style={styles.totalText}>
            Total à reverser : {totalToPayOut.toLocaleString()} FCFA
          </Text>
        )}
      </View>

      {orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Aucun versement en attente</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
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
  totalText: { color: '#6C47FF', fontWeight: '600', marginTop: 8, fontSize: 15 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  organizer: { color: '#666', fontSize: 13, marginBottom: 4 },
  ticketType: { color: '#666', fontSize: 13, marginBottom: 12 },
  amountsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  amountBox: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 12, alignItems: 'center' },
  amountLabel: { color: '#666', fontSize: 12, marginBottom: 4 },
  amountValue: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  payButton: { backgroundColor: '#6C47FF', padding: 14, borderRadius: 12, alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: 'bold' },
  empty: { color: '#666', fontSize: 16 },
});