// src/app/finance/roi.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
// 🔄 Import useFocusEffect to break screen caching loops
import { useFocusEffect } from 'expo-router';
import { api } from '../../services/api';

interface ROIMetrics {
  total_invested_dollars: string;
  total_revenue_dollars: string;
  net_profit_dollars: string;
  profit_margin_pct: string;
}

export default function ROIDashboardScreen() {
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ useFocusEffect fires every single time the farmer opens this screen
  useFocusEffect(
    useCallback(() => {
      async function fetchROI() {
        try {
          const response = await api.get(`/api/finance/roi-summary/101?nocache=${Date.now()}`);
          if (response?.success) {
            setMetrics(response.data);
          }
        } catch (err) {
          console.error("Failed to load investment analytics.");
        } finally {
          setIsLoading(false);
        }
      }
      
      fetchROI();
      
      // Optional: Reset loader when leaving screen so it spins briefly next time
      return () => setIsLoading(true);
    }, [])
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  const positiveMargin = metrics ? parseFloat(metrics.net_profit_dollars) >= 0 : false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Performance Metrics Ledger</Text>
      
      {/* FINANCIAL DATA CARDS */}
      <View style={styles.metricRow}>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>Total Input Costs</Text>
          <Text style={[styles.miniValue, { color: '#C62828' }]}>
            ${metrics?.total_invested_dollars || '0.00'}
          </Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>Gross Sales Rev</Text>
          <Text style={[styles.miniValue, { color: '#2E7D32' }]}>
            ${metrics?.total_revenue_dollars || '0.00'}
          </Text>
        </View>
      </View>

      {/* OVERALL NET STATUS CARD */}
      <View style={[styles.mainCard, positiveMargin ? styles.cardProfit : styles.cardLoss]}>
        <Text style={styles.mainLabel}>Net Operating Income</Text>
        <Text style={styles.mainValue}>
          {positiveMargin ? '' : '-'}${Math.abs(parseFloat(metrics?.net_profit_dollars || '0')).toFixed(2)}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            📈 {metrics?.profit_margin_pct}% Profit Margin
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  center: { flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#666666', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 0.5 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  miniCard: { backgroundColor: '#FFFFFF', width: '48%', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  miniLabel: { fontSize: 12, color: '#757575', marginBottom: 4, fontWeight: '600' },
  miniValue: { fontSize: 20, fontWeight: 'bold' },
  mainCard: { borderRadius: 16, padding: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardProfit: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#A5D6A7' },
  cardLoss: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#EF9A9A' },
  mainLabel: { fontSize: 14, color: '#444444', marginBottom: 6, fontWeight: '600' },
  mainValue: { fontSize: 32, fontWeight: 'bold', color: '#1B5E20', marginBottom: 12 },
  badge: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9' },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' }
});
