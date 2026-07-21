import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from '../services/supabase';

export default function PaymentScreen({ route, navigation }) {
  const { event, ticketType, quantity } = route.params;
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const total = ticketType.price * quantity;

  async function handlePayment() {
    if (!phone || phone.length < 8) {
      Alert.alert('Erreur', 'Entre un numéro de téléphone valide');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const response = await fetch('https://api.fedapay.com/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer sk_live_RA-C2Ex6UOUgW1IV2lUBWxss`,
        },
        body: JSON.stringify({
          description: `EventPass - ${ticketType.name} x${quantity}`,
          amount: total,
          currency: { iso: 'XOF' },
          callback_url: 'https://eventpass.app/payment-success',
          customer: {
            firstname: profile?.full_name || 'Client',
            phone_number: { number: phone, country: 'BJ' },
            email: user.email,
          },
        }),
      });

      const data = await response.json();

      if (data['v1/transaction']) {
        const orderId = 'EP' + Date.now();
        const organizerShare = Math.round(total * 0.9);
        const platformShare = total - organizerShare;

        await supabase.from('orders').insert({
          id: orderId,
          user_id: user.id,
          ticket_type_id: ticketType.id,
          quantity,
          total_amount: total,
          payment_method: 'mobile_money',
          payment_phone: phone,
          status: 'pending',
          cinetpay_transaction_id: String(data['v1/transaction'].id),
          organizer_share: organizerShare,
          platform_share: platformShare,
        });
        Alert.alert(
          'Paiement initié !',
          `Tu vas recevoir une demande de paiement de ${total.toLocaleString()} FCFA sur le ${phone}. Confirme sur ton téléphone.`,
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      } else {
        Alert.alert('Erreur', JSON.stringify(data));
      }
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
        <Text style={styles.title}>Paiement</Text>
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Événement</Text>
          <Text style={styles.summaryValue}>{event.title}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Billet</Text>
          <Text style={styles.summaryValue}>{ticketType.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Quantité</Text>
          <Text style={styles.summaryValue}>{quantity}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.totalValue}>{total.toLocaleString()} FCFA</Text>
        </View>
      </View>
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Numéro Mobile Money</Text>
        <Text style={styles.sectionSubtitle}>Entre le numéro qui recevra la demande de paiement</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 97000000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
        />
        <Text style={styles.operatorTitle}>Opérateurs acceptés :</Text>
        <View style={styles.operators}>
          <View style={styles.operatorBadge}>
            <Text style={styles.operatorText}>📱 MTN</Text>
          </View>
          <View style={styles.operatorBadge}>
            <Text style={styles.operatorText}>📱 Moov</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>💳 Payer {total.toLocaleString()} FCFA</Text>
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
  summary: { backgroundColor: '#fff', padding: 24, marginTop: 12, marginBottom: 12 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#666', fontSize: 15 },
  summaryValue: { color: '#1a1a1a', fontWeight: '600', fontSize: 15, flex: 1, textAlign: 'right' },
  totalValue: { color: '#6C47FF', fontWeight: 'bold', fontSize: 18 },
  paymentSection: { backgroundColor: '#fff', padding: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  sectionSubtitle: { color: '#666', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 18, marginBottom: 16 },
  operatorTitle: { color: '#666', marginBottom: 8 },
  operators: { flexDirection: 'row', gap: 12 },
  operatorBadge: { backgroundColor: '#EEE9FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  operatorText: { color: '#6C47FF', fontWeight: '600' },
  payButton: { backgroundColor: '#6C47FF', margin: 24, padding: 18, borderRadius: 16, alignItems: 'center' },
  payButtonDisabled: { backgroundColor: '#999' },
  payButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});