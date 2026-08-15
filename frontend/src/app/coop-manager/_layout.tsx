// src/app/coop-manager/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function CoopManagerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B5E20' }, // Match our brand color scheme
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Flock Inventory Ledger' }} />
      <Stack.Screen name="[batch-id]" options={{ title: 'Batch Details' }} />
    </Stack>
  );
}
