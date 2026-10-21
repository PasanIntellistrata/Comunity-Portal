import React, { useState, useCallback, useEffect } from 'react';
import {
  App,
  View,
  f7ready,
  f7,
} from 'framework7-react';

import capacitorApp from '../js/capacitor-app.js';
import routes from '../js/routes.jsx';
import store from '../js/store.js';
import { authService } from '../js/services/auth.js';

const MyApp = () => {
  // ---------- Centralized Auth State ----------
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => authService.isAuthenticated()
  );

  // Sync auth state across windows, tabs, and components
  useEffect(() => {
    const unsubscribe = authService.onAuthChange(({ isAuthenticated: newAuth }) => {
      setIsAuthenticated(newAuth);
    });
    return unsubscribe;
  }, []);

  const handleLoginSuccess = useCallback((user) => {
    setIsAuthenticated(true);
    try {
      if (f7 && f7.views && f7.views.main && f7.views.main.router) {
        f7.views.main.router.navigate('/home/', { reloadCurrent: true, ignoreCache: true });
      } else {
        window.location.href = '/home/';
      }
    } catch (e) {
      window.location.href = '/home/';
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await authService.logout();
    setIsAuthenticated(false);
    try {
      if (f7 && f7.views && f7.views.main && f7.views.main.router) {
        f7.views.main.router.navigate('/login/', { reloadCurrent: true, ignoreCache: true });
      } else {
        window.location.href = '/login/';
      }
    } catch (e) {
      window.location.href = '/login/';
    }
  }, []);

  // ---------- Framework7 params ----------
  const f7params = {
    name: 'Community Portal',
    theme: 'auto', // auto-detect iOS vs MD
    id: 'com.intellistrata.portal',
    store: store,
    routes: routes,
    // Desktop View settings: disable mobile slide transitions and eliminate DOM clutter
    view: {
      animate: false,
      browserHistory: true,
      browserHistoryAnimate: false,
      browserHistoryAnimateOnLoad: false,
      preloadPreviousPage: false,
      removeElements: true,
    },
    // Input settings
    input: {
      scrollIntoViewOnFocus: false,
      scrollIntoViewCentered: false,
    },
    // Capacitor status bar settings
    statusbar: {
      iosOverlaysWebView: true,
      androidOverlaysWebView: false,
    },
  };

  f7ready((f7Instance) => {
    capacitorApp.init(f7Instance || f7);
  });

  // Determine initial URL based on authentication state
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isLoginPage = pathname === '/login/' || pathname === '/login';
  const isAuthCallback =
    pathname === '/auth/callback' ||
    pathname === '/auth/callback/' ||
    (typeof window !== 'undefined' &&
      (window.location.search.includes('code=') ||
        window.location.hash.includes('access_token=') ||
        window.location.search.includes('error=')));

  let initialUrl = '/login/';
  if (isAuthCallback) {
    initialUrl = '/auth/callback/';
  } else if (!isAuthenticated) {
    initialUrl = '/login/';
  } else if (isLoginPage) {
    initialUrl = '/home/';
  } else {
    initialUrl = pathname && pathname !== '/' ? pathname : '/home/';
  }

  return (
    <App {...f7params}>
      {/*
        Single View with URL-based routing.
        Guarded routes ensure one login across the entire portal.
      */}
      <View
        id="view-main"
        main
        url={initialUrl}
        className="safe-areas"
        animate={false}
        browserHistoryAnimate={false}
        preloadPreviousPage={false}
        routerProps={{
          onLoginSuccess: handleLoginSuccess,
          onLogout: handleLogout,
        }}
      />
    </App>
  );
};

export default MyApp;
