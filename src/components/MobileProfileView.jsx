import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Pencil,
  Calendar,
  CheckCircle2,
  Shield,
  Bell,
  Clock,
  Lock,
  Smartphone,
  Laptop,
  ChevronRight,
  Copy,
  Check,
  Building,
  Home,
  Key,
  Car,
  Box,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Award,
  ShieldCheck,
  Share2,
  Settings,
  ArrowRight,
  PhoneCall,
  Download,
  Info,
  Layers,
  HeartHandshake
} from 'lucide-react';

/**
 * MobileProfileView
 * Modern Enterprise & Fintech Experience for User Profile on Mobile (<= 900px)
 */
const MobileProfileView = ({
  userProfile,
  completionPercentage = 90,
  nextIncompleteMilestone,
  onEditProfile,
  onAvatarChange,
  onToggle2FA,
  onToggleNotification,
  showToast,
  handleCopy,
  copiedField,
}) => {
  // Active Tab: 'details' | 'unit' | 'security' | 'notices' | 'manager' | 'activity'
  const [activeTab, setActiveTab] = useState('details');

  const copyText = (text, fieldName) => {
    if (handleCopy) {
      handleCopy(text, fieldName);
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
      if (showToast) showToast(`${fieldName} copied to clipboard!`, 'success');
    }
  };

  return (
    <div className="profile-mobile-view">
      {/* ── 1. ENTERPRISE HERO PROFILE CARD ── */}
      <section className="mobile-profile-hero" aria-label="Resident Identity">
        <div className="mobile-profile-hero-pattern" />

        {/* Top Verification Row */}
        <div className="mobile-profile-hero-top-row">
          <div className="mobile-profile-verified-chip">
            <ShieldCheck size={13} />
            <span>Strata Verified Resident</span>
          </div>
          <span className="mobile-profile-status-pip">
            <span className="mobile-profile-pip-dot" />
            <span>Active</span>
          </span>
        </div>

        {/* Avatar & Core Identity */}
        <div className="mobile-profile-hero-body">
          <div className="mobile-profile-avatar-wrap">
            <div className="mobile-profile-avatar-circle">
              <span>{userProfile.initials || 'PU'}</span>
            </div>
            <button
              type="button"
              className="mobile-profile-camera-btn"
              onClick={onAvatarChange}
              title="Change Profile Photo"
              aria-label="Upload photo"
            >
              <Camera size={13} />
            </button>
          </div>

          <div className="mobile-profile-identity">
            <h2 className="mobile-profile-name">{userProfile.fullName}</h2>
            <div className="mobile-profile-roles-wrap">
              <span className="mobile-profile-role-badge main">{userProfile.role}</span>
              {userProfile.committeeRole && (
                <span className="mobile-profile-role-badge committee">
                  <Award size={11} />
                  <span>{userProfile.committeeRole}</span>
                </span>
              )}
            </div>
            <div className="mobile-profile-property-sub">
              <Building size={12} />
              <span>{userProfile.building}</span>
            </div>
            <div className="mobile-profile-lot-sub">
              <Home size={12} />
              <span>{userProfile.lotNumber} ({userProfile.unitNumber})</span>
            </div>
          </div>
        </div>

        {/* Hero Quick Action Bar */}
        <div className="mobile-profile-hero-actions">
          <button
            type="button"
            className="mobile-profile-btn-primary"
            onClick={onEditProfile}
          >
            <Pencil size={14} />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            className="mobile-profile-btn-secondary"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
              if (showToast) showToast('Profile link copied to clipboard!', 'success');
            }}
            title="Share Profile"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
        </div>
      </section>

      {/* ── 2. PROFILE COMPLETION WIDGET ── */}
      {completionPercentage < 100 && (
        <section className="mobile-profile-strength-card" aria-label="Profile Strength">
          <div className="mobile-profile-strength-left">
            <div className="mobile-profile-strength-icon">
              <Sparkles size={16} />
            </div>
            <div className="mobile-profile-strength-info">
              <div className="mobile-profile-strength-title-row">
                <span className="mobile-profile-strength-title">Profile Strength</span>
                <span className="mobile-profile-strength-pct">{completionPercentage}%</span>
              </div>
              <div className="mobile-profile-strength-track">
                <div
                  className="mobile-profile-strength-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              {nextIncompleteMilestone && (
                <p className="mobile-profile-strength-desc">
                  Next: <strong>{nextIncompleteMilestone.label}</strong>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="mobile-profile-strength-btn"
            onClick={onEditProfile}
          >
            <span>Finish</span>
            <ArrowRight size={13} />
          </button>
        </section>
      )}

      {/* ── 3. SEGMENTED TAB SWITCHER ── */}
      <div className="mobile-profile-nav-sticky">
        <nav className="mobile-profile-segmented-bar" aria-label="Profile Sections">
          <button
            type="button"
            className={`mobile-profile-seg-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <User size={13} />
            <span>Details</span>
          </button>

          <button
            type="button"
            className={`mobile-profile-seg-btn ${activeTab === 'unit' ? 'active' : ''}`}
            onClick={() => setActiveTab('unit')}
          >
            <Home size={13} />
            <span>Property</span>
          </button>

          <button
            type="button"
            className={`mobile-profile-seg-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={13} />
            <span>Security</span>
          </button>

          <button
            type="button"
            className={`mobile-profile-seg-btn ${activeTab === 'notices' ? 'active' : ''}`}
            onClick={() => setActiveTab('notices')}
          >
            <Bell size={13} />
            <span>Alerts</span>
          </button>

          <button
            type="button"
            className={`mobile-profile-seg-btn ${activeTab === 'manager' ? 'active' : ''}`}
            onClick={() => setActiveTab('manager')}
          >
            <Award size={13} />
            <span>Manager</span>
          </button>

          <button
            type="button"
            className={`mobile-profile-seg-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Clock size={13} />
            <span>Activity</span>
          </button>
        </nav>
      </div>

      {/* ── 4. TAB CONTENTS ── */}

      {/* TAB 1: PERSONAL DETAILS & EMERGENCY CONTACT */}
      {activeTab === 'details' && (
        <div className="mobile-profile-tab-pane">
          {/* Personal Information */}
          <div className="mobile-profile-card">
            <div className="mobile-profile-card-header">
              <div className="mobile-profile-card-title-wrap">
                <div className="mobile-profile-card-icon blue">
                  <User size={15} />
                </div>
                <div>
                  <h3 className="mobile-profile-card-title">Personal Information</h3>
                  <span className="mobile-profile-card-sub">Identity & official records</span>
                </div>
              </div>
              <button
                type="button"
                className="mobile-profile-card-edit-btn"
                onClick={onEditProfile}
              >
                <Pencil size={12} />
                <span>Edit</span>
              </button>
            </div>

            <div className="mobile-profile-fields-list">
              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Legal Full Name</span>
                <span className="mobile-profile-field-value bold">{userProfile.fullName}</span>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Preferred Name</span>
                <span className="mobile-profile-field-value">{userProfile.preferredName}</span>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Date of Birth</span>
                <span className="mobile-profile-field-value">{userProfile.dob}</span>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Primary Email</span>
                <div className="mobile-profile-field-val-row">
                  <span className="mobile-profile-field-value">{userProfile.email}</span>
                  <span className="mobile-profile-badge-verified">
                    <CheckCircle2 size={11} />
                    <span>Verified</span>
                  </span>
                  <button
                    type="button"
                    className="mobile-profile-copy-btn"
                    onClick={() => copyText(userProfile.email, 'Primary Email')}
                    title="Copy Email"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              {userProfile.secondaryEmail && (
                <div className="mobile-profile-field-item">
                  <span className="mobile-profile-field-label">Secondary Email</span>
                  <div className="mobile-profile-field-val-row">
                    <span className="mobile-profile-field-value">{userProfile.secondaryEmail}</span>
                    <button
                      type="button"
                      className="mobile-profile-copy-btn"
                      onClick={() => copyText(userProfile.secondaryEmail, 'Secondary Email')}
                      title="Copy Secondary Email"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              )}

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Primary Phone</span>
                <div className="mobile-profile-field-val-row">
                  <span className="mobile-profile-field-value">{userProfile.phone}</span>
                  <span className="mobile-profile-badge-verified">
                    <CheckCircle2 size={11} />
                    <span>Verified</span>
                  </span>
                  <button
                    type="button"
                    className="mobile-profile-copy-btn"
                    onClick={() => copyText(userProfile.phone, 'Primary Phone')}
                    title="Copy Phone"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Residential Address</span>
                <span className="mobile-profile-field-value" style={{ lineHeight: 1.35 }}>
                  {userProfile.address}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="mobile-profile-card">
            <div className="mobile-profile-card-header">
              <div className="mobile-profile-card-title-wrap">
                <div className="mobile-profile-card-icon amber">
                  <HeartHandshake size={15} />
                </div>
                <div>
                  <h3 className="mobile-profile-card-title">Emergency Contact</h3>
                  <span className="mobile-profile-card-sub">Trusted emergency escalation</span>
                </div>
              </div>
            </div>

            <div className="mobile-profile-contact-hero">
              <div className="mobile-profile-contact-name-row">
                <div className="mobile-profile-contact-avatar">
                  <span>DU</span>
                </div>
                <div>
                  <div className="mobile-profile-contact-name">
                    {userProfile.emergencyContact?.name || 'Dilini Udara'}
                  </div>
                  <span className="mobile-profile-contact-relation">
                    {userProfile.emergencyContact?.relationship || 'Spouse'}
                  </span>
                </div>
              </div>

              <div className="mobile-profile-contact-actions-grid">
                <a
                  href={`tel:${userProfile.emergencyContact?.phone || '+94719876543'}`}
                  className="mobile-profile-contact-action-btn phone"
                >
                  <PhoneCall size={14} />
                  <span>Call Emergency</span>
                </a>
                <a
                  href={`mailto:${userProfile.emergencyContact?.email || 'dilini.u@example.com'}`}
                  className="mobile-profile-contact-action-btn email"
                >
                  <Mail size={14} />
                  <span>Send Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROPERTY & LOT */}
      {activeTab === 'unit' && (
        <div className="mobile-profile-tab-pane">
          <div className="mobile-profile-card">
            <div className="mobile-profile-card-header">
              <div className="mobile-profile-card-title-wrap">
                <div className="mobile-profile-card-icon teal">
                  <Home size={15} />
                </div>
                <div>
                  <h3 className="mobile-profile-card-title">Strata Lot &amp; Property</h3>
                  <span className="mobile-profile-card-sub">Registered scheme entitlements</span>
                </div>
              </div>
            </div>

            <div className="mobile-profile-fields-list">
              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Strata Scheme / Building</span>
                <span className="mobile-profile-field-value bold">{userProfile.building}</span>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Lot Identifier</span>
                <span className="mobile-profile-field-value bold teal-text">{userProfile.lotNumber}</span>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Unit Number</span>
                <span className="mobile-profile-field-value">{userProfile.unitNumber}</span>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Unit Entitlement</span>
                <span className="mobile-profile-field-value">{userProfile.unitEntitlement}</span>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Allocated Parking Bay</span>
                <div className="mobile-profile-field-val-row">
                  <Car size={13} color="#0284c7" />
                  <span className="mobile-profile-field-value">{userProfile.parkingBay}</span>
                </div>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Allocated Storage Lot</span>
                <div className="mobile-profile-field-val-row">
                  <Box size={13} color="#f59e0b" />
                  <span className="mobile-profile-field-value">{userProfile.storageLot}</span>
                </div>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Occupancy Type</span>
                <span className="mobile-profile-badge-pill green">{userProfile.occupancyType}</span>
              </div>

              <div className="mobile-profile-field-item">
                <span className="mobile-profile-field-label">Resident Since</span>
                <span className="mobile-profile-field-value">{userProfile.joinedOn}</span>
              </div>
            </div>

            <div className="mobile-profile-card-footer">
              <button
                type="button"
                className="mobile-profile-btn-outline-full"
                onClick={() => {
                  if (showToast) showToast('Downloading Strata By-Laws & Ownership Certificate (PDF)...', 'success');
                }}
              >
                <Download size={14} />
                <span>Download By-Laws &amp; Certificate (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & ACCESS */}
      {activeTab === 'security' && (
        <div className="mobile-profile-tab-pane">
          {/* Two-Factor Authentication */}
          <div className="mobile-profile-card">
            <div className="mobile-profile-card-header">
              <div className="mobile-profile-card-title-wrap">
                <div className="mobile-profile-card-icon teal">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <h3 className="mobile-profile-card-title">Two-Factor Authentication</h3>
                  <span className="mobile-profile-card-sub">Enhanced login protection</span>
                </div>
              </div>
              <label className="mobile-profile-toggle-switch">
                <input
                  type="checkbox"
                  checked={userProfile.security?.twoFactorEnabled}
                  onChange={onToggle2FA}
                />
                <span className="mobile-profile-toggle-slider" />
              </label>
            </div>
            <p className="mobile-profile-card-desc">
              Require a secondary verification code via SMS or authenticator app when signing in from an unrecognized device.
            </p>
          </div>

          {/* Password Security */}
          <div className="mobile-profile-card">
            <div className="mobile-profile-card-header">
              <div className="mobile-profile-card-title-wrap">
                <div className="mobile-profile-card-icon blue">
                  <Key size={15} />
                </div>
                <div>
                  <h3 className="mobile-profile-card-title">Account Password</h3>
                  <span className="mobile-profile-card-sub">
                    Last changed {userProfile.security?.lastPasswordChange || '10 May 2026'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="mobile-profile-card-action-link"
                onClick={() => {
                  if (showToast) showToast('Password reset link sent to your verified email!', 'success');
                }}
              >
                Update
              </button>
            </div>
          </div>

          {/* Active Devices & Sessions */}
          <div className="mobile-profile-card">
            <div className="mobile-profile-card-header">
              <div className="mobile-profile-card-title-wrap">
                <div className="mobile-profile-card-icon slate">
                  <Smartphone size={15} />
                </div>
                <div>
                  <h3 className="mobile-profile-card-title">Active Devices</h3>
                  <span className="mobile-profile-card-sub">2 active portal sessions</span>
                </div>
              </div>
            </div>

            <div className="mobile-profile-sessions-list">
              <div className="mobile-profile-session-item">
                <div className="mobile-profile-session-left">
                  <Smartphone size={16} color="#0d9488" />
                  <div>
                    <div className="mobile-profile-session-device">iPhone 15 Pro (Mobile App)</div>
                    <div className="mobile-profile-session-meta">Melbourne, VIC &bull; Active Now</div>
                  </div>
                </div>
                <span className="mobile-profile-badge-current">This Device</span>
              </div>

              <div className="mobile-profile-session-item">
                <div className="mobile-profile-session-left">
                  <Laptop size={16} color="#64748b" />
                  <div>
                    <div className="mobile-profile-session-device">MacBook Pro M3 (Chrome)</div>
                    <div className="mobile-profile-session-meta">Melbourne, VIC &bull; 2 hours ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMUNICATION PREFERENCES */}
      {activeTab === 'notices' && (
        <div className="mobile-profile-tab-pane">
          <div className="mobile-profile-card">
            <div className="mobile-profile-card-header">
              <div className="mobile-profile-card-title-wrap">
                <div className="mobile-profile-card-icon teal">
                  <Bell size={15} />
                </div>
                <div>
                  <h3 className="mobile-profile-card-title">Communication Preferences</h3>
                  <span className="mobile-profile-card-sub">Manage alerts and notifications</span>
                </div>
              </div>
            </div>

            <div className="mobile-profile-toggles-list">
              <div className="mobile-profile-toggle-row">
                <div className="mobile-profile-toggle-text">
                  <span className="mobile-profile-toggle-title">Email Strata Notices</span>
                  <span className="mobile-profile-toggle-desc">
                    Official meeting notices, AGM agendas, minutes &amp; by-law announcements.
                  </span>
                </div>
                <label className="mobile-profile-toggle-switch">
                  <input
                    type="checkbox"
                    checked={userProfile.notifications?.emailNotices}
                    onChange={() => onToggleNotification('emailNotices')}
                  />
                  <span className="mobile-profile-toggle-slider" />
                </label>
              </div>

              <div className="mobile-profile-toggle-row">
                <div className="mobile-profile-toggle-text">
                  <span className="mobile-profile-toggle-title">SMS Levy Alerts</span>
                  <span className="mobile-profile-toggle-desc">
                    Quarterly installment reminders and direct debit confirmations.
                  </span>
                </div>
                <label className="mobile-profile-toggle-switch">
                  <input
                    type="checkbox"
                    checked={userProfile.notifications?.smsLevyAlerts}
                    onChange={() => onToggleNotification('smsLevyAlerts')}
                  />
                  <span className="mobile-profile-toggle-slider" />
                </label>
              </div>

              <div className="mobile-profile-toggle-row">
                <div className="mobile-profile-toggle-text">
                  <span className="mobile-profile-toggle-title">Push Maintenance Notices</span>
                  <span className="mobile-profile-toggle-desc">
                    Urgent lift outages, water shutdowns and scheduled contractor works.
                  </span>
                </div>
                <label className="mobile-profile-toggle-switch">
                  <input
                    type="checkbox"
                    checked={userProfile.notifications?.pushMaintenance}
                    onChange={() => onToggleNotification('pushMaintenance')}
                  />
                  <span className="mobile-profile-toggle-slider" />
                </label>
              </div>

              <div className="mobile-profile-toggle-row">
                <div className="mobile-profile-toggle-text">
                  <span className="mobile-profile-toggle-title">Community &amp; Social Events</span>
                  <span className="mobile-profile-toggle-desc">
                    Resident BBQ announcements, clubhouse notices and strata social news.
                  </span>
                </div>
                <label className="mobile-profile-toggle-switch">
                  <input
                    type="checkbox"
                    checked={userProfile.notifications?.communityEvents}
                    onChange={() => onToggleNotification('communityEvents')}
                  />
                  <span className="mobile-profile-toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STRATA MANAGER CONTACT */}
      {activeTab === 'manager' && (
        <div className="mobile-profile-tab-pane">
          <div className="mobile-profile-card">
            <div className="mobile-profile-card-header">
              <div className="mobile-profile-card-title-wrap">
                <div className="mobile-profile-card-icon amber">
                  <Award size={15} />
                </div>
                <div>
                  <h3 className="mobile-profile-card-title">Assigned Strata Manager</h3>
                  <span className="mobile-profile-card-sub">Your primary managing agent</span>
                </div>
              </div>
            </div>

            <div className="mobile-profile-manager-box">
              <div className="mobile-profile-manager-header">
                <div className="mobile-profile-manager-avatar">
                  <span>SJ</span>
                </div>
                <div>
                  <div className="mobile-profile-manager-name">
                    {userProfile.manager?.name || 'Sarah Jenkins'}
                  </div>
                  <div className="mobile-profile-manager-title">
                    {userProfile.manager?.title || 'Senior Strata Manager'}
                  </div>
                  <div className="mobile-profile-manager-agency">
                    {userProfile.manager?.agency || 'Intellistrata Management'}
                  </div>
                </div>
              </div>

              <div className="mobile-profile-manager-hours">
                <Clock size={13} color="#64748b" />
                <span>Office Hours: {userProfile.manager?.hours || 'Mon - Fri: 8:30 AM - 5:30 PM'}</span>
              </div>

              <div className="mobile-profile-contact-actions-grid">
                <a
                  href={`tel:${userProfile.manager?.phone || '+94112345678'}`}
                  className="mobile-profile-contact-action-btn phone"
                >
                  <PhoneCall size={14} />
                  <span>Call Office</span>
                </a>
                <a
                  href={`mailto:${userProfile.manager?.email || 's.jenkins@intellistrata.com'}`}
                  className="mobile-profile-contact-action-btn email"
                >
                  <Mail size={14} />
                  <span>Send Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ACTIVITY AUDIT LOG */}
      {activeTab === 'activity' && (
        <div className="mobile-profile-tab-pane">
          <div className="mobile-profile-card">
            <div className="mobile-profile-card-header">
              <div className="mobile-profile-card-title-wrap">
                <div className="mobile-profile-card-icon slate">
                  <Clock size={15} />
                </div>
                <div>
                  <h3 className="mobile-profile-card-title">Activity Audit Trail</h3>
                  <span className="mobile-profile-card-sub">Recent verified portal actions</span>
                </div>
              </div>
            </div>

            <div className="mobile-profile-timeline">
              {[
                {
                  id: 1,
                  action: 'Profile Updated',
                  detail: 'Personal contact phone number verified via SMS OTP',
                  date: 'Today, 2:15 PM',
                  icon: User,
                  color: '#0d9488',
                },
                {
                  id: 2,
                  action: 'Committee Decision Recorded',
                  detail: 'Voted in favor of Lift 2 sensor contract renewal',
                  date: 'Yesterday, 10:45 AM',
                  icon: Award,
                  color: '#0284c7',
                },
                {
                  id: 3,
                  action: 'Maintenance Ticket Submitted',
                  detail: 'Reported sensor misalignment on Tower A basement gate',
                  date: '24 May 2026',
                  icon: Building,
                  color: '#f59e0b',
                },
                {
                  id: 4,
                  action: 'Levy Installment Paid',
                  detail: 'Quarterly payment of $810.00 confirmed with receipt',
                  date: '20 May 2026',
                  icon: CheckCircle2,
                  color: '#10b981',
                },
                {
                  id: 5,
                  action: 'Security Biometric Login',
                  detail: 'Authenticated via mobile Face ID biometric session',
                  date: '18 May 2026',
                  icon: ShieldCheck,
                  color: '#8b5cf6',
                },
              ].map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <div key={item.id} className="mobile-profile-timeline-item">
                    <div className="mobile-profile-timeline-left">
                      <div
                        className="mobile-profile-timeline-icon"
                        style={{ borderColor: item.color, color: item.color }}
                      >
                        <ItemIcon size={13} />
                      </div>
                      {idx < 4 && <div className="mobile-profile-timeline-line" />}
                    </div>

                    <div className="mobile-profile-timeline-content">
                      <div className="mobile-profile-timeline-header">
                        <span className="mobile-profile-timeline-action">{item.action}</span>
                        <span className="mobile-profile-timeline-date">{item.date}</span>
                      </div>
                      <p className="mobile-profile-timeline-desc">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileProfileView;
