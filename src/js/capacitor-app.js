import { Capacitor } from '@capacitor/core';

const capacitorApp = {
  init(f7) {
    if (!Capacitor.isNativePlatform()) return;

    const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
    console.log('[CapacitorApp] Running on:', platform);

    // On Android: handle hardware back button via history API
    // @capacitor/app back button support can be added later:
    //   npm install @capacitor/app && npx cap sync
    // Then replace this with the App.addListener('backButton', ...) pattern
    if (platform === 'android') {
      document.addEventListener('backbutton', () => {
        if (f7.views.main.router.history.length > 1) {
          f7.views.main.router.back();
        }
      });
    }

    // App lifecycle — runs when app resumes from background
    document.addEventListener('resume', () => {
      console.log('[CapacitorApp] App resumed');
    });

    document.addEventListener('pause', () => {
      console.log('[CapacitorApp] App paused');
    });
  },
};

export default capacitorApp;
