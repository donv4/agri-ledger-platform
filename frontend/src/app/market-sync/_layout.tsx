// src/app/market-sync/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function MarketSyncLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#311B92' }, // Royal deep purple theme for marketplace value
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Live Inventory Market Sync' }} />
    </Stack>
  );
}
