import React, { useState, useCallback } from 'react';
import { Page, f7, Icon } from 'framework7-react';
import { authService } from '../js/services/auth.js';

// Import assets — these are resolved by Vite
import loginBg from '../assets/login-bg.jpg';
import logoWhite from '../assets/logo-white.png';

/**
 * LoginPage — Intellistrata Community Portal
 *
 * Desktop (≥768px): Split-panel — hero left, form right
 * Mobile  (<768px): Stacked — condensed branding header + form
 *
 * All auth operations go through authService (never fetch directly).
 */
const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ---------- Validation ----------
  const validate = useCallback(() => {
    const errs = {};
    if (!username.trim()) errs.username = 'Username or email is required';
    if (!password) errs.password = 'Password is required';
    return errs;
  }, [username, password]);

  // ---------- Submit ----------
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errs = validate();
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setIsLoading(true);
      try {
        const result = await authService.login(username, password, rememberMe);

        if (result.success) {
          if (onLoginSuccess) {
            onLoginSuccess?.(result.user);
          }
          // Navigate to Home / dashboard across the whole web portal
          try {
            f7.views.main.router.navigate('/home/', { reloadCurrent: true, ignoreCache: true });
          } catch (e) {
            window.location.href = '/home/';
          }
        } else {
          f7.toast
            .create({
              text: result.error || 'Login failed. Please try again.',
              position: 'top',
              closeTimeout: 3000,
              cssClass: 'color-red',
            })
            .open();
        }
      } catch (err) {
        f7.toast
          .create({
            text: 'Network error. Please check your connection.',
            position: 'top',
            closeTimeout: 3000,
            cssClass: 'color-red',
          })
          .open();
      } finally {
        setIsLoading(false);
      }
    },
    [username, password, rememberMe, validate, onLoginSuccess]
  );

  // ---------- Forgot password ----------
  const handleForgotPassword = useCallback(() => {
    f7.dialog.prompt(
      'Enter your email address and we\'ll send you a reset link.',
      'Reset Password',
      async (email) => {
        if (!email || !email.trim()) return;
        try {
          const result = await authService.forgotPassword(email.trim());
          f7.toast
            .create({
              text: result.message || 'Reset link sent!',
              position: 'top',
              closeTimeout: 4000,
            })
            .open();
        } catch {
          f7.toast
            .create({
              text: 'Unable to send reset link. Please try again later.',
              position: 'top',
              closeTimeout: 3000,
              cssClass: 'color-red',
            })
            .open();
        }
      }
    );
  }, []);

  // ---------- Social OAuth Authentication ----------
  const handleSocialAuth = useCallback(
    async (provider) => {
      setIsLoading(true);
      try {
        const result = await authService.loginWithOAuth(provider);
        if (result.success) {
          // If in mock mode or immediate user was returned
          if (result.user) {
            if (onLoginSuccess) {
              onLoginSuccess?.(result.user);
            }
            try {
              f7.views.main.router.navigate('/home/', { reloadCurrent: true, ignoreCache: true });
            } catch (e) {
              window.location.href = '/home/';
            }
          }
          // In live Supabase mode, browser redirects automatically to provider login
        } else {
          const isConfigNotice = result.error && (result.error.includes('Supabase') || result.error.includes('Azure') || result.error.includes('enable'));
          if (isConfigNotice) {
            f7.dialog.alert(result.error, `${provider} Sign-In Notice`);
          } else {
            f7.toast
              .create({
                text: result.error || `${provider} sign-in failed. Please try again.`,
                position: 'center',
                closeTimeout: 4000,
                cssClass: 'color-red',
              })
              .open();
          }
        }
      } catch (err) {
        f7.toast
          .create({
            text: `Unable to connect to ${provider}. Please check your connection.`,
            position: 'top',
            closeTimeout: 3500,
            cssClass: 'color-red',
          })
          .open();
      } finally {
        setIsLoading(false);
      }
    },
    [onLoginSuccess]
  );

  // ---------- Render ----------
  return (
    <Page name="login" noToolbar noNavbar className="login-page">
      {/* ===== DESKTOP HERO PANEL ===== */}
      <div className="login-hero">
        <img src={loginBg} alt="" className="login-hero__bg" />
        <div className="login-hero__content">
          {/* Logo */}
          <div className="login-hero__logo">
            <img src={logoWhite} alt="Intellistrata" />
          </div>

          {/* Title + Features */}
          <div>
            <h1 className="login-hero__title">
              <span className="login-hero__title-community">Community </span>
              <span className="login-hero__title-portal">Portal</span>
            </h1>
            <p className="login-hero__tagline">
              Smartly managing your community, together.
            </p>

            <ul className="login-hero__features">
              <li className="login-hero__feature">
                <div className="login-hero__feature-icon">
                  <Icon ios="f7:shield_fill" md="material:shield" />
                </div>
                <div className="login-hero__feature-text">
                  <h4>Secure</h4>
                  <p>Advanced security to protect your data</p>
                </div>
              </li>
              <li className="login-hero__feature">
                <div className="login-hero__feature-icon">
                  <Icon ios="f7:checkmark_seal_fill" md="material:verified" />
                </div>
                <div className="login-hero__feature-text">
                  <h4>Reliable</h4>
                  <p>99.9% uptime you can count on</p>
                </div>
              </li>
              <li className="login-hero__feature">
                <div className="login-hero__feature-icon">
                  <Icon ios="f7:wifi" md="material:wifi" />
                </div>
                <div className="login-hero__feature-text">
                  <h4>Connected</h4>
                  <p>Stay connected anytime, anywhere</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ===== MOBILE HEADER (hidden on desktop) ===== */}
      <div className="login-mobile-header">
        <img src={loginBg} alt="" className="login-mobile-header__bg" />
        <div className="login-mobile-header__content">
          <img
            src={logoWhite}
            alt="Intellistrata"
            className="login-mobile-header__logo"
          />
          <h1 className="login-mobile-header__title">
            Community <span className="portal-text">Portal</span>
          </h1>
          <p className="login-mobile-header__tagline">
            Smartly managing your community, together.
          </p>
        </div>
      </div>

      {/* ===== FORM PANEL ===== */}
      <div className="login-form-panel">
        {/* Language selector - top right corner */}
        <div className="login-lang-selector">
          <button
            type="button"
            className="login-lang-btn"
            id="login-lang-btn"
            aria-label="Select Language"
            onClick={() =>
              f7.toast
                .create({
                  text: 'Language selection coming soon.',
                  position: 'top',
                  closeTimeout: 2000,
                })
                .open()
            }
          >
            <Icon
              ios="f7:globe"
              md="material:language"
              className="globe-icon"
            />
            <span>English</span>
            <Icon
              ios="f7:chevron_down"
              md="material:expand_more"
              className="chevron-icon"
            />
          </button>
        </div>

        <div className="login-form-wrapper">
          {/* Heading */}
          <h2 className="login-form__heading">Welcome Back!</h2>
          <p className="login-form__subheading">
            Sign in to continue to your account
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Username / Email */}
            <label className="login-field-label" htmlFor="login-username">
              Username or Email
            </label>
            <div
              className={`login-input-wrap ${username ? 'has-value' : ''} ${errors.username ? 'has-error' : ''}`}
            >
              <span className="login-input-icon">
                <Icon ios="f7:person" md="material:person" />
              </span>
              <input
                id="login-username"
                type="text"
                placeholder="Enter your username or email"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                }}
              />
            </div>
            {errors.username && (
              <span className="login-field-error">{errors.username}</span>
            )}

            {/* Password */}
            <label className="login-field-label" htmlFor="login-password">
              Password
            </label>
            <div
              className={`login-input-wrap ${password ? 'has-value' : ''} ${errors.password ? 'has-error' : ''}`}
            >
              <span className="login-input-icon">
                <Icon ios="f7:lock" md="material:lock" />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
              />
              <button
                type="button"
                className="login-input-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon
                  ios={showPassword ? 'f7:eye_slash' : 'f7:eye'}
                  md={showPassword ? 'material:visibility_off' : 'material:visibility'}
                />
              </button>
            </div>
            {errors.password && (
              <span className="login-field-error">{errors.password}</span>
            )}

            {/* Remember me / Forgot */}
            <div className="login-options-row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a
                className="login-forgot-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleForgotPassword();
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Invitation Notice (No public registration per Intellistrata requirements) */}
            <div className="login-register-prompt">
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Access to the Community Portal is by invitation only. Contact your Strata Manager if you require an account.
              </span>
            </div>

            {/* Demo Hint */}
            <div className="login-demo-hint">
              <span>Development / Test Mode: Use the predefined test credentials or click Google / Microsoft to sign in.</span>
            </div>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span>or continue with</span>
          </div>

          {/* Social auth */}
          <div className="login-social-buttons">
            <button
              type="button"
              className="login-social-btn"
              disabled={isLoading}
              onClick={() => handleSocialAuth('Microsoft')}
            >
              {/* Microsoft logo inline SVG */}
              <svg viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Sign in with Microsoft
            </button>

            <button
              type="button"
              className="login-social-btn"
              disabled={isLoading}
              onClick={() => handleSocialAuth('Google')}
            >
              {/* Google logo inline SVG */}
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
          </div>

          {/* Terms footer */}
          <p className="login-footer">
            By signing in, you agree to our{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </Page>
  );
};

export default LoginPage;
