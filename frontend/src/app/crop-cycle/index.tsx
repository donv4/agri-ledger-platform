// src/app/crop-cycle/index.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Button, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useFarmSync } from '../../hooks/useFarmSync';

interface CropRow {
  id: number;
  farm_id: number;
  crop_type: string;
  planting_date: string;
  harvest_status: 'planted' | 'growing' | 'harvesting' | 'completed';
}

export default function CropCycleScreen() {
  const router = useRouter();
  const { logFarmActivity } = useFarmSync();

  const [crops, setCrops] = useState<CropRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cropType, setCropType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // useFocusEffect pulls fresh crop fields every time this panel becomes active
  useFocusEffect(
    useCallback(() => {
      async function fetchCrops() {
        try {
          const response = await api.get(`/api/crop/rows?farm_id=101&nocache=${Date.now()}`);
          if (response?.success) {
            setCrops(response.data);
          }
        } catch (err) {
          console.log('Operating offline. Displaying local workspace states.');
        } finally {
          setIsLoading(false);
        }
      }
      fetchCrops();
      return () => setIsLoading(true);
    }, [])
  );

  const handlePlantCrop = async () => {
    if (!cropType) return Alert.alert('Validation Error', 'Please type a crop or plant variety.');

    setIsSubmitting(true);
    const payload = {
      farm_id: 101,
      crop_type: cropType,
      planting_date: new Date().toISOString().split('T')[0],
      harvest_status: 'planted'
    };

    const result = await logFarmActivity('/api/crop/plant?farm_id=101', payload);
    setIsSubmitting(false);

    if (result?.success) {
      setCropType('');
      if (result.offline) {
        Alert.alert('📴 Stored Locally', 'Planting operation queued to local device cache storage framework.');
      } else {
        Alert.alert('✅ Cloud Sync Success', 'New field cultivation entry written to cloud edge database layout.');
        // Fast local state update for snappy performance responses
        setCrops(prev => [...prev, { id: Date.now(), ...payload } as any]);
      }
    } else {
      Alert.alert('❌ Action Blocked', result?.error || 'Database interaction error.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 🌿 NEW CROP FIELD PLANTING FORM */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>🌱 Log New Field Cultivation</Text>
        <TextInput
          style={styles.input}
          placeholder="Crop Type (e.g. Honeycrisp Apples, Sweet Corn)"
          value={cropType}
          onChangeText={setCropType}
        />
        <Button
          title={isSubmitting ? "Logging Row..." : "Record New Planting"}
          color="#2E7D32"
          onPress={handlePlantCrop}
        />
      </View>

      <Text style={styles.sectionTitle}>Field Row Status Ledger</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color="#2E7D32" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={crops}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.cropCard}>
              <View style={styles.cardRow}>
                <Text style={styles.cropTitle}>🌿 {item.crop_type}</Text>
                <Text style={[styles.statusBadge, styles[item.harvest_status]]}>
                  {item.harvest_status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.metricText}>Row ID: #{item.id}  •  Planted: {item.planting_date}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No field cultivation rows logged.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E0E0E0' },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#CCCCCC', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#FAFAFA' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#444444', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  cropCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cropTitle: { fontWeight: 'bold', fontSize: 16, color: '#212121' },
  statusBadge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  planted: { backgroundColor: '#E3F2FD', color: '#0D47A1' },
  growing: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  harvesting: { backgroundColor: '#FFF3E0', color: '#E65100' },
  completed: { backgroundColor: '#ECEFF1', color: '#37474F' },
  metricText: { fontSize: 13, color: '#666666' },
  emptyText: { textAlign: 'center', color: '#999999', marginTop: 20, fontSize: 13 }
} as any);
