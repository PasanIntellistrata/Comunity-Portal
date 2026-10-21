import React, { useState, useCallback } from 'react';
import { Page, f7, Icon } from 'framework7-react';
import { authService } from '../js/services/auth.js';

// Visual assets matching the login screen
import loginBg from '../assets/login-bg.jpg';
import logoWhite from '../assets/logo-white.png';

/**
 * RegisterPage — Intellistrata Community Portal
 *
 * Registration form:
 * - Email
 * - Password
 * - Confirm Password
 * - Register button
 * - Link to Login
 *
 * All operations go through authService.register(email, password).
 */
const RegisterPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Confirmation email sent state
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // ---------- Client-side Validation ----------
  const validate = useCallback(() => {
    const errs = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    return errs;
  }, [email, password, confirmPassword]);

  // ---------- Navigation to Login ----------
  const navigateToLogin = useCallback((e) => {
    e?.preventDefault();
    try {
      f7.views.main.router.navigate('/login/', { reloadCurrent: true, ignoreCache: true });
    } catch {
      window.location.href = '/login/';
    }
  }, []);

  // ---------- Submit ----------
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errs = validate();
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setIsLoading(true);
      try {
        const result = await authService.register(email.trim(), password);

        if (result.success) {
          if (result.needsEmailConfirmation) {
            // Confirmation is required: do not treat user as fully authenticated
            setRegisteredEmail(email.trim());
            setEmailConfirmationRequired(true);
            f7.toast
              .create({
                text: result.message || 'Verification link sent to your email.',
                position: 'top',
                closeTimeout: 5000,
                cssClass: 'color-green',
              })
              .open();
          } else {
            // Valid session obtained (auto-confirm enabled or mock mode)
            if (onLoginSuccess && result.user) {
              onLoginSuccess?.(result.user);
            }
            f7.toast
              .create({
                text: 'Account created successfully! Welcome to the portal.',
                position: 'top',
                closeTimeout: 3000,
                cssClass: 'color-green',
              })
              .open();

            // Navigate to home dashboard
            try {
              f7.views.main.router.navigate('/', { reloadCurrent: true, ignoreCache: true });
            } catch {
              window.location.href = '/';
            }
          }
        } else {
          f7.toast
            .create({
              text: result.error || 'Registration failed. Please try again.',
              position: 'top',
              closeTimeout: 4000,
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
    [email, password, validate, onLoginSuccess]
  );

  return (
    <Page noNavbar noToolbar noSwipeback className="login-page">
      {/* ===== DESKTOP HERO PANEL ===== */}
      <div className="login-hero">
        <div className="login-hero__overlay">
          <div className="login-hero__brand">
            <div className="login-hero__logo-wrap">
              <img
                src={logoWhite}
                alt="Intellistrata"
                className="login-hero__logo"
              />
            </div>
            <div className="login-hero__brand-text">
              <h1 className="login-hero__portal-title">
                Community <span className="portal-accent">Portal</span>
              </h1>
              <span className="login-hero__tagline">
                Smartly managing your community, together.
              </span>
            </div>
          </div>

          <div className="login-hero__content">
            <h2 className="login-hero__headline">
              Join Your Strata Community Today
            </h2>
            <p className="login-hero__description">
              Create your resident account to access building announcements, track maintenance requests,
              review levy notices, and participate in community decisions in real-time.
            </p>

            <ul className="login-hero__features">
              <li className="login-hero__feature">
                <div className="login-hero__feature-icon">
                  <Icon ios="f7:lock_shield_fill" md="material:security" />
                </div>
                <div className="login-hero__feature-text">
                  <h4>Secure & Protected</h4>
                  <p>Enterprise-grade authentication powered by Supabase</p>
                </div>
              </li>
              <li className="login-hero__feature">
                <div className="login-hero__feature-icon">
                  <Icon ios="f7:checkmark_seal_fill" md="material:verified" />
                </div>
                <div className="login-hero__feature-text">
                  <h4>Reliable Access</h4>
                  <p>24/7 access to your community records and services</p>
                </div>
              </li>
              <li className="login-hero__feature">
                <div className="login-hero__feature-icon">
                  <Icon ios="f7:bubble_left_bubble_right_fill" md="material:forum" />
                </div>
                <div className="login-hero__feature-text">
                  <h4>Connected Community</h4>
                  <p>Stay updated with instant notices and communications</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ===== MOBILE HEADER ===== */}
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
            Join your strata community online
          </p>
        </div>
      </div>

      {/* ===== FORM PANEL ===== */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          {emailConfirmationRequired ? (
            /* ===== EMAIL CONFIRMATION NOTICE ===== */
            <div className="register-success-card">
              <div className="register-success-icon">
                <Icon ios="f7:envelope_badge_fill" md="material:mark_email_read" />
              </div>
              <h3>Verify Your Email</h3>
              <p>
                We sent a confirmation link to <strong>{registeredEmail}</strong>.
                Please check your inbox and confirm your email address before signing in.
              </p>
              <button
                type="button"
                className="register-success-btn"
                onClick={navigateToLogin}
              >
                Proceed to Sign In
              </button>
            </div>
          ) : (
            /* ===== REGISTRATION FORM ===== */
            <>
              <h2 className="login-form__heading">Create Account</h2>
              <p className="login-form__subheading">
                Enter your details to create your portal account
              </p>

              <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <label className="login-field-label" htmlFor="register-email">
                  Email
                </label>
                <div
                  className={`login-input-wrap ${email ? 'has-value' : ''} ${
                    errors.email ? 'has-error' : ''
                  }`}
                >
                  <span className="login-input-icon">
                    <Icon ios="f7:envelope" md="material:email" />
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email address"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                  />
                </div>
                {errors.email && (
                  <span className="login-field-error">{errors.email}</span>
                )}

                {/* Password */}
                <label className="login-field-label" htmlFor="register-password">
                  Password
                </label>
                <div
                  className={`login-input-wrap ${password ? 'has-value' : ''} ${
                    errors.password ? 'has-error' : ''
                  }`}
                >
                  <span className="login-input-icon">
                    <Icon ios="f7:lock" md="material:lock" />
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
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
                    tabIndex={-1}
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

                {/* Confirm Password */}
                <label className="login-field-label" htmlFor="register-confirm-password">
                  Confirm Password
                </label>
                <div
                  className={`login-input-wrap ${confirmPassword ? 'has-value' : ''} ${
                    errors.confirmPassword ? 'has-error' : ''
                  }`}
                >
                  <span className="login-input-icon">
                    <Icon ios="f7:lock" md="material:lock" />
                  </span>
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                  />
                  <button
                    type="button"
                    className="login-input-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon
                      ios={showConfirmPassword ? 'f7:eye_slash' : 'f7:eye'}
                      md={showConfirmPassword ? 'material:visibility_off' : 'material:visibility'}
                    />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="login-field-error">{errors.confirmPassword}</span>
                )}

                {/* Register Button */}
                <button
                  type="submit"
                  className="login-submit-btn"
                  disabled={isLoading}
                  style={{ marginTop: '12px' }}
                >
                  {isLoading ? 'Creating account...' : 'Register'}
                </button>

                {/* Link to Login */}
                <div className="login-register-prompt">
                  <span>Already have an account? </span>
                  <a
                    href="/login/"
                    className="login-register-link"
                    onClick={navigateToLogin}
                  >
                    Log In
                  </a>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </Page>
  );
};

export default RegisterPage;
