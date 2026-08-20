// frontend/src/app/hive-mind/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { apiService } from '../../services/api';
import { useFarmSync } from '../../hooks/useFarmSync';

interface HiveLog {
  id: number;
  farm_id: number;
  designation: string;
  honey_super_count: number;
  condition: string; // 'healthy', 'swarming risk', 'weak', 'treated'
  last_inspected: string;
  management_plan?: string;
}

export default function HiveMindIndex() {
  const { logFarmActivity } = useFarmSync();
  const [hives, setHives] = useState<HiveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('');

  // Track clicked/selected hive layout panels
  const [expandedHiveId, setExpandedHiveId] = useState<number | null>(null);

  // Form input field tracking states
  const [designation, setDesignation] = useState('');
  const [condition, setCondition] = useState('healthy');
  const [managementPlan, setManagementPlan] = useState('');
  
  const TEST_FARM_ID = 101;

  useEffect(() => {
    fetchHiveLogs();
  }, []);

  const fetchHiveLogs = async () => {
    setLoading(true);
    const response = await apiService.request(`/api/hive/logs?farm_id=${TEST_FARM_ID}`, 'GET');
    if (response.success && response.data) {
      setHives(response.data);
    }
    setLoading(false);
  };

  const handleLogInspection = async () => {
    if (!designation.trim()) return;
    setSyncStatus('Transmitting inspection logs...');
    const todayStr = new Date().toISOString().split('T')[0];

    const payload = {
      farm_id: TEST_FARM_ID,
      designation: designation.trim(),
      condition: condition.trim(),
      last_inspected: todayStr
    };

    const res = await logFarmActivity('/api/hive/inspect', payload);
    if (res?.success) {
      setSyncStatus(`✅ Inspection record logged successfully for ${designation.trim()}!`);
      setDesignation('');
      fetchHiveLogs();
    }
  };

  const handleUpdateCondition = async (hiveId: number, nextCondition: string) => {
    setSyncStatus(`Updating hive to ${nextCondition}...`);
    const res = await apiService.request('/api/hive/update-condition', 'POST', { hive_id: hiveId, condition: nextCondition, farm_id: TEST_FARM_ID });
    if (res.success) {
      setSyncStatus('✅ Apiary adjustments saved to cloud ledger!');
      fetchHiveLogs();
    }
  };

  const handleRemoveHive = async (hiveId: number) => {
    Alert.alert("Retire Hive", "Are you sure you want to remove this hive registry entry from your yard?", [
      { text: "Cancel", style: "cancel" },
      { text: "Retire", style: "destructive", onPress: async () => {
          setSyncStatus('Purging hive row...');
          const res = await apiService.request('/api/hive/remove', 'POST', { hive_id: hiveId, farm_id: TEST_FARM_ID });
          if (res.success) {
            setSyncStatus('✅ Hive cleared from registry.');
            fetchHiveLogs();
          }
        }
      }
    ]);
  };

  const getConditionColor = (cond: string) => {
    switch (cond.toLowerCase()) {
      case 'healthy': return '#2E7D32';
      case 'swarming risk': return '#E65100';
      default: return '#D32F2F';
    }
  };

  return (
    <FlatList
      style={styles.container}
      data={hives}
      keyExtractor={(item) => item?.id ? item.id.toString() : Math.random().toString()}
      ListHeaderComponent={
        <>
          <View style={styles.headerBlock}>
            <Text style={styles.titleHeader}>🐝 Hive Mind Apiary Hub</Text>
            <Text style={styles.subtitleHeader}>Click on any hive card to view management plans or adjust statuses</Text>
          </View>
          {syncStatus ? (
            <View style={styles.statusBox}><Text style={styles.statusText}>{syncStatus}</Text></View>
          ) : null}
          <Text style={styles.sectionLabel}>Active Colony Status Summary</Text>
        </>
      }
      renderItem={({ item }) => {
        const isExpanded = expandedHiveId === item.id;
        const colorCode = getConditionColor(item.condition);

        return (
          <View style={[styles.hiveCard, isExpanded && { borderColor: '#37474F', borderWidth: 1.5 }]}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => setExpandedHiveId(isExpanded ? null : item.id)}
              style={styles.cardHeaderPressable}
            >
              <View>
                <Text style={styles.hiveTitle}>{item.designation}</Text>
                <Text style={styles.hiveMeta}>Supers: {item.honey_super_count} • Checked: {item.last_inspected}</Text>
              </View>
              <Text style={[styles.conditionText, { color: colorCode }]}>{item.condition}</Text>
            </TouchableOpacity>

            {/* 📋 EXPANDED APIARY DIAGNOSTIC DRAWER */}
            {isExpanded && (
              <View style={styles.detailsDrawer}>
                <Text style={styles.drawerSectionTitle}>🍯 Colony Health Diagnostic</Text>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>🚨 Condition Mitigation Action Plan:</Text>
                  <Text style={styles.detailValue}>
                    {item.condition === 'swarming risk' ? 'Clear queen cells. Split colony or add deep brood box immediately.' : 'Colony processing within stable parameters.'}
                  </Text>
                </View>

                <Text style={styles.drawerSectionTitle}>⚙️ Colony Adjustments</Text>
                <View style={styles.actionButtonGroup}>
                  {item.condition !== 'healthy' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]} onPress={() => handleUpdateCondition(item.id, 'healthy')}>
                      <Text style={styles.actionBtnText}>Set Healthy</Text>
                    </TouchableOpacity>
                  )}
                  {item.condition !== 'swarming risk' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]} onPress={() => handleUpdateCondition(item.id, 'swarming risk')}>
                      <Text style={styles.actionBtnText}>Set Swarming</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => handleRemoveHive(item.id)}>
                    <Text style={styles.actionBtnText}>Retire Hive</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      }}
      ListFooterComponent={
        <View style={styles.formContainer}>
          <Text style={styles.sectionLabel}>Record Colony Inspection Audit</Text>
          <TextInput style={styles.inputField} placeholder="Hive Designation Tag (e.g. Hive Gamma)" value={designation} onChangeText={setDesignation} />
          <TextInput style={styles.inputField} placeholder="Colony Condition (healthy, weak, swarming risk)" value={condition} onChangeText={setCondition} />
          <TouchableOpacity style={styles.submitButton} onPress={handleLogInspection}>
            <Text style={styles.submitText}>Commit Inspection Record</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  headerBlock: { backgroundColor: '#ECEFF1', padding: 20, borderBottomWidth: 1, borderBottomColor: '#CFD8DC' },
  titleHeader: { fontSize: 18, fontWeight: 'bold', color: '#37474F' },
  subtitleHeader: { fontSize: 13, color: '#455A64', marginTop: 4 },
  statusBox: { margin: 16, padding: 12, backgroundColor: '#ECEFF1', borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#37474F', textAlign: 'center' },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#37474F', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
  hiveCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', elevation: 1 },
  cardHeaderPressable: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hiveTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  hiveMeta: { fontSize: 12, color: '#616161', marginTop: 4 },
  conditionText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  detailsDrawer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  drawerSectionTitle: { fontSize: 11, fontWeight: '700', color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailBox: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  detailLabel: { fontSize: 11, fontWeight: '600', color: '#718096', marginBottom: 2 },
  detailValue: { fontSize: 13, color: '#2D3748', fontWeight: '500' },
  actionButtonGroup: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center' },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: '#2D3748' },
  formContainer: { padding: 16, marginTop: 10, paddingBottom: 40 },
  inputField: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  submitButton: { backgroundColor: '#37474F', padding: 16, borderRadius: 8, alignItems: 'center', elevation: 2 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }
});
