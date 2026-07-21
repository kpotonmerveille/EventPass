import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';

const CATEGORIES = ['Concert', 'Conférence', 'Sport', 'Festival', 'Théâtre', 'Autre'];

export default function CreateEventScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('Concert');
  const [loading, setLoading] = useState(false);

  // Types de billets
  const [ticketName, setTicketName] = useState('Standard');
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState('');

  async function handleCreateEvent() {
    if (!title || !location || !date || !time || !ticketPrice || !ticketQuantity) {
      Alert.alert('Erreur', 'Remplis tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Tu dois être connecté');

      // Construire la date complète (format attendu: YYYY-MM-DD et HH:MM)
      const fullDate = `${date}T${time}:00`;

      // 1. Créer l'événement
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          organizer_id: user.id,
          title,
          description,
          location,
          date: fullDate,
          category,
          status: 'draft',
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // 2. Créer le type de billet associé
      const { error: ticketError } = await supabase
        .from('ticket_types')
        .insert({
          event_id: event.id,
          name: ticketName,
          price: parseInt(ticketPrice, 10),
          quantity: parseInt(ticketQuantity, 10),
          sold: 0,
        });

      if (ticketError) throw ticketError;

      Alert.alert('Succès', 'Événement créé avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Créer un événement</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Titre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Concert de DIDI B"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Décris ton événement..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Lieu *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Canal Olympia Cotonou"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Date * (AAAA-MM-JJ)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 2026-12-31"
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.label}>Heure * (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 20:00"
          value={time}
          onChangeText={setTime}
        />

        <Text style={styles.label}>Catégorie</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, category === cat && styles.categoryActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Type de billet</Text>

        <Text style={styles.label}>Nom du billet</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Standard, VIP..."
          value={ticketName}
          onChangeText={setTicketName}
        />

        <Text style={styles.label}>Prix (FCFA) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 5000"
          value={ticketPrice}
          onChangeText={setTicketPrice}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Quantité disponible *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 100"
          value={ticketQuantity}
          onChangeText={setTicketQuantity}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleCreateEvent}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Publier l'événement</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#fff', padding: 24, paddingTop: 48 },
  backButton: { marginBottom: 8 },
  backText: { color: '#6C47FF', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  section: { backgroundColor: '#fff', padding: 24, marginTop: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  label: { color: '#444', fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { height: 90, textAlignVertical: 'top' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  categoryButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  categoryActive: { backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  categoryText: { color: '#666', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  submitButton: { backgroundColor: '#6C47FF', margin: 24, padding: 18, borderRadius: 16, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#999' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});