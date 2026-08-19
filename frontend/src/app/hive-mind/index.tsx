// frontend/src/app/hive-mind/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { apiService } from '../../services/api';
import { useFarmSync } from '../../hooks/useFarmSync';

interface HiveLog {
  id: number;
  farm_id: number;
  designation: string;
  honey_super_count: number;
  condition: string; // 'healthy', 'swarming risk', 'weak', 'treated'
  last_inspected: string;
}

export default function HiveMindIndex() {
  const { logFarmActivity } = useFarmSync();
  const [hives, setHives] = useState<HiveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('');

  // Inspection Log Fields Input Tracking States
  const [designation, setDesignation] = useState('');
  const [condition, setCondition] = useState('healthy');
  
  const TEST_FARM_ID = 101;

  useEffect(() => {
    fetchHiveLogs();
  }, []);

  /**
   * 🐝 Fetch apiary conditions from Cloudflare Edge infrastructure
   */
  const fetchHiveLogs = async () => {
    setLoading(true);
    const response = await apiService.request(`/api/hive/logs?farm_id=${TEST_FARM_ID}`, 'GET');
    
    if (response.success && response.data) {
      setHives(response.data);
    } else {
      // Fallback structural mock items if remote sandbox variables are unseeded
      setHives([
        { id: 1, farm_id: TEST_FARM_ID, designation: "Hive Alpha", honey_super_count: 2, condition: "healthy", last_inspected: "2026-08-10" },
        { id: 2, farm_id: TEST_FARM_ID, designation: "Hive Beta", honey_super_count: 3, condition: "swarming risk", last_inspected: "2026-08-14" }
      ]);
    }
    setLoading(false);
  };

  /**
   * 🍯 Push hive inspection audits through the 3s Network Abort Timeout Guard
   */
  const handleLogInspection = async () => {
    if (!designation.trim()) return;

    setSyncStatus('Transmitting inspection logs...');
    
    const payload = {
      farm_id: TEST_FARM_ID,
      designation: designation.trim(),
      condition: condition
    };

    const res = await logFarmActivity('/api/hive/inspect', payload);

    if (res?.offline) {
      setSyncStatus('⚠️ Offline Mode active. Inspection records appended to storage array queue.');
    } else if (res?.success) {
      setSyncStatus('✅ Inspection record logged successfully to your Cloudflare database!');
      setDesignation('');
      fetchHiveLogs(); // Automatically re-pull live telemetry metrics rows
    } else {
      setSyncStatus(`❌ Refused: ${res?.error || 'Connection dropped'}`);
    }
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'healthy': return '#2E7D32';
      case 'swarming risk': return '#E65100';
      default: return '#D32F2F';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#37474F" />
        <Text style={styles.loadingText}>Calibrating Apiary Arrays...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={hives}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={
        <>
          <View style={styles.headerBlock}>
            <Text style={styles.titleHeader}>🐝 Hive Mind Apiary Hub</Text>
            <Text style={styles.subtitleHeader}>Multi-Tenant Queen Registry & Super Tracking</Text>
          </View>

          {syncStatus ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{syncStatus}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Active Colony Status Summary</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.hiveCard}>
          <View>
            <Text style={styles.hiveTitle}>{item.designation}</Text>
            <Text style={styles.hiveMeta}>Honey Supers Installed: {item.honey_super_count}</Text>
            <Text style={styles.hiveDate}>Last Checked: {item.last_inspected}</Text>
          </View>
          <View style={styles.statusColumn}>
            <Text style={[styles.conditionText, { color: getConditionColor(item.condition) }]}>
              {item.condition}
            </Text>
          </View>
        </View>
      )}
      ListFooterComponent={
        <View style={styles.formContainer}>
          <Text style={styles.sectionLabel}>Record Colony Inspection Audit</Text>
          
          <TextInput
            style={styles.inputField}
            placeholder="Hive Designation Tag (e.g. Hive Gamma)"
            value={designation}
            onChangeText={setDesignation}
          />

          <TextInput
            style={styles.inputField}
            placeholder="Colony Condition (e.g. healthy, weak, swarming risk)"
            value={condition}
            onChangeText={setCondition}
          />

          <TouchableOpacity 
            style={[styles.submitButton, !designation.trim() && styles.disabledButton]}
            disabled={!designation.trim()}
            onPress={handleLogInspection}
          >
            <Text style={styles.submitText}>Commit Inspection Record</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#37474F', fontWeight: '500' },
  headerBlock: { backgroundColor: '#ECEFF1', padding: 20, borderBottomWidth: 1, borderBottomColor: '#CFD8DC' },
  titleHeader: { fontSize: 20, fontWeight: 'bold', color: '#37474F' },
  subtitleHeader: { fontSize: 13, color: '#455A64', marginTop: 2 },
  statusBox: { margin: 16, padding: 12, backgroundColor: '#ECEFF1', borderRadius: 8, borderWidth: 1, borderColor: '#CFD8DC' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#37474F', textAlign: 'center' },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#37474F', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
  hiveCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', elevation: 1 },
  hiveTitle: { fontSize: 15, fontWeight: 'bold', color: '#212121' },
  hiveMeta: { fontSize: 12, color: '#616161', marginTop: 4 },
  hiveDate: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  statusColumn: { alignItems: 'flex-end' },
  conditionText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  formContainer: { padding: 16, marginTop: 10, paddingBottom: 40 },
  inputField: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  submitButton: { backgroundColor: '#37474F', padding: 16, borderRadius: 8, alignItems: 'center', elevation: 2 },
  disabledButton: { backgroundColor: '#BDBDBD', elevation: 0 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }
});
