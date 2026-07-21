import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../services/supabase';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#6C47FF" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scanner de billets</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.permissionText}>
            L'accès à la caméra est nécessaire pour scanner les billets.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  async function handleBarCodeScanned({ data }) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      // Chercher le billet avec ce QR code
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*, events(title, date, location)')
        .eq('qr_code', data)
        .single();

      if (error || !ticket) {
        Alert.alert(
          '❌ Billet invalide',
          'Ce QR code ne correspond à aucun billet.',
          [{ text: 'Rescanner', onPress: () => setScanned(false) }]
        );
        return;
      }

      if (ticket.is_used) {
        Alert.alert(
          '⚠️ Billet déjà utilisé',
          `Ce billet a déjà été scanné.\n\nÉvénement: ${ticket.events?.title}\nType: ${ticket.ticket_type}`,
          [{ text: 'Rescanner', onPress: () => setScanned(false) }]
        );
        return;
      }

      // Marquer le billet comme utilisé
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      Alert.alert(
        '✅ Billet valide !',
        `Événement: ${ticket.events?.title}\nType: ${ticket.ticket_type}\nDate: ${new Date(ticket.events?.date).toLocaleDateString('fr-FR')}`,
        [{ text: 'Rescanner', onPress: () => setScanned(false) }]
      );
    } catch (error) {
      Alert.alert('Erreur', error.message, [
        { text: 'Rescanner', onPress: () => setScanned(false) }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scanner de billets</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Vérification...</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {scanned ? 'Traitement en cours...' : 'Pointez la caméra vers le QR code du billet'}
        </Text>
        {scanned && !loading && (
          <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
            <Text style={styles.rescanButtonText}>Rescanner</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { backgroundColor: '#fff', padding: 24, paddingTop: 48 },
  backButton: { marginBottom: 8 },
  backText: { color: '#6C47FF', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  scanArea: {
    width: 250, height: 250,
    borderWidth: 3, borderColor: '#6C47FF', borderRadius: 16,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 16 },
  footer: { backgroundColor: '#fff', padding: 24, alignItems: 'center' },
  footerText: { color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 12 },
  rescanButton: { backgroundColor: '#6C47FF', padding: 14, borderRadius: 12, paddingHorizontal: 32 },
  rescanButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionText: { color: '#666', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  permissionButton: { backgroundColor: '#6C47FF', padding: 16, borderRadius: 12 },
  permissionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});