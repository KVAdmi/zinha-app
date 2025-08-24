import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zinha.app',
  appName: 'Zinha',
  webDir: 'dist',
  server: {
    allowNavigation: ['zinha.app', 'meet.zinha.app', 'tracking.zinha.app']
  }
};

export default config;
