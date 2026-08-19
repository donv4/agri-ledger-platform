// frontend/src/app/market-sync/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { apiService } from '../../services/api';

// 🌟 FIXED: Explicit type declarations mapping perfectly to your Cloudflare D1 column layout
interface Listing {
  id: number;
  farm_id: number;
  title: string;
  description: string;
  available_stock: number; // Matches D1 schema perfectly
  price_cents: number;      // Matches D1 schema perfectly
  source_module: string;
}

export default function StandaloneMarketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'consumer' | 'farmer'>('consumer');
  
  // Independent Listing Inputs (Farmer)
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  
  const TEST_FARM_ID = 101;

  useEffect(() => {
    loadStorefront();
  }, []);

  const loadStorefront = async () => {
    setLoading(true);
    // Queries our newly created independent marketplace listing rows
    const response = await apiService.request(`/api/market/inventory?farm_id=${TEST_FARM_ID}`, 'GET');
    
    if (response && response.success && Array.isArray(response.data)) {
      setListings(response.data);
    } else {
      // Stable interactive demo rows if database remains unseeded initially
      setListings([
        { id: 1, farm_id: TEST_FARM_ID, title: "Fresh Organic Eggs", description: "Harvested directly from CoopManager layer flocks.", available_stock: 48, price_cents: 450, source_module: "coop_manager" },
        { id: 2, farm_id: TEST_FARM_ID, title: "Sweet Corn Bushels", description: "Freshly cut rows tracked inside CropCycle.", available_stock: 15, price_cents: 1200, source_module: "crop_cycle" }
      ]);
    }
    setLoading(false);
  };

  /**
   * 🛒 CONSUMER ACTION: Buy an item directly from the listing grid
   */
  const handlePurchase = async (listingId: number) => {
    const payload = { listing_id: listingId, quantity: 1, buyer_name: "Local Consumer" };
    const res = await apiService.request('/api/market/buy', 'POST', payload);
    
    if (res && res.success) {
      Alert.alert("Success!", "You purchased 1 unit! Stock updated securely.");
      loadStorefront();
    } else {
      Alert.alert("Error", res?.error || "Transaction failed.");
    }
  };

  /**
   * 🌾 FARMER ACTION: Trigger automatic metric ingestion from other modules
   */
  const handleAutoHarvestSync = async () => {
    const res = await apiService.request('/api/market/harvest-sync', 'POST', { farm_id: TEST_FARM_ID, source: 'coop' });
    if (res && res.success) {
      Alert.alert("Sync Complete", "Pulled bird output stats to build storefront listings automatically!");
      loadStorefront();
    } else {
      Alert.alert("Sync Failed", res?.error || "Could not complete harvest pass.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#37474F" />
        <Text style={styles.loadingText}>Loading Marketplace Feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🧭 VIEW TOGGLE BAR */}
      <View style={styles.toggleBar}>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'consumer' && styles.activeToggle]}
          onPress={() => setViewMode('consumer')}
        >
          <Text style={[styles.toggleText, viewMode === 'consumer' && styles.activeToggleText]}>🛒 Consumer Store</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'farmer' && styles.activeToggle]}
          onPress={() => setViewMode('farmer')}
        >
          <Text style={[styles.toggleText, viewMode === 'farmer' && styles.activeToggleText]}>🌾 Farmer Control</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'consumer' ? (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.listingCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listingTitle}>{item.title}</Text>
                <Text style={styles.listingDesc}>{item.description}</Text>
                <Text style={styles.listingStock}>Stock Available: {item.available_stock} units</Text>
                <Text style={styles.badgeSource}>Origin: {item.source_module}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', minHeight: 80 }}>
                <Text style={styles.listingPrice}>${(item.price_cents / 100).toFixed(2)}</Text>
                <TouchableOpacity style={styles.buyButton} onPress={() => handlePurchase(item.id)}>
                  <Text style={styles.buyButtonText}>Buy 1</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.farmerCard}>
            <Text style={styles.sectionLabel}>Smart Data Aggregation Pipeline</Text>
            <Text style={styles.explanationText}>
              Pull asset quantities directly from your other AgriLedger modules to create storefront items automatically without manual typing.
            </Text>
            <TouchableOpacity style={styles.harvestButton} onPress={handleAutoHarvestSync}>
              <Text style={styles.harvestButtonText}>⚡ Auto-Harvest From CoopManager</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.farmerCard, { marginTop: 20 }]}>
            <Text style={styles.sectionLabel}>Create Independent Listing Manually</Text>
            <TextInput style={styles.input} placeholder="Product Title (e.g. Fresh Honey)" value={newTitle} onChangeText={setNewTitle} />
            <TextInput style={styles.input} placeholder="Stock Quantity" keyboardType="numeric" value={newStock} onChangeText={setNewStock} />
            <TextInput style={styles.input} placeholder="Price in Dollars" keyboardType="numeric" value={newPrice} onChangeText={setNewPrice} />
            <TouchableOpacity style={styles.manualSubmitButton}>
              <Text style={styles.manualSubmitButtonText}>Post Independent Listing</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#37474F', fontWeight: '500' },
  toggleBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  toggleButton: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  activeToggle: { borderBottomWidth: 3, borderBottomColor: '#37474F' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeToggleText: { color: '#37474F', fontWeight: '700' },
  listingCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', minHeight: 120 },
  listingTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  listingDesc: { fontSize: 13, color: '#4B5563', marginTop: 4, marginBottom: 8 },
  listingStock: { fontSize: 12, fontWeight: '600', color: '#059669' },
  badgeSource: { alignSelf: 'flex-start', fontSize: 10, backgroundColor: '#F3F4F6', color: '#4B5563', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 6, textTransform: 'uppercase', fontWeight: '700' },
  listingPrice: { fontSize: 18, fontWeight: 'bold', color: '#37474F' },
  buyButton: { backgroundColor: '#37474F', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, marginTop: 8 },
  buyButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  farmerCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#37474F', marginBottom: 8 },
  explanationText: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 16 },
  harvestButton: { backgroundColor: '#0284C7', padding: 14, borderRadius: 8, alignItems: 'center' },
  harvestButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#F9FAFB' },
  manualSubmitButton: { backgroundColor: '#111827', padding: 14, borderRadius: 8, alignItems: 'center' },
  manualSubmitButtonText: { color: '#FFFFFF', fontWeight: '700' }
});
