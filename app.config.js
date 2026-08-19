const variant = process.env.APP_VARIANT || 'platform';

const configurations = {
  platform: { name: 'AgriLedger Suite', slug: 'agriledger-suite', packageId: 'com.vibezlabs.agriledger' },
  coop: { name: 'CoopManager', slug: 'agriledger-coop', packageId: 'com.vibezlabs.coopmanager' },
  crops: { name: 'CropCycle', slug: 'agriledger-crops', packageId: 'com.vibezlabs.cropcycle' },
  hive: { name: 'Hive Mind', slug: 'agriledger-hive', packageId: 'com.vibezlabs.hivemind' },
  finance: { name: 'Farm Finance', slug: 'agriledger-finance', packageId: 'com.vibezlabs.farmfinance' },
};

const current = configurations[variant] || configurations.platform;

export default {
  expo: {
    scheme: 'agriledger',
    
    name: current.name,
    slug: current.slug,
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: current.packageId
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: current.packageId
    },
    extra: {
      APP_VARIANT: variant,
      REACT_NATIVE_PACKAGER_HOSTNAME: '192.168.100.6',
      eas: { projectId: 'your-eas-project-id-here' }
    },
    plugins: [['expo-router', { origin: 'https://vibezlabs.com' }]]
  }
};
