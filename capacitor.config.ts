import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zinha.app',
  appName: 'Zinha',
  webDir: 'dist',
  server: {
    allowNavigation: ['appzinha.com', 'meet.appzinha.com']
  }
};

export default config;
