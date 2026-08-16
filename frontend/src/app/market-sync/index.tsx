// src/app/market-sync/index.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../services/api';

interface InventoryItem {
  id: number;
  item_name: string;
  quantity: number;
  unit_price_cents: number;
}

export default function MarketSyncScreen() {
  const [stock, setStock] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function fetchInventory() {
        try {
          // Request inventory data with your computer's configured IPv4 address bridge
          const response = await api.get(`/api/market/inventory?farm_id=101&nocache=${Date.now()}`);
          if (response?.success) {
            setStock(response.data);
          }
        } catch (err) {
          console.log('Operating offline. Loading cached inventory states.');
        } finally {
          setIsLoading(false);
        }
      }
      fetchInventory();
      return () => setIsLoading(true);
    }, [])
  );

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#311B92" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Warehouse Stock & Valuation</Text>
      <FlatList
        data={stock}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.stockCard}>
            <View style={styles.cardRow}>
              <Text style={styles.stockTitle}>📣 {item.item_name}</Text>
              <Text style={styles.quantityBadge}>{item.quantity} In Stock</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.valuationText}>
              Unit Price: ${(item.unit_price_cents / 100).toFixed(2)}  •  Total Value: ${(item.quantity * item.unit_price_cents / 100).toFixed(2)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No inventory rows found in edge database.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#444444', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  stockCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockTitle: { fontWeight: 'bold', fontSize: 16, color: '#212121' },
  quantityBadge: { fontSize: 12, color: '#311B92', backgroundColor: '#EDE7F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: '700', overflow: 'hidden' },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 10 },
  valuationText: { fontSize: 13, color: '#666666', fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#999999', marginTop: 20, fontSize: 13 }
});
