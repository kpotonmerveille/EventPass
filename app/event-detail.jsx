import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchEventDetails();
  }, []);

  async function fetchEventDetails() {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      const { data: tickets } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId);
      setEvent(eventData);
      setTicketTypes(tickets || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyTicket() {
    if (!selectedTicket) {
      Alert.alert('Erreur', 'Choisis un type de billet');
      return;
    }
    navigation.navigate('Payment', {
      event,
      ticketType: selectedTicket,
      quantity,
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Événement introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.category}>{event.category}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description}>{event.description}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>📍 {event.location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            📅 {new Date(event.date).toLocaleDateString('fr-FR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
      <View style={styles.ticketsSection}>
        <Text style={styles.sectionTitle}>Types de billets</Text>
        {ticketTypes.length === 0 ? (
          <Text style={styles.noTickets}>Aucun billet disponible</Text>
        ) : (
          ticketTypes.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={[styles.ticketCard, selectedTicket?.id === ticket.id && styles.ticketSelected]}
              onPress={() => setSelectedTicket(ticket)}
            >
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketName}>{ticket.name}</Text>
                <Text style={styles.ticketDesc}>{ticket.description}</Text>
                <Text style={styles.ticketAvail}>{ticket.quantity - ticket.sold} places restantes</Text>
              </View>
              <Text style={styles.ticketPrice}>{ticket.price.toLocaleString()} FCFA</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      {selectedTicket && (
        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Quantité</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Text style={styles.qtyButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity(quantity + 1)}>
              <Text style={styles.qtyButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.total}>Total: {(selectedTicket.price * quantity).toLocaleString()} FCFA</Text>
        </View>
      )}
      <TouchableOpacity style={styles.buyButton} onPress={handleBuyTicket}>
        <Text style={styles.buyButtonText}>🎟️ Acheter les billets</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingTop: 48, backgroundColor: '#fff' },
  backButton: { padding: 8 },
  backText: { color: '#6C47FF', fontSize: 16 },
  eventInfo: { backgroundColor: '#fff', padding: 24, marginBottom: 12 },
  category: { color: '#6C47FF', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  description: { color: '#666', lineHeight: 22, marginBottom: 16 },
  infoRow: { marginBottom: 8 },
  infoText: { color: '#444', fontSize: 15 },
  ticketsSection: { backgroundColor: '#fff', padding: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  noTickets: { color: '#666' },
  ticketCard: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketSelected: { borderColor: '#6C47FF', backgroundColor: '#EEE9FF' },
  ticketInfo: { flex: 1 },
  ticketName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  ticketDesc: { color: '#666', fontSize: 13, marginTop: 4 },
  ticketAvail: { color: '#22c55e', fontSize: 12, marginTop: 4 },
  ticketPrice: { fontSize: 16, fontWeight: 'bold', color: '#6C47FF' },
  quantitySection: { backgroundColor: '#fff', padding: 24, marginBottom: 12 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  qtyButton: { backgroundColor: '#6C47FF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  qtyButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  qtyText: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 24 },
  total: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  buyButton: { backgroundColor: '#6C47FF', margin: 24, padding: 18, borderRadius: 16, alignItems: 'center' },
  buyButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});