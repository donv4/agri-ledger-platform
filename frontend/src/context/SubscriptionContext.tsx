// src/context/SubscriptionContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

type ModuleName = 'coop_manager' | 'crop_cycle' | 'hive_mind' | 'farm_finance' | 'market_sync';

interface SubscriptionContextType {
  activeModules: ModuleName[];
  isLoading: boolean;
  hasAccess: (module: ModuleName) => boolean;
  refreshSubscriptions: (farmId: number) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children, farmId }: { children: React.ReactNode; farmId: number }) {
  const [activeModules, setActiveModules] = useState<ModuleName[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscriptions = async (id: number) => {
    try {
      // 1. Fetch live license data from Cloudflare Worker
      const response = await api.get(`/api/subscriptions/${id}`);
      if (response?.success) {
        const modules = response.modules as ModuleName[];
        setActiveModules(modules);
        // 2. Cache flags to persistent storage
        await AsyncStorage.setItem(`@sub_flags_${id}`, JSON.stringify(modules));
      }
    } catch (error) {
      console.log('Farming area network dropout. Loading local cached flags.');
      // 3. Fallback cache extraction
      const cached = await AsyncStorage.getItem(`@sub_flags_${id}`);
      if (cached) {
        setActiveModules(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (farmId) refreshSubscriptions(farmId);
  }, [farmId]);

  const hasAccess = (module: ModuleName) => activeModules.includes(module);

  return (
    <SubscriptionContext.Provider value={{ activeModules, isLoading, hasAccess, refreshSubscriptions }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be wrapped in a SubscriptionProvider');
  return context;
};
