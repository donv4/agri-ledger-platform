// src/app/finance/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function FinanceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1565C0' }, // Distinct corporate blue theme for money tracking
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="expenses" options={{ title: 'Expense Ledger Input' }} />
      <Stack.Screen name="roi" options={{ title: 'Real-Time ROI Analysis' }} />
    </Stack>
  );
}
