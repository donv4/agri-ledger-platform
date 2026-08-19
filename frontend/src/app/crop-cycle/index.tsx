// frontend/src/app/crop-cycle/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { apiService } from '../../services/api';
import { useFarmSync } from '../../hooks/useFarmSync';

interface CropRow {
  id: number;
  farm_id: number;
  crop_type: string;
  planting_date: string;
  harvest_status: string; // 'planted', 'growing', 'harvesting', 'completed'
}

export default function CropCycleIndex() {
  const { logFarmActivity } = useFarmSync();
  const [rows, setRows] = useState<CropRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('');

  // Form input tracking states
  const [cropType, setCropType] = useState('');
  const TEST_FARM_ID = 101;

  useEffect(() => {
    fetchCropRows();
  }, []);

  /**
   * 🌿 Pull live field layout configurations from Cloudflare D1
   */
  const fetchCropRows = async () => {
    setLoading(true);
    const response = await apiService.getCropRows(TEST_FARM_ID);
    
    if (response.success && response.data) {
      setRows(response.data);
    } else {
      // Fallback structural placeholder models if the remote tables are empty
      setRows([
        { id: 1, farm_id: TEST_FARM_ID, crop_type: "Roma Tomatoes", planting_date: "2026-08-01", harvest_status: "growing" },
        { id: 2, farm_id: TEST_FARM_ID, crop_type: "Sweet Corn", planting_date: "2026-08-10", harvest_status: "planted" }
      ]);
    }
    setLoading(false);
  };

  /**
   * 🌱 Log a brand-new crop row event through the secure network cache queue
   */
  const handlePlantRow = async () => {
    if (!cropType.trim()) return;

    setSyncStatus('Registering crop row on the edge...');
    const todayStr = new Date().toISOString().split('T')[0];

    const payload = {
      farm_id: TEST_FARM_ID,
      crop_type: cropType.trim(),
      planting_date: todayStr,
      harvest_status: 'planted'
    };

    // Route request through our 3s network guard hook engine
    const res = await logFarmActivity('/api/crop/plant', payload);

    if (res?.offline) {
      setSyncStatus('⚠️ Offline Guard Activated: Row saved to device hardware storage.');
    } else if (res?.success) {
      setSyncStatus('✅ New crop row logged successfully to the cloud!');
      setCropType('');
      fetchCropRows(); // Refresh tracking logs dynamically
    } else {
      setSyncStatus(`❌ Refused: ${res?.error || 'Unknown network error'}`);
    }
  };

  /**
   * 🎨 Visual anchor badge selector based on growth status parameters
   */
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'planted': return { bg: '#E8F5E9', text: '#2E7D32', label: 'Planted' };
      case 'growing': return { bg: '#E3F2FD', text: '#1565C0', label: 'Growing' };
      case 'harvesting': return { bg: '#FFF3E0', text: '#E65100', label: 'Harvesting' };
      default: return { bg: '#ECEFF1', text: '#37474F', label: 'Completed' };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading Field Maps...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={rows}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={
        <>
          <View style={styles.headerBlock}>
            <Text style={styles.titleHeader}>🌿 CropCycle Field Manager</Text>
            <Text style={styles.subtitleHeader}>Multi-Tenant Row Calibration Control</Text>
          </View>

          {syncStatus ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{syncStatus}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Active Cultivation Rows</Text>
        </>
      }
      renderItem={({ item }) => {
        const statusConfig = getStatusStyle(item.harvest_status);
        return (
          <View style={styles.rowCard}>
            <View>
              <Text style={styles.cropTitle}>{item.crop_type}</Text>
              <Text style={styles.plantDate}>Planted on: {item.planting_date}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusTextLabel, { color: statusConfig.text }]}>{statusConfig.label}</Text>
            </View>
          </View>
        );
      }}
      ListFooterComponent={
        <View style={styles.formContainer}>
          <Text style={styles.sectionLabel}>Sculpt & Plant New Row</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Crop Variety Name (e.g. Habanero Peppers)"
            value={cropType}
            onChangeText={setCropType}
          />
          <TouchableOpacity 
            style={[styles.submitButton, !cropType.trim() && styles.disabledButton]}
            disabled={!cropType.trim()}
            onPress={handlePlantRow}
          >
            <Text style={styles.submitText}>Log Row Planting</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#2E7D32', fontWeight: '500' },
  headerBlock: { backgroundColor: '#E8F5E9', padding: 20, borderBottomWidth: 1, borderBottomColor: '#C8E6C9' },
  titleHeader: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32' },
  subtitleHeader: { fontSize: 13, color: '#2E7D32', opacity: 0.8, marginTop: 2 },
  statusBox: { margin: 16, padding: 12, backgroundColor: '#ECEFF1', borderRadius: 8, borderWidth: 1, borderColor: '#CFD8DC' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#37474F', textAlign: 'center' },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#2E7D32', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
  rowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', elevation: 1 },
  cropTitle: { fontSize: 15, fontWeight: 'bold', color: '#212121' },
  plantDate: { fontSize: 12, color: '#757575', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusTextLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  formContainer: { padding: 16, marginTop: 10, paddingBottom: 40 },
  inputField: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  submitButton: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 8, alignItems: 'center', elevation: 2 },
  disabledButton: { backgroundColor: '#BDBDBD', elevation: 0 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }
});
