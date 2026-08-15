// src/hooks/useFarmSync.ts
import { offlineQueue } from '../services/offline-queue';
import { api } from '../services/api';

export function useFarmSync() {
  const logFarmActivity = async (endpoint: string, payload: any) => {
    try {
      // Attempt immediate live cloud upload transaction
      const response = await api.post(endpoint, payload);
      return response;
    } catch (error) {
      // NETWORK DOWNFALL GATING
      // Intercept execution and store data inside local storage array instead
      const queued = await offlineQueue.enqueueAction(endpoint, payload);
      return { 
        success: true, 
        offline: true, 
        message: "Offline. Data stored securely on your device. Will sync when cell connection returns." 
      };
    }
  };

  return { logFarmActivity, triggerBackgroundSync: offlineQueue.processQueue };
}
