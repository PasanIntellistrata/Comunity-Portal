/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.intellistrata.portal',
  appName: 'Community Portal',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#007aff',
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#007aff',
    },
  },
};

module.exports = config;
