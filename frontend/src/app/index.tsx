// src/app/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSubscription } from '../context/SubscriptionContext';

interface AppCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  moduleKey: 'coop_manager' | 'crop_cycle' | 'hive_mind' | 'farm_finance' | 'market_sync';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { activeModules, hasAccess } = useSubscription();

  const platformApps: AppCardProps[] = [
    { id: '1', title: 'Coop Manager', description: 'Poultry & flock egg ledger', icon: '🐔', route: '/coop-manager', moduleKey: 'coop_manager' },
    { id: '2', title: 'Crop Cycle', description: 'Row mapping & harvest tracking', icon: '🌿', route: '/crop-cycle', moduleKey: 'crop_cycle' },
    { id: '3', title: 'Hive Mind', description: 'Apothecary & apiary logs', icon: '🐝', route: '/hive-mind', moduleKey: 'hive_mind' },
    { id: '4', title: 'Farm Finance', description: 'Cents financial ROI calculator', icon: '💰', route: '/finance/expenses', moduleKey: 'farm_finance' },
    { id: '5', title: 'Market Sync', description: 'Live inventory ledger tools', icon: '📣', route: '/market-sync', moduleKey: 'market_sync' },
  ] as any;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER BAR */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Vidal Agribusiness SaaS</Text>
          <Text style={styles.headerTitle}>AgriLedger Hub</Text>
        </View>

        {/* SUBSCRIPTION SUMMARY STATUS BADGE */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            🔒 Standalone Licensing Active ({activeModules.length}/5 Unlocked)
          </Text>
        </View>

        {/* MODULAR HUB GRID LAUNCHER */}
        <View style={styles.grid}>
          {platformApps.map((item) => {
            const unlocked = hasAccess(item.moduleKey);

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, !unlocked && styles.cardLocked]}
                onPress={() => {
                  // Route guard matches subdirectory names cleanly
                  router.push(item.route as any);
                }}
                activeOpacity={unlocked ? 0.7 : 0.4}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>{item.icon}</Text>
                  {!unlocked && <Text style={styles.lockBadge}>🔒 Locked</Text>}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  statusText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardLocked: {
    backgroundColor: '#F9F9F9',
    borderColor: '#EEEEEE',
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 28,
  },
  lockBadge: {
    fontSize: 10,
    color: '#D32F2F',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
});
