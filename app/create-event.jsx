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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';

const CATEGORIES = ['Concert', 'Conférence', 'Sport', 'Festival', 'Théâtre', 'Autre'];

const DEFAULT_TICKETS = [
  { name: 'Standard', price: '', quantity: '' },
  { name: 'VIP', price: '', quantity: '' },
  { name: 'VVIP', price: '', quantity: '' },
];

export default function CreateEventScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('Concert');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [tickets, setTickets] = useState(DEFAULT_TICKETS);

  function updateTicket(index, field, value) {
    const updated = [...tickets];
    updated[index] = { ...updated[index], [field]: value };
    setTickets(updated);
  }

  function addTicket() {
    setTickets([...tickets, { name: '', price: '', quantity: '' }]);
  }

  function removeTicket(index) {
    if (tickets.length <= 1) return;
    setTickets(tickets.filter((_, i) => i !== index));
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Autorise l'accès à ta galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  }

  async function uploadImage(userId) {
    if (!image) return null;
    setImageUploading(true);
    try {
      const fileExt = image.uri.split('.').pop().toLowerCase().replace('jpg', 'jpeg');
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const response = await fetch(image.uri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const { error } = await supabase.storage
        .from('events')
        .upload(filePath, uint8Array, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erreur upload image:', error);
      return null;
    } finally {
      setImageUploading(false);
    }
  }

  async function handleCreateEvent() {
    if (!title || !location || !date || !time) {
      Alert.alert('Erreur', 'Remplis tous les champs obligatoires');
      return;
    }

    const validTickets = tickets.filter(t => t.name && t.price && t.quantity);
    if (validTickets.length === 0) {
      Alert.alert('Erreur', 'Ajoute au moins un type de billet avec nom, prix et quantité');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Tu dois être connecté');

      const fullDate = `${date}T${time}:00`;
      const coverUrl = await uploadImage(user.id);

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
          cover_url: coverUrl,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      const ticketInserts = validTickets.map(t => ({
        event_id: event.id,
        name: t.name,
        price: parseInt(t.price, 10),
        quantity: parseInt(t.quantity, 10),
        sold: 0,
      }));

      const { error: ticketError } = await supabase
        .from('ticket_types')
        .insert(ticketInserts);

      if (ticketError) throw ticketError;

      Alert.alert('Succès', 'Événement créé ! En attente de validation.', [
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
        <Text style={styles.label}>Photo de l'événement</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📸</Text>
              <Text style={styles.imagePlaceholderText}>Appuyer pour choisir une photo</Text>
              <Text style={styles.imagePlaceholderSub}>Format recommandé : 16/9</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Titre *</Text>
        <TextInput style={styles.input} placeholder="Ex: Concert de DIDI B" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Décris ton événement..." value={description} onChangeText={setDescription} multiline />

        <Text style={styles.label}>Lieu *</Text>
        <TextInput style={styles.input} placeholder="Ex: Canal Olympia Cotonou" value={location} onChangeText={setLocation} />

        <Text style={styles.label}>Date * (AAAA-MM-JJ)</Text>
        <TextInput style={styles.input} placeholder="Ex: 2026-12-31" value={date} onChangeText={setDate} />

        <Text style={styles.label}>Heure * (HH:MM)</Text>
        <TextInput style={styles.input} placeholder="Ex: 20:00" value={time} onChangeText={setTime} />

        <Text style={styles.label}>Catégorie</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, category === cat && styles.categoryActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Types de billets</Text>

        {tickets.map((ticket, index) => (
          <View key={index} style={styles.ticketBlock}>
            <View style={styles.ticketBlockHeader}>
              <Text style={styles.ticketBlockTitle}>Billet {index + 1}</Text>
              {tickets.length > 1 && (
                <TouchableOpacity onPress={() => removeTicket(index)}>
                  <Text style={styles.removeTicket}>✕ Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nom (Ex: Standard, VIP, VVIP)"
              value={ticket.name}
              onChangeText={(v) => updateTicket(index, 'name', v)}
            />
            <View style={styles.ticketRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Prix (FCFA)"
                value={ticket.price}
                onChangeText={(v) => updateTicket(index, 'price', v)}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Quantité"
                value={ticket.quantity}
                onChangeText={(v) => updateTicket(index, 'quantity', v)}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addTicketButton} onPress={addTicket}>
          <Text style={styles.addTicketText}>+ Ajouter un type de billet</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, (loading || imageUploading) && styles.submitButtonDisabled]}
        onPress={handleCreateEvent}
        disabled={loading || imageUploading}
      >
        {loading || imageUploading ? (
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
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 8 },
  textArea: { height: 90, textAlignVertical: 'top' },
  imagePicker: { borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  imagePlaceholder: {
    width: '100%', height: 180, borderRadius: 12,
    borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9',
  },
  imagePlaceholderIcon: { fontSize: 40, marginBottom: 8 },
  imagePlaceholderText: { color: '#666', fontWeight: '600' },
  imagePlaceholderSub: { color: '#999', fontSize: 12, marginTop: 4 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  categoryButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  categoryActive: { backgroundColor: '#6C47FF', borderColor: '#6C47FF' },
  categoryText: { color: '#666', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  ticketBlock: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16, marginBottom: 12 },
  ticketBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ticketBlockTitle: { fontWeight: 'bold', color: '#1a1a1a', fontSize: 15 },
  removeTicket: { color: '#ef4444', fontSize: 13 },
  ticketRow: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  addTicketButton: { borderWidth: 1, borderColor: '#6C47FF', borderStyle: 'dashed', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  addTicketText: { color: '#6C47FF', fontWeight: '600' },
  submitButton: { backgroundColor: '#6C47FF', margin: 24, padding: 18, borderRadius: 16, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#999' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});