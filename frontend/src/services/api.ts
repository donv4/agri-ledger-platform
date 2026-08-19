import ExpoConstants from 'expo-constants';
import { OfflineQueueManager } from './offline-queue';

// 📡 Force direct traffic routing onto your custom verified Cloudflare Edge network
const getBaseUrl = (): string => {
  return 'https://api.agri.vibezlabs.com'; // 🌟 FIXED: Changed from vibezlabs.com to your active custom worker domain
};

const BASE_URL = getBaseUrl();



export const apiService = {
  /**
   * 🌾 Global Multi-Tenant Request Dispatcher
   */
  async request(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
    const endpoint = `${BASE_URL}${path}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    try {
      console.log(`[API Client] Syncing ${method} -> ${endpoint}`);
      
      // Pass the network thread directly through the 3s Abort Timeout Guard
      const response = await OfflineQueueManager.safeRequest(endpoint, options);
      
      // Automatically attempt an asynchronous background flush if an operation completes successfully
      if (method !== 'GET') {
        OfflineQueueManager.processQueue().catch(err => 
          console.log('[Sync Engine Background Intercept] Silent queue fail:', err)
        );
      }

      return await response.json();
    } catch (error: any) {
      if (error.message === 'OFFLINE_MODE_ENGAGED') {
        return {
          success: false,
          offline: true,
          message: 'Low network signal detected. Actions saved to local hardware array storage.',
        };
      }
      
      console.error(`[API Client Error] Target crash at ${path}:`, error);
      return { success: false, error: error.message || 'Unknown network execution error' };
    }
  },

  // 🐔 CoopManager Endpoints (Fully Aligned)
  async getCoopMetrics(farmId: number) {
    // 🌟 FIXED: Changed from /api/coop to /api/coop/batches to match your active Hono worker routing key layout
    return this.request(`/api/coop/batches?farm_id=${farmId}`, 'GET');
  },
  
  async logEggCount(farmId: number, count: number, notes?: string) {
    // 🌟 FIXED: Changed from /api/coop/logs to your active backend ledger write path endpoint key
    return this.request('/api/coop/log-production', 'POST', { 
      farm_id: farmId, 
      batch_id: 1, // Pass down your sample target batch ID identifier
      eggs_collected: count, 
      notes 
    });
  },

  // 🌿 CropCycle Endpoints
  async getCropRows(farmId: number) {
    return this.request(`/api/crop/rows?farm_id=${farmId}`, 'GET');
  },

  async addCropRow(farmId: number, cropType: string, plantingDate: string) {
    return this.request('/api/crops/rows', 'POST', { farm_id: farmId, crop_type: cropType, planting_date: plantingDate });
  },

  // 💰 Farm Finance Endpoints
  async getFinancialLedger(farmId: number) {
    return this.request(`/api/finance?farm_id=${farmId}`, 'GET');
  },
  async logExpense(farmId: number, amountCents: number, category: string, notes?: string) {
    return this.request('/api/finance/expenses', 'POST', {
      farm_id: farmId,
      amount_cents: amountCents,
      category,
      date: new Date().toISOString().split('T')[0],
      notes
    });
  }
};
