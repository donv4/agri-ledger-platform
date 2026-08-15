// src/app/finance/expenses.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFarmSync } from '../../hooks/useFarmSync';

export default function ExpenseLoggerScreen() {
  const router = useRouter();
  const { logFarmActivity } = useFarmSync();

  const [dollarAmount, setDollarAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

// frontend/src/app/finance/expenses.tsx

  const handleLogExpense = async () => {
    if (!dollarAmount || !category) {
      return Alert.alert('Validation Error', 'Please complete all required expense fields.');
    }

    setIsSubmitting(true);
    const amountInCents = Math.round(parseFloat(dollarAmount) * 100);

    const payload = {
      farm_id: 101,
      amount_cents: amountInCents,
      category: category,
      date: new Date().toISOString().split('T')[0],
      notes: "Logged via mobile operations dashboard input terminal"
    };

    const result = await logFarmActivity('/api/finance/expense?farm_id=101', payload);
    setIsSubmitting(false);

    if (result?.success) {
      setDollarAmount('');
      setCategory('');
      
      if (result.offline) {
        Alert.alert('📴 Stored Locally', 'Financial ledger transaction cached to hardware engine storage successfully.');
      } else {
        Alert.alert('✅ Cloud Sync Success', 'Input investment ledger record successfully written to edge database.');
      }
    } else {
      // ✅ FIX: Added this explicit alert block so errors are clearly displayed instead of silently ignored!
      Alert.alert(
        '❌ Transaction Rejected', 
        result?.error || 'The edge database server refused this entry layout shape.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.cardHeader}>💸 Input Investment Logger</Text>
        <Text style={styles.cardSubtitle}>Record operational farm development costs safely in integer cents.</Text>

        <Text style={styles.label}>Transaction Value ($)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="numeric"
          value={dollarAmount}
          onChangeText={setDollarAmount}
        />

        <Text style={styles.label}>Operational Category</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Poultry Feed, Crop Netting, Hive Framing"
          value={category}
          onChangeText={setCategory}
        />

        <Button
          title={isSubmitting ? "Committing Transaction..." : "Securely Log Expense"}
          color="#1565C0"
          onPress={handleLogExpense}
        />

        <Button 
          title="💥 Wipe Stuck Local Cache Queue" 
          color="#D32F2F" 
          onPress={async () => {
            await require('@react-native-async-storage/async-storage').default.removeItem('@offline_actions_queue');
            Alert.alert('Cache Cleared', 'All old malformed backlog transactions have been deleted from your phone.');
          }} 
        />

      </View>

      <TouchableOpacity style={styles.analyticsLink} onPress={() => router.push('/finance/roi')}>
        <Text style={styles.analyticsLinkText}>📊 View Live ROI Performance Analytics →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20, justifyContent: 'center' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#E0E0E0', elevation: 3 },
  cardHeader: { fontSize: 18, fontWeight: 'bold', color: '#1565C0', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#666666', marginBottom: 20, lineHeight: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#444444', marginBottom: 6, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#CCCCCC', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#FAFAFA', fontSize: 15 },
  analyticsLink: { marginTop: 24, alignSelf: 'center', padding: 8 },
  analyticsLinkText: { color: '#1565C0', fontWeight: 'bold', fontSize: 14 }
});
