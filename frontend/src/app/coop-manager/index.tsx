// src/app/coop-manager/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useFarmSync } from '../../hooks/useFarmSync';

interface ChickenBatch {
  id: number;
  farm_id: number;
  start_date: string;
  count: number;
  status: 'growing' | 'laying' | 'processed';
}

export default function CoopManagerIndex() {
  const router = useRouter();
  const { logFarmActivity, triggerBackgroundSync } = useFarmSync();
  
  const [batches, setBatches] = useState<ChickenBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form input field state handlers
  const [eggCount, setEggCount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchFlocks() {
      try {
        const flockRes = await api.get('/api/coop/batches?farm_id=101');
        if (flockRes?.success) {
          setBatches(flockRes.data);
        }
      } catch (err) {
        console.log('API offline during boot layout load. Proceeding with form rendering.');
      } finally {
        // ✅ ALWAYS terminate loading state so forms remain interactive offline
        setIsLoading(false);
      }
    }
    fetchFlocks();
  }, []);

  const handleLogEggs = async () => {
    if (!eggCount) return Alert.alert('Input Error', 'Please type an egg collection count number.');
    
    setIsSubmitting(true);
    const payload = { farm_id: 101, batch_id: 1, eggs_collected: parseInt(eggCount) };

    const result = await logFarmActivity('/api/coop/log-production', payload);
    setIsSubmitting(false);

    if (result?.success) {
      setEggCount('');
      if (result.offline) {
        Alert.alert('📴 Stored Locally', result.message);
      } else {
        Alert.alert('✅ Cloud Sync Success', 'Data safely stored in Cloudflare remote edge database.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* 🥚 SEED DATA ENTRY LOGGING FORM (Always Available) */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>🥚 Daily Production Tracker</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter eggs collected today (e.g. 50)"
          keyboardType="numeric"
          value={eggCount}
          onChangeText={setEggCount}
        />
        <Button 
          title={isSubmitting ? "Processing..." : "Log Entry"} 
          color="#1B5E20" 
          onPress={handleLogEggs} 
        />
        <TouchableOpacity 
          style={styles.syncBtn} 
          onPress={async () => { 
            await triggerBackgroundSync(); 
            Alert.alert('Sync Processed', 'Background synchronization check complete.'); 
          }}
        >
          <Text style={styles.syncBtnText}>🔄 Trigger Manual Sync Poll</Text>
        </TouchableOpacity>
      </View>

      {/* FLOCK LIST LEDGER DISPLAY */}
      <Text style={styles.sectionTitle}>Active Flock Inventory</Text>
      
      {isLoading ? (
        // ✅ The loading spinner is now restricted down to the list workspace area only!
        <View style={styles.listLoader}>
          <ActivityIndicator size="small" color="#1B5E20" />
          <Text style={styles.syncingCacheText}>Attempting live network sync...</Text>
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.flockCard} onPress={() => router.push(`/coop-manager/${item.id}`)}>
              <View style={styles.cardRow}>
                <Text style={styles.flockTitle}>🐔 Batch #{item.id}</Text>
                <Text style={[styles.statusBadge, styles.laying]}>{item.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.metricText}>Size: {item.count} Birds  •  Started: {item.start_date}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Operating offline. Cache empty.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E0E0E0' },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#CCCCCC', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#FAFAFA' },
  syncBtn: { marginTop: 12, alignSelf: 'center' },
  syncBtnText: { color: '#1565C0', fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#444444', marginBottom: 10, textTransform: 'uppercase' },
  listLoader: { padding: 20, alignItems: 'center' },
  syncingCacheText: { fontSize: 12, color: '#757575', marginTop: 8 },
  flockCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  flockTitle: { fontWeight: 'bold', fontSize: 16 },
  statusBadge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  laying: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  metricText: { fontSize: 13, color: '#666666' },
  emptyText: { textAlign: 'center', color: '#999999', marginTop: 20, fontSize: 13 }
});
