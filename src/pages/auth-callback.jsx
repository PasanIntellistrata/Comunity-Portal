import React, { useEffect, useState } from 'react';
import { Page, f7, Preloader } from 'framework7-react';
import { authService } from '../js/services/auth.js';
import loginBg from '../assets/login-bg.jpg';
import logoWhite from '../assets/logo-white.png';

/**
 * AuthCallbackPage — Handles OAuth redirect returns from Google and Microsoft (Azure AD).
 * Restores the Supabase session, updates the centralized authService state, and navigates to Home.
 */
const AuthCallbackPage = ({ onLoginSuccess }) => {
  const [statusMessage, setStatusMessage] = useState('Completing authentication...');

  useEffect(() => {
    let isMounted = true;

    async function processCallback() {
      try {
        const result = await authService.handleAuthCallback();

        if (!isMounted) return;

        if (result.success && result.user) {
          if (result.isInvite) {
            setStatusMessage('Invitation accepted! Please set a password for your account.');
            f7.dialog.prompt(
              'Please set a password for your new account (minimum 6 characters):',
              'Welcome to Intellistrata',
              async (newPassword) => {
                if (newPassword && newPassword.length >= 6) {
                  await authService.updatePassword(newPassword);
                  f7.toast
                    .create({
                      text: 'Password set! Account activated successfully.',
                      position: 'top',
                      closeTimeout: 3500,
                      cssClass: 'color-green',
                    })
                    .open();
                }
                if (onLoginSuccess) {
                  onLoginSuccess?.(result.user);
                }
                try {
                  f7.views.main.router.navigate('/home/', { reloadCurrent: true, ignoreCache: true });
                } catch (e) {
                  window.location.href = '/home/';
                }
              },
              () => {
                // If dismissed, proceed into portal
                if (onLoginSuccess) {
                  onLoginSuccess?.(result.user);
                }
                try {
                  f7.views.main.router.navigate('/home/', { reloadCurrent: true, ignoreCache: true });
                } catch (e) {
                  window.location.href = '/home/';
                }
              }
            );
            return;
          }

          setStatusMessage('Authentication successful. Redirecting...');
          if (onLoginSuccess) {
            onLoginSuccess?.(result.user);
          }
          try {
            f7.views.main.router.navigate('/home/', { reloadCurrent: true, ignoreCache: true });
          } catch (e) {
            window.location.href = '/home/';
          }
        } else {
          const errorMsg = result.error || 'Authentication could not be completed.';
          f7.toast
            .create({
              text: errorMsg,
              position: 'top',
              closeTimeout: 4000,
              cssClass: 'color-red',
            })
            .open();

          try {
            f7.views.main.router.navigate('/login/', { reloadCurrent: true, ignoreCache: true });
          } catch (e) {
            window.location.href = '/login/';
          }
        }
      } catch (err) {
        if (!isMounted) return;
        f7.toast
          .create({
            text: 'An error occurred during authentication. Please sign in again.',
            position: 'top',
            closeTimeout: 4000,
            cssClass: 'color-red',
          })
          .open();

        try {
          f7.views.main.router.navigate('/login/', { reloadCurrent: true, ignoreCache: true });
        } catch (e) {
          window.location.href = '/login/';
        }
      }
    }

    processCallback();

    return () => {
      isMounted = false;
    };
  }, [onLoginSuccess]);

  return (
    <Page name="auth-callback" noToolbar noNavbar className="login-page">
      <div className="login-hero" style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={loginBg} alt="" className="login-hero__bg" />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#ffffff', padding: '32px' }}>
          <img
            src={logoWhite}
            alt="Intellistrata"
            style={{ width: '180px', height: 'auto', marginBottom: '24px' }}
          />
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
            Community Portal
          </h2>
          <div style={{ marginBottom: '16px' }}>
            <Preloader color="white" size={36} />
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            {statusMessage}
          </p>
        </div>
      </div>
    </Page>
  );
};

export default AuthCallbackPage;
