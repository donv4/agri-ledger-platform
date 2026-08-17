// frontend/src/services/api.ts

// Update your service base URL configuration to use your live production link:
const BASE_URL = 'https://api.agri.vibezlabs.com'; 
const FARM_ID = '101';


// ⏳ TIMEOUT SETTING: 3000 milliseconds (3 seconds) max wait time before dropping to local cache
const TIMEOUT_MS = 3000;

export const api = {
  async get(endpoint: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal, // Attaches the timeout clock trigger
      });
      clearTimeout(timeoutId);
      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.log(`API GET Aborted/Failed [${endpoint}]:`, error.message);
      throw error;
    }
  },

  async post(endpoint: string, body: any) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal, // Attaches the timeout clock trigger
      });
      clearTimeout(timeoutId);
      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.log(`API POST Aborted/Failed [${endpoint}]:`, error.message);
      throw error; // This triggers the catch block in useFarmSync to queue data instantly!
    }
  }
};
