// src/app/_layout.tsx
import React, { useEffect } from 'react';
import { Slot, useSegments, useRouter } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SubscriptionProvider, useSubscription } from '../context/SubscriptionContext';

function RouteGuard() {
  const segments = useSegments();
  const router = useRouter();
  const { hasAccess, isLoading } = useSubscription();

  useEffect(() => {
    if (isLoading) return;

    // Detect which feature folder directory the user is currently opening
    const activeFolder = segments[0];

    // Map application folder subdirectories to our explicit database module strings
    const folderToModuleMap: Record<string, 'coop_manager' | 'crop_cycle' | 'hive_mind' | 'farm_finance' | 'market_sync'> = {
      'coop-manager': 'coop_manager',
      'crop-cycle': 'crop_cycle',
      'hive-mind': 'hive_mind',
      'farm-finance': 'farm_finance',
      'market-sync': 'market_sync',
    };

    const requestedModule = folderToModuleMap[activeFolder];

    // 🔒 SECURITY CHECK
    // If they attempt to open an enterprise directory that they do not own, redirect them instantly
    if (requestedModule && !hasAccess(requestedModule)) {
      router.replace('/upsell');
    }
  }, [segments, isLoading]);

  // Display a clean loading indicator while checking local hardware cache storage files
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  // Render the child screen safely if entitlements clear the security gate
  return <Slot />;
}

// Global App Root (Simulating authentication as test farm instance 101)
export default function RootLayout() {
  return (
    <SubscriptionProvider farmId={101}>
      <RouteGuard />
    </SubscriptionProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
