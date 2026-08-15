// src/services/offline-queue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

interface OfflineAction {
  id: string;
  endpoint: string;
  payload: any;
  timestamp: number;
}

const QUEUE_STORAGE_KEY = '@offline_actions_queue';

export const offlineQueue = {
  // 📥 QUEUE ACTION: Save log event locally when network drops
  async enqueueAction(endpoint: string, payload: any) {
    try {
      const existingQueueStr = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      const queue: OfflineAction[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];

      const newAction: OfflineAction = {
        id: Math.random().toString(36).substring(7),
        endpoint,
        payload,
        timestamp: Date.now(),
      };

      queue.push(newAction);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      console.log(`[Offline Queue] Action saved to device storage: ${endpoint}`);
      return true;
    } catch (error) {
      console.error('[Offline Queue] Failed to queue offline action:', error);
      return false;
    }
  },

  // 📤 SYNC QUEUE: Push stored records sequentially to Cloudflare when connection returns
  async processQueue() {
    try {
      const existingQueueStr = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!existingQueueStr) return;

      const queue: OfflineAction[] = JSON.parse(existingQueueStr);
      if (queue.length === 0) return;

      console.log(`[Offline Queue] Connection restored. Processing ${queue.length} pending records...`);

      // Iterate through the backlog sequentially to maintain ledger transaction order
      for (const action of [...queue]) {
        try {
          const result = await api.post(action.endpoint, action.payload);
          if (result?.success) {
            // Remove item from queue if processed successfully
            queue.shift();
            await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
          }
        } catch (err) {
          console.log('[Offline Queue] Worker still unreachable. Holding remaining backlog.');
          break; // Stop loop and keep remaining items in storage if server drops again
        }
      }
    } catch (error) {
      console.error('[Offline Queue] Error syncing queue background tasks:', error);
    }
  }
};
