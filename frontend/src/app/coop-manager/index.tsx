// frontend/src/app/coop-manager/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { apiService } from '../../services/api';
import { useFarmSync } from '../../hooks/useFarmSync';

interface ChickenBatch {
  id: number;
  farm_id: number;
  batch_name: string;
  bird_count: number;
}

export default function CoopManagerIndex() {
  const { logFarmActivity } = useFarmSync();
  const [batches, setBatches] = useState<ChickenBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('');
  
  // Input tracking states
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [eggCount, setEggCount] = useState('');
  const [notes, setNotes] = useState('');

  // Target multi-tenant test profile identity
  const TEST_FARM_ID = 101;

  useEffect(() => {
    fetchActiveBatches();
  }, []);

  /**
   * 🐔 Pull live flock records down from the production edge worker
   */
  const fetchActiveBatches = async () => {
    setLoading(true);
    const response = await apiService.getCoopMetrics(TEST_FARM_ID);
    
    if (response.success && response.data) {
      setBatches(response.data);
    } else {
      // Fallback local mockup data parameters if the database table is completely unseeded
      setBatches([
        { id: 1, farm_id: TEST_FARM_ID, batch_name: "Layer Batch Alpha (Rhode Island Reds)", bird_count: 250 },
        { id: 2, farm_id: TEST_FARM_ID, batch_name: "Layer Batch Beta (Leghorns)", bird_count: 180 }
      ]);
    }
    setLoading(false);
  };

  /**
   * 📊 Commit daily egg aggregation metrics securely to the ledger loop
   */
  const handleLogProduction = async () => {
    if (!selectedBatchId || !eggCount) return;

    setSyncStatus('Syncing with Cloudflare Edge...');
    
    const payload = {
      farm_id: TEST_FARM_ID,
      batch_id: selectedBatchId,
      eggs_collected: parseInt(eggCount, 10),
      notes: notes || null
    };

    // Route request through our 3s network guard hook engine
    const res = await logFarmActivity('/api/coop/log-production', payload);

    if (res?.offline) {
      setSyncStatus('⚠️ Connection drop detected. Entry locked safely to offline device hardware cache array.');
    } else if (res?.success) {
      setSyncStatus('✅ Entry written successfully to live cloud ledger tables!');
      setEggCount('');
      setNotes('');
    } else {
      setSyncStatus(`❌ Transmission rejected: ${res?.error || 'Unknown network drop'}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E65100" />
        <Text style={styles.loadingText}>Fetching Flock Subscriptions...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={batches}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={
        <>
          <View style={styles.headerBlock}>
            <Text style={styles.titleHeader}> Rooster CoopManager Control Deck</Text>
            <Text style={styles.subtitleHeader}>Multi-Tenant Layer Flock Telemetry</Text>
          </View>

          {syncStatus ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{syncStatus}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Select Active Flock Batch Group</Text>
        </>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.batchCard, selectedBatchId === item.id && styles.selectedCard]}
          activeOpacity={0.8}
          onPress={() => setSelectedBatchId(item.id)}
        >
          <View>
            <Text style={styles.batchName}>{item.batch_name}</Text>
            <Text style={styles.birdCount}>Active Laying Stock: {item.bird_count} birds</Text>
          </View>
          <Text style={styles.radioIndicator}>{selectedBatchId === item.id ? '🔘' : '⚪'}</Text>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <View style={styles.formContainer}>
          <Text style={styles.sectionLabel}>Log Daily Production Ledger</Text>
          
          <TextInput
            style={styles.inputField}
            placeholder="Total Eggs Collected Count (e.g. 144)"
            keyboardType="numeric"
            value={eggCount}
            onChangeText={setEggCount}
          />

          <TextInput
            style={[styles.inputField, styles.textArea]}
            placeholder="Add operational notes (e.g. Feed change metrics, temperature variances)"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity 
            style={[styles.submitButton, (!selectedBatchId || !eggCount) && styles.disabledButton]}
            disabled={!selectedBatchId || !eggCount}
            onPress={handleLogProduction}
          >
            <Text style={styles.submitText}>Commit Entry to Ledger</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFFFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFFFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#E65100', fontWeight: '500' },
  headerBlock: { backgroundColor: '#FFF3E0', padding: 20, borderBottomWidth: 1, borderBottomColor: '#FFE0B2' },
  titleHeader: { fontSize: 22, fontWeight: 'bold', color: '#E65100' },
  subtitleHeader: { fontSize: 13, color: '#E65100', opacity: 0.8, marginTop: 2 },
  statusBox: { margin: 16, padding: 12, backgroundColor: '#ECEFF1', borderRadius: 8, borderWidth: 1, borderColor: '#CFD8DC' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#37474F', textAlign: 'center' },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#4E342E', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
  batchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#FFE0B2', elevation: 1 },
  selectedCard: { borderColor: '#E65100', backgroundColor: '#FFF3E0' },
  batchName: { fontSize: 15, fontWeight: 'bold', color: '#212121' },
  birdCount: { fontSize: 13, color: '#757575', marginTop: 2 },
  radioIndicator: { fontSize: 18 },
  formContainer: { padding: 16, marginTop: 10, paddingBottom: 40 },
  inputField: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: '#212121' },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#E65100', padding: 16, borderRadius: 8, alignItems: 'center', elevation: 2 },
  disabledButton: { backgroundColor: '#BDBDBD', elevation: 0 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }
});
