// src/app/hive-mind/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function HiveMindLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#E65100' }, // Vibrant honey amber orange theme
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Apiary Log Ledger' }} />
    </Stack>
  );
}
