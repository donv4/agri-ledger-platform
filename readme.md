🏗️ Architecture Blueprint & Core Components
       [ Physical Smartphone Device ] (Samsung Galaxy S20+)
                     │
         Expo SDK 57 Mobile Frontend
      (with 3s Network Abort Timeout Guard)
                     │
        ┌────────────┴────────────┐
   [Wi-Fi Connection]       [Offline Status]
        │                         │
  Live API Requests        Persistent Queue
        │                   (AsyncStorage)
        ▼                         ▼
   Cloudflare Edge Worker   Local Device Memory
   (Hono Routing Engine)    (Syncs on Network Return)
        │
   SQLite Database
   (Cloudflare D1 Sandbox Tables)

Cloudflare D1 Local SQLite Database: Handles indexing multi-tenant farm identification data, modular access subscriptions, crops, flock batches, apiary log histories, and market item inventory quantities.

Hono.js Edge Worker Engine: Manages REST API routing and handles strict multi-tenant feature entitlement authorization gates via global security middleware filters.

Expo SDK 57 Cross-Platform App: Native file-system routing engine (expo-router) styled using optimized layout components with immediate rendering fallback triggers.

3-Second Network Abort Timeout Guard: Intercepts hanging HTTP threads in low-signal rural barn zones, cutting requests off after 3000ms to block application crashes.

AsyncStorage Persistent Local Storage Cache Queue: Catches data payloads dropped during network timeouts, locks them into hardware storage arrays sequentially, and syncs them automatically to the cloud upon connection recovery.

🗄️ Database Schema Blueprint (backend/worker/src/db/schema.sql)

-- 1. Multi-Tenant Farm Accounts
CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    owner_email TEXT NOT NULL UNIQUE
);

-- 2. Subscription Feature-Gating Matrix
CREATE TABLE IF NOT EXISTS farm_subscriptions (
    id INTEGER PRIMARY KEY,
    farm_id INTEGER NOT NULL,
    module_name TEXT NOT NULL, -- 'coop_manager', 'crop_cycle', 'hive_mind', 'farm_finance', 'market_sync'
    status TEXT NOT NULL,      -- 'active', 'inactive'
    FOREIGN KEY(farm_id) REFERENCES farms(id),
    UNIQUE(farm_id, module_name)
);

-- 3. Poultry Flock Management Data Rows
CREATE TABLE IF NOT EXISTS crop_rows (
    id INTEGER PRIMARY KEY,
    farm_id INTEGER NOT NULL,
    crop_type TEXT NOT NULL,
    planting_date TEXT NOT NULL,
    harvest_status TEXT NOT NULL, -- 'planted', 'growing', 'harvesting', 'completed'
    FOREIGN KEY(farm_id) REFERENCES farms(id)
);

-- 4. Financial Cost Operations Ledger (Saved strictly in integer CENTS)
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY,
    farm_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY(farm_id) REFERENCES farms(id)
);

-- 5. Warehouse Stock Inventory Valuation Layout
CREATE TABLE IF NOT EXISTS market_inventory (
    id INTEGER PRIMARY KEY,
    farm_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    FOREIGN KEY(farm_id) REFERENCES farms(id)
);

⚡ Active Network Mapping References

To maintain active handshakes across both servers and physical smartphone devices over your local Wi-Fi router network, configuration parameters are mapped explicitly as follows:PC IPv4 Loopback Local Endpoint: http://127.0.0.1:8787 (Used for pure local browser diagnostics)Active Hardware Wi-Fi Dev Bridge IP: http://192.168.100.6:8787 (Configured inside frontend/src/services/api.ts to link your smartphone over your local router network)Wrangler Network Listening Tunnel: 0.0.0.0:8787 (Instructs your machine's firewall to allow inbound connection handshakes safely)

🚀 Instant Restoration & Launch Commands

If you need to spin up or restart this environment cleanly in a future workspace session, execute these commands inside your separate VS Code terminal panels:

# 1. Step completely into your worker codebase subdirectory
cd C:\Users\donv\Documents\agri-ledger-platform\backend\worker

# 2. Re-apply the SQLite D1 schema blueprints to your local database sandbox
npx wrangler d1 execute agri-ledger-DB --local --file=src/db/schema.sql

# 3. Inject Test Farm 101 production module entitlements into your sandbox table
npx wrangler d1 execute agri-ledger-DB --local --command="INSERT OR IGNORE INTO farm_subscriptions (farm_id, module_name, status) VALUES (101, 'coop_manager', 'active'), (101, 'farm_finance', 'active'), (101, 'crop_cycle', 'active'), (101, 'market_sync', 'active');"

# 4. Inject Initial Warehouse Inventory Seeds (100 Cartons of Eggs @ $5.00 each)
npx wrangler d1 execute agri-ledger-DB --local --command="INSERT OR IGNORE INTO market_inventory (id, farm_id, item_name, quantity, unit_price_cents) VALUES (1, 101, 'Fresh Organic Eggs (Dozen)', 100, 500);"

# 5. Fire up your edge server and open port 8787 wide to inbound Wi-Fi device requests
npx wrangler dev --ip 0.0.0.0 --port 8787


🔵 Panel 2: Launching the Frontend Mobile UI Framework

# 1. Navigate straight into your mobile layout root folder workspace
cd C:\Users\donv\Documents\agri-ledger-platform\frontend

# 2. Boot up your Metro compiler engine and completely flush out old compilation cache tables
npx expo start -c

Action: Open Expo Go on your Samsung S20+, scan the fresh QR code generated in your terminal panel, and watch your completed agribusiness platform run!


🎨 Current Workspace Feature Matrix Check

Security Redirections: Free-tier profiles automatically bounce off locked modules and reroute down to the upsell.tsx premium monetization pricing card view.

Coop Manager (🐔): Queries local databases dynamically to render live bird metrics.Crop Cycle (🌿): Tracks growing states for Roma Tomatoes and Sweet Corn.

Hive Mind (🐝): Inspects apiary design logs (Hive Alpha / Beta).

Farm Finance ROI Dashboard (💰): Automatically calculates aggregate expenses against live Market Sync inventory values to show exact profit margins.
