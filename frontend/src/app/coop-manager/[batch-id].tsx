// src/app/coop-manager/[batch-id].tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function BatchDetailScreen() {
  // Pull the dynamic route parameter parameter from the path selection
  const { 'batch-id': batchId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🐔 Flock Batch #{batchId}</Text>
        <Text style={styles.subtitle}>Production Statistics Ledger</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.infoText}>
          Detailed metrics for this flock batch are stored in your local edge data synchronization engine.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#444444',
    textAlign: 'center',
    lineHeight: 22,
  },
});
