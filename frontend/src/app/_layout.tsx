import React from 'react';
import ExpoConstants from 'expo-constants';
import { Tabs } from 'expo-router';

export default function DynamicRootLayout() {
  // Read the active application compilation variant from app.config.js
  // Default to 'platform' if no variant environment flag is set
  const appVariant = ExpoConstants.expoConfig?.extra?.APP_VARIANT || 'platform';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1B5E20', // Sage green branding anchor accent
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          elevation: 4,
        },
      }}
    >
      {/* 🏠 Main Dashboard / Entry Hub Layout Control */}
      <Tabs.Screen
        name="index"
        options={{
          title: appVariant === 'platform' ? 'AgriLedger Hub' : 'Dashboard',
          // Always visible as it acts as the basic entry landing screen
        }}
      />

      {/* 🐔 CoopManager Route Module Separation Gate */}
      <Tabs.Screen
        name="coop-manager"
        options={{
          title: 'CoopManager',
          href: (appVariant === 'platform' || appVariant === 'coop') ? '/coop-manager' : null,
        }}
      />

      {/* 🌿 CropCycle Route Module Separation Gate */}
      <Tabs.Screen
        name="crop-cycle"
        options={{
          title: 'CropCycle',
          href: (appVariant === 'platform' || appVariant === 'crops') ? '/crop-cycle' : null,
        }}
      />

      {/* 💰 Farm Finance Route Module Separation Gate */}
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Farm Finance',
          href: (appVariant === 'platform' || appVariant === 'finance') ? '/finance' : null,
        }}
      />

      {/* 🐝 Hive Mind Route Module Separation Gate */}
      <Tabs.Screen
        name="hive-mind"
        options={{
          title: 'Hive Mind',
          href: (appVariant === 'platform' || appVariant === 'hive') ? '/hive-mind' : null,
        }}
      />

      {/* 📦 Market Sync Hidden Internal Data Channel Route */}
      <Tabs.Screen
        name="market-sync"
        options={{
          title: 'Market Sync',
          // Hide from bottom tab bars across all variations, access purely programmatically
          href: null, 
        }}
      />
    </Tabs>
  );
}
