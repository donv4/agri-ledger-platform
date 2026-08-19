// frontend/src/app/finance/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiService } from '../../services/api';
import { useFarmSync } from '../../hooks/useFarmSync';

interface ROISummary {
  total_invested_dollars: string;
  total_revenue_dollars: string;
  net_profit_dollars: string;
  profit_margin_pct: string;
}

export default function FarmFinanceDashboard() {
  const { logFarmActivity } = useFarmSync();
  const [roi, setRoi] = useState<ROISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('');

  // Form Fields
  const [amountDollars, setAmountDollars] = useState('');
  const [category, setCategory] = useState('Feed');
  const [notes, setNotes] = useState('');

  const TEST_FARM_ID = 101;

  useEffect(() => {
    fetchROISummary();
  }, []);

  /**
   * 📊 Fetch live dollar aggregations from the backend worker summaries
   */
  const fetchROISummary = async () => {
    setLoading(true);
    const response = await apiService.request(`/api/finance/roi-summary/${TEST_FARM_ID}`, 'GET');
    if (response.success && response.data) {
      setRoi(response.data);
    }
    setLoading(false);
  };

  /**
   * 💰 Log an expense, automatically converting to integer CENTS for D1 storage accuracy
   */
  const handleLogExpense = async () => {
    if (!amountDollars || isNaN(Number(amountDollars))) return;

    setSyncStatus('Submitting financial log...');
    const amountCents = Math.round(parseFloat(amountDollars) * 100);

    const payload = {
      farm_id: TEST_FARM_ID,
      amount_cents: amountCents,
      category: category,
      date: new Date().toISOString(),
      notes: notes || null
    };

    const res = await logFarmActivity('/api/finance/expense', payload);

    if (res?.offline) {
      setSyncStatus('⚠️ Offline Mode: Locked safely to AsyncStorage ledger.');
    } else if (res?.success) {
      setSyncStatus('✅ Expense recorded successfully!');
      setAmountDollars('');
      setNotes('');
      fetchROISummary(); // Refresh calculation cards dynamically
    } else {
      setSyncStatus(`❌ Refused: ${res?.error || 'Network timeout'}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text style={styles.loadingText}>Compiling Financial Ledgers...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <Text style={styles.titleHeader}>💰 Farm Finance ROI Dashboard</Text>
        <Text style={styles.subtitleHeader}>Real-Time Integer-Cent Operational Overview</Text>
      </View>

      {syncStatus ? (
        <View style={styles.statusBox}><Text style={styles.statusText}>{syncStatus}</Text></View>
      ) : null}

      {/* 💳 METRIC CARDS ROW */}
      <View style={styles.grid}>
        <View style={[styles.roiCard, { borderLeftColor: '#D32F2F' }]}>
          <Text style={styles.cardLabel}>Total Expenses</Text>
          <Text style={[styles.cardValue, { color: '#D32F2F' }]}>${roi?.total_invested_dollars || '0.00'}</Text>
        </View>
        <View style={[styles.roiCard, { borderLeftColor: '#2E7D32' }]}>
          <Text style={styles.cardLabel}>Net Profit</Text>
          <Text style={[styles.cardValue, { color: '#2E7D32' }]}>${roi?.net_profit_dollars || '0.00'}</Text>
        </View>
      </View>

      <View style={[styles.bannerCard, { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' }]}>
        <Text style={styles.bannerLabel}>Active Profit Margin Matrix: {roi?.profit_margin_pct || '0.0'}%</Text>
      </View>

      {/* 📝 EXPENSE RECORDING FORM */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionLabel}>Record New Expense Entry</Text>

        <TextInput
          style={styles.inputField}
          placeholder="Amount in Dollars (e.g. 45.50)"
          keyboardType="numeric"
          value={amountDollars}
          onChangeText={setAmountDollars}
        />

        <TextInput
          style={styles.inputField}
          placeholder="Category (e.g. Feed, Equipment, Fuel)"
          value={category}
          onChangeText={setCategory}
        />

        <TextInput
          style={[styles.inputField, styles.textArea]}
          placeholder="Optional notes or operational line descriptions"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleLogExpense}>
          <Text style={styles.submitText}>Commit Financial Entry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#1B5E20', fontWeight: '500' },
  headerBlock: { backgroundColor: '#E8F5E9', padding: 20, borderBottomWidth: 1, borderBottomColor: '#C8E6C9' },
  titleHeader: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
  subtitleHeader: { fontSize: 13, color: '#2E7D32', marginTop: 2 },
  statusBox: { margin: 16, padding: 12, backgroundColor: '#ECEFF1', borderRadius: 8, textAlign: 'center' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#37474F', textAlign: 'center' },
  grid: { flexDirection: 'row', padding: 16, gap: 16, justifyContent: 'space-between' },
  roiCard: { backgroundColor: '#FFFFFF', flex: 1, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', borderLeftWidth: 5, elevation: 1 },
  cardLabel: { fontSize: 12, color: '#757575', fontWeight: '600' },
  cardValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  bannerCard: { marginHorizontal: 16, padding: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  bannerLabel: { fontSize: 14, fontWeight: '700', color: '#1B5E20' },
  formContainer: { padding: 16, marginTop: 10 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 12 },
  inputField: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  textArea: { height: 60, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#1B5E20', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 4, elevation: 2 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }
});
