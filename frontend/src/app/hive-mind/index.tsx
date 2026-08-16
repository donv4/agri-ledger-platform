// src/app/hive-mind/index.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Button, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../services/api';
import { useFarmSync } from '../../hooks/useFarmSync';

interface HiveLog {
  id: number;
  farm_id: number;
  designation: string;
  honey_super_count: number;
  condition: 'healthy' | 'swarming risk' | 'weak';
  last_inspected: string;
}

export default function HiveMindScreen() {
  const { logFarmActivity } = useFarmSync();

  const [hives, setHives] = useState<HiveLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hiveName, setHiveName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function fetchHives() {
        try {
          const response = await api.get(`/api/hive/logs?farm_id=101&nocache=${Date.now()}`);
          if (response?.success) {
            setHives(response.data);
          }
        } catch (err) {
          console.log('Operating offline. Loading cached apiary states.');
        } finally {
          setIsLoading(false);
        }
      }
      fetchHives();
      return () => setIsLoading(true);
    }, [])
  );

  const handleInspectHive = async () => {
    if (!hiveName) return Alert.alert('Validation Error', 'Please type a hive designation.');

    setIsSubmitting(true);
    const payload = {
      farm_id: 101,
      designation: hiveName,
      condition: 'healthy',
      date: new Date().toISOString().split('T')[0]
    };

    const result = await logFarmActivity('/api/hive/inspect?farm_id=101', payload);
    setIsSubmitting(false);

    if (result?.success) {
      setHiveName('');
      if (result.offline) {
        Alert.alert('📴 Stored Locally', 'Inspection saved to device offline storage cache queue.');
      } else {
        Alert.alert('✅ Cloud Sync Success', 'Inspection ledger successfully synced to remote database.');
        setHives(prev => [...prev, { id: Date.now(), ...payload, honey_super_count: 0, last_inspected: payload.date } as any]);
      }
    } else {
      Alert.alert('❌ Action Blocked', result?.error || 'Database interaction error.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 🍯 APIARY DATA ENTRY FORM */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>🐝 Log Hive Inspection</Text>
        <TextInput
          style={styles.input}
          placeholder="Hive Designation (e.g. Orchard Row 3, Barn Box A)"
          value={hiveName}
          onChangeText={setHiveName}
        />
        <Button
          title={isSubmitting ? "Logging Inspection..." : "Record Hive Check"}
          color="#E65100"
          onPress={handleInspectHive}
        />
      </View>

      <Text style={styles.sectionTitle}>Active Apiary Monitor</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color="#E65100" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={hives}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.hiveCard}>
              <View style={styles.cardRow}>
                <Text style={styles.hiveTitle}>🐝 {item.designation}</Text>
                <Text style={[styles.statusBadge, item.condition === 'healthy' ? styles.healthy : styles.warning]}>
                  {item.condition.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.metricText}>Honey Supers: {item.honey_super_count} Layers • Inspected: {item.last_inspected}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E0E0E0' },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#E65100', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#CCCCCC', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#FAFAFA' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#444444', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  hiveCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hiveTitle: { fontWeight: 'bold', fontSize: 16, color: '#212121' },
  statusBadge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  healthy: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  warning: { backgroundColor: '#FFF3E0', color: '#E65100' },
  metricText: { fontSize: 13, color: '#666666' }
});
