import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { colors, categoryColors, spacing, radius, typography } from '../../constants/theme';
import WhatsAppButton from '../../components/WhatsAppButton';

function AnimatedCard({ item, index, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  function handlePressIn() {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }

  const catColor = categoryColors[item.category] || categoryColors.Autre;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.cardAccent, { backgroundColor: catColor }]} />
        <View style={styles.cardBody}>
          <View style={[styles.categoryPill, { backgroundColor: catColor + '1A' }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>
              {item.category || 'Événement'}
            </Text>
          </View>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>
              {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchEvents();
    Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['published', 'live'])
        .order('date', { ascending: true });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <Text style={styles.eyebrow}>BÉNIN · ÉVÉNEMENTS</Text>
        <Text style={styles.title}>Ce qui se passe{'\n'}près de toi</Text>
      </Animated.View>

      {events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.empty}>Aucun événement pour l'instant</Text>
          <Text style={styles.emptySubtext}>Reviens un peu plus tard</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={({ item, index }) => (
            <AnimatedCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
      <WhatsAppButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.md },
  eyebrow: { ...typography.caption, color: colors.primary, letterSpacing: 1.2, marginBottom: spacing.xs },
  title: { ...typography.display, color: colors.text, lineHeight: 36 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardAccent: { width: 6 },
  cardBody: { flex: 1, padding: spacing.md },
  categoryPill: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, marginBottom: spacing.sm },
  categoryText: { ...typography.caption, fontWeight: '700' },
  eventTitle: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  metaIcon: { fontSize: 13, marginRight: 6 },
  metaText: { ...typography.body, color: colors.textSecondary, fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  empty: { ...typography.subtitle, color: colors.text },
  emptySubtext: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
});