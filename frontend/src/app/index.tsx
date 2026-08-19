import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import ExpoConstants from 'expo-constants';
import { useRouter, Redirect } from 'expo-router';

// Get screen width for responsive grid card calculations
const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2; // Clean 2-column layout with standard spacing

export default function EntryDashboard() {
  const router = useRouter();
  
  // Extract variant from our app.config.js configuration matrix
  const appVariant = ExpoConstants.expoConfig?.extra?.APP_VARIANT || 'platform';

  // 🚀 AUTOMATIC REDIRECTION BYPASS: If standalone, jump straight past the landing deck
  if (appVariant === 'coop') return <Redirect href="/coop-manager" />;
  if (appVariant === 'crops') return <Redirect href="/crop-cycle" />;
  if (appVariant === 'finance') return <Redirect href="/finance" />;
  if (appVariant === 'hive') return <Redirect href="/hive-mind" />;

  // 🎨 MASTER ALL-IN-ONE BUNDLE DECK UI (For 'platform' variant)
  const modules = [
    { id: 'coop', name: 'CoopManager', icon: '🐔', path: '/coop-manager', color: '#E65100' },
    { id: 'crops', name: 'CropCycle', icon: '🌿', path: '/crop-cycle', color: '#2E7D32' },
    { id: 'finance', name: 'Farm Finance', icon: '💰', path: '/finance', color: '#1B5E20' },
    { id: 'hive', name: 'Hive Mind', icon: '🐝', path: '/hive-mind', color: '#37474F' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerBlock}>
        <Text style={styles.mainTitle}>AgriLedger Platform</Text>
        <Text style={styles.subtitle}>VibezLabs Enterprise Ecosystem</Text>
      </View>

      <Text style={styles.sectionLabel}>Active Farm Enterprise Modules</Text>

      <View style={styles.grid}>
        {modules.map((mod) => (
          <TouchableOpacity
            key={mod.id}
            style={[styles.card, { borderColor: mod.color }]}
            activeOpacity={0.7}
            onPress={() => router.push(mod.path as any)}
          >
            <Text style={styles.cardIcon}>{mod.icon}</Text>
            <Text style={styles.cardName}>{mod.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: mod.color }]}>
              <Text style={styles.statusText}>Licensed</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
  },
  headerBlock: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    elevation: 1,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
