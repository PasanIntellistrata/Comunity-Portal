import React, { useState, useMemo, useCallback } from 'react';
import {
  Building,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  Shield,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Calendar,
  Clock,
  ExternalLink,
  Edit,
  Check,
  X,
  FileText,
  AlertCircle,
  Sparkles,
  Waves,
  Dumbbell,
  Sun,
  Car,
  Trash2,
  Zap,
  Navigation,
  CreditCard,
  Wrench,
  Bell,
  Users,
  Landmark,
  Search,
  Copy,
  ArrowRight,
} from 'lucide-react';

import { PROPERTIES as FALLBACK_PROPERTIES } from '../js/data/invoice-data.js';
import MobilePropertyLotPicker from './MobilePropertyLotPicker.jsx';

/**
 * MobileHomeView
 * Modern Enterprise-Grade Mobile Experience for Home / Owners Corporation Portal
 */
const MobileHomeView = ({
  propertyDetails,
  selectedProperty,
  selectedLot,
  properties = [],
  onSelectProperty,
  onSelectLot,
  currentUser,
  galleryPhotos = [],
  notices = [],
  bylaws = [],
  showToast,
  onNavigate,
  onOpenLightbox,
}) => {
  // Mobile Navigation Segment: 'overview' | 'notices' | 'committee' | 'building'
  const [activeSegment, setActiveSegment] = useState('overview');

  // Notices & By-Laws Filter Sub-Tab: 'all' | 'notices' | 'bylaws'
  const [noticeSubTab, setNoticeSubTab] = useState('all');
  const [noticeSearch, setNoticeSearch] = useState('');

  // Gallery Navigation State
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [photoRotation, setPhotoRotation] = useState(0);


  // Photo handlers
  const currentPhoto = galleryPhotos[activePhotoIndex] || galleryPhotos[0] || {};

  const handlePrevPhoto = useCallback(() => {
    setPhotoRotation(0);
    setActivePhotoIndex((prev) => (prev === 0 ? galleryPhotos.length - 1 : prev - 1));
  }, [galleryPhotos.length]);

  const handleNextPhoto = useCallback(() => {
    setPhotoRotation(0);
    setActivePhotoIndex((prev) => (prev === galleryPhotos.length - 1 ? 0 : prev + 1));
  }, [galleryPhotos.length]);

  const handleRotateLeft = useCallback(() => {
    setPhotoRotation((prev) => (prev - 90 + 360) % 360);
    if (showToast) showToast('Photo rotated 90° CCW');
  }, [showToast]);

  const handleRotateRight = useCallback(() => {
    setPhotoRotation((prev) => (prev + 90) % 360);
    if (showToast) showToast('Photo rotated 90° CW');
  }, [showToast]);

  // Filtered notices and by-laws
  const filteredNotices = useMemo(() => {
    if (noticeSubTab === 'bylaws') return [];
    if (!noticeSearch.trim()) return notices;
    const q = noticeSearch.toLowerCase();
    return notices.filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.summary && n.summary.toLowerCase().includes(q)) ||
        (n.urgency && n.urgency.toLowerCase().includes(q))
    );
  }, [notices, noticeSubTab, noticeSearch]);

  const filteredBylaws = useMemo(() => {
    if (noticeSubTab === 'notices') return [];
    if (!noticeSearch.trim()) return bylaws;
    const q = noticeSearch.toLowerCase();
    return bylaws.filter(
      (b) =>
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.summary && b.summary.toLowerCase().includes(q))
    );
  }, [bylaws, noticeSubTab, noticeSearch]);

  // Effective properties list
  const effectiveProperties = properties && properties.length > 0 ? properties : FALLBACK_PROPERTIES;

  // Available lots list
  const availableLots = selectedProperty?.lots || [
    'All Lots',
    'Lot A-01',
    'Lot A-02',
    'Lot A-03',
    'Lot B-01',
    'Lot B-02',
  ];

  // Copy contacts helper
  const handleCopyCompanyContacts = () => {
    const text = `Managing Agent: ${propertyDetails.managingCompany.name}
License: ${propertyDetails.managingCompany.license}
Address: ${propertyDetails.managingCompany.address}
Phone: ${propertyDetails.managingCompany.phone}
Email: ${propertyDetails.managingCompany.email}
Website: ${propertyDetails.managingCompany.website}
Strata Manager: ${propertyDetails.strataManager.name} (${propertyDetails.strataManager.email})`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    if (showToast) showToast('Management contacts copied to clipboard', 'success');
  };

  return (
    <div className="home-mobile-view">
      {/* ── 1. ENTERPRISE MOBILE HERO CARD ── */}
      <section className="mobile-home-hero" aria-label="Strata Scheme Overview">
        <div className="mobile-home-hero-accent" />
        <div className="mobile-home-hero-body">
          {/* Identity Row */}
          <div className="mobile-home-identity-row">
            {/* Hexagonal Strata Monogram */}
            <div className="mobile-home-crest-badge" title="Registered Strata Scheme">
              <svg
                className="mobile-home-crest-svg"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon
                  points="50,6 92,28 92,72 50,94 8,72 8,28"
                  stroke="#0284c7"
                  strokeWidth="7"
                  fill="rgba(14, 165, 233, 0.08)"
                />
                <path
                  d="M50 22 L74 37 V63 L50 78 L26 63 V37 Z"
                  fill="rgba(14, 165, 233, 0.16)"
                  stroke="#0ea5e9"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="mobile-home-crest-text">DEMO</span>
            </div>

            {/* Scheme Title & Badges */}
            <div className="mobile-home-title-block">
              <div className="mobile-home-badge-row">
                <span className="mobile-home-status-chip">
                  <span className="mobile-home-status-dot" />
                  Active Scheme
                </span>
                <span className="mobile-home-plan-chip">
                  Plan {propertyDetails.planNumber}
                </span>
              </div>
              <h2 className="mobile-home-scheme-name">
                {selectedProperty?.name || propertyDetails.schemeName}
              </h2>
              <div className="mobile-home-address-row">
                <MapPin size={12} />
                <span className="mobile-home-address-text">
                  {propertyDetails.address.fullFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Property and Lot Interactive Switcher */}
          <div className="mobile-home-switcher-strip">
            <MobilePropertyLotPicker
              selectedProperty={selectedProperty}
              selectedLot={selectedLot}
              properties={effectiveProperties}
              onSelectProperty={onSelectProperty}
              onSelectLot={onSelectLot}
              showToast={showToast}
            />
          </div>
        </div>
      </section>

      {/* ── 2. EXECUTIVE KPI SNAP CARDS (HORIZONTAL SCROLL) ── */}
      <div className="mobile-home-kpi-scroll">
        {/* Levy Status Card */}
        <div
          className="mobile-home-kpi-card"
          onClick={() => onNavigate('/levy/')}
          role="button"
          tabIndex={0}
        >
          <div className="mobile-home-kpi-header">
            <div className="mobile-home-kpi-icon emerald">
              <CreditCard size={15} />
            </div>
            <ChevronRight size={13} className="mobile-home-kpi-arrow" />
          </div>
          <span className="mobile-home-kpi-val emerald">Current (Paid)</span>
          <span className="mobile-home-kpi-lbl">Levy Account</span>
        </div>

        {/* Notices Card */}
        <div
          className="mobile-home-kpi-card"
          onClick={() => setActiveSegment('notices')}
          role="button"
          tabIndex={0}
        >
          <div className="mobile-home-kpi-header">
            <div className="mobile-home-kpi-icon amber">
              <Bell size={15} />
            </div>
            <ChevronRight size={13} className="mobile-home-kpi-arrow" />
          </div>
          <span className="mobile-home-kpi-val amber">{notices.length} Active</span>
          <span className="mobile-home-kpi-lbl">Notices &amp; Rules</span>
        </div>

        {/* Strata Committee Card */}
        <div
          className="mobile-home-kpi-card"
          onClick={() => setActiveSegment('committee')}
          role="button"
          tabIndex={0}
        >
          <div className="mobile-home-kpi-header">
            <div className="mobile-home-kpi-icon blue">
              <Users size={15} />
            </div>
            <ChevronRight size={13} className="mobile-home-kpi-arrow" />
          </div>
          <span className="mobile-home-kpi-val">
            {propertyDetails.committeeMembers.length} Members
          </span>
          <span className="mobile-home-kpi-lbl">Strata Committee</span>
        </div>

        {/* Rapid Support Card */}
        <a
          href={`tel:${propertyDetails.emergencyContact.phoneRaw}`}
          className="mobile-home-kpi-card"
          style={{ textDecoration: 'none' }}
        >
          <div className="mobile-home-kpi-header">
            <div className="mobile-home-kpi-icon rose">
              <ShieldAlert size={15} />
            </div>
            <ChevronRight size={13} className="mobile-home-kpi-arrow" />
          </div>
          <span className="mobile-home-kpi-val" style={{ color: '#dc2626' }}>
            24/7 Hotline
          </span>
          <span className="mobile-home-kpi-lbl">Building Emergency</span>
        </a>
      </div>

      {/* ── 3. ENTERPRISE SEGMENTED NAVIGATION BAR ── */}
      <div className="mobile-home-nav-container">
        <nav className="mobile-home-segmented-bar" aria-label="Mobile Sections">
          <button
            type="button"
            className={`mobile-home-seg-btn ${activeSegment === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSegment('overview')}
          >
            <Building2 size={13} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            className={`mobile-home-seg-btn ${activeSegment === 'notices' ? 'active' : ''}`}
            onClick={() => setActiveSegment('notices')}
          >
            <FileText size={13} />
            <span>Notices</span>
            <span className="mobile-home-seg-badge">{notices.length}</span>
          </button>

          <button
            type="button"
            className={`mobile-home-seg-btn ${activeSegment === 'committee' ? 'active' : ''}`}
            onClick={() => setActiveSegment('committee')}
          >
            <Users size={13} />
            <span>Committee</span>
          </button>

          <button
            type="button"
            className={`mobile-home-seg-btn ${activeSegment === 'building' ? 'active' : ''}`}
            onClick={() => setActiveSegment('building')}
          >
            <Building size={13} />
            <span>Building</span>
          </button>
        </nav>
      </div>

      {/* ── 4. TAB CONTENTS ── */}

      {/* TAB 1: OVERVIEW */}
      {activeSegment === 'overview' && (
        <div className="mobile-home-tab-pane">
          {/* Urgent Notice Alert Spotlight (If any exist) */}
          {notices.length > 0 && (
            <div
              className="mobile-home-alert-spotlight"
              onClick={() => setActiveSegment('notices')}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-home-alert-spotlight-icon">
                <AlertCircle size={16} />
              </div>
              <div className="mobile-home-alert-spotlight-content">
                <div className="mobile-home-alert-spotlight-title">
                  {notices[0].title}
                </div>
                <p className="mobile-home-alert-spotlight-text">
                  {notices[0].summary}
                </p>
              </div>
              <ChevronRight size={14} style={{ color: '#b45309', flexShrink: 0, marginTop: 4 }} />
            </div>
          )}

          {/* Quick Shortcuts 4-Grid */}
          <div className="mobile-home-shortcuts-grid">
            <div
              className="mobile-home-shortcut-card"
              onClick={() => onNavigate('/report-issues/')}
            >
              <div className="mobile-home-shortcut-icon">
                <Wrench size={16} />
              </div>
              <div className="mobile-home-shortcut-text">
                <span className="mobile-home-shortcut-title">Report Issue</span>
                <span className="mobile-home-shortcut-sub">Maintenance</span>
              </div>
            </div>

            <div
              className="mobile-home-shortcut-card"
              onClick={() => onNavigate('/levy/')}
            >
              <div className="mobile-home-shortcut-icon blue">
                <CreditCard size={16} />
              </div>
              <div className="mobile-home-shortcut-text">
                <span className="mobile-home-shortcut-title">View Levies</span>
                <span className="mobile-home-shortcut-sub">Statements</span>
              </div>
            </div>

            <div
              className="mobile-home-shortcut-card"
              onClick={() => onNavigate('/committee/decisions/')}
            >
              <div className="mobile-home-shortcut-icon purple">
                <Landmark size={16} />
              </div>
              <div className="mobile-home-shortcut-text">
                <span className="mobile-home-shortcut-title">Decisions</span>
                <span className="mobile-home-shortcut-sub">Resolutions</span>
              </div>
            </div>

            <div
              className="mobile-home-shortcut-card"
              onClick={() => onNavigate('/documents/')}
            >
              <div className="mobile-home-shortcut-icon amber">
                <FileText size={16} />
              </div>
              <div className="mobile-home-shortcut-text">
                <span className="mobile-home-shortcut-title">Documents</span>
                <span className="mobile-home-shortcut-sub">By-Laws &amp; Plans</span>
              </div>
            </div>
          </div>

          {/* Strata Manager Direct Card */}
          <div className="mobile-home-manager-card">
            <div className="mobile-home-manager-header">
              <div className="mobile-home-manager-avatar">
                {propertyDetails.strataManager.avatarInitials || 'JS'}
              </div>
              <div className="mobile-home-manager-meta">
                <h4 className="mobile-home-manager-name">
                  {propertyDetails.strataManager.name}
                </h4>
                <p className="mobile-home-manager-role">
                  {propertyDetails.strataManager.role}
                </p>
              </div>
            </div>

            <div className="mobile-home-action-buttons-grid">
              <a
                href={`tel:${propertyDetails.managingCompany.phoneRaw}`}
                className="mobile-home-action-btn primary"
              >
                <Phone size={13} />
                <span>Call Office</span>
              </a>

              <a
                href={`mailto:${propertyDetails.strataManager.email}`}
                className="mobile-home-action-btn secondary"
              >
                <Mail size={13} />
                <span>Email Manager</span>
              </a>
            </div>
          </div>

          {/* Owners Corporation Scheme Details Card */}
          <div className="mobile-home-card">
            <div className="mobile-home-card-header">
              <div className="mobile-home-card-title-group">
                <div className="mobile-home-card-icon-badge">
                  <Landmark size={14} />
                </div>
                <span>Owners Corporation Details</span>
              </div>
              <span className="mobile-home-plan-chip">
                {propertyDetails.planNumber}
              </span>
            </div>

            <div className="mobile-home-card-body">
              <div className="mobile-home-oc-list">
                <div className="mobile-home-oc-row">
                  <div className="mobile-home-oc-lbl-wrap">
                    <div className="mobile-home-oc-row-icon">
                      <Building2 size={13} />
                    </div>
                    <span className="mobile-home-oc-lbl">Strata Plan</span>
                  </div>
                  <span className="mobile-home-oc-val mono">
                    {propertyDetails.planNumber}
                  </span>
                </div>

                <div className="mobile-home-oc-row">
                  <div className="mobile-home-oc-lbl-wrap">
                    <div className="mobile-home-oc-row-icon user">
                      <User size={13} />
                    </div>
                    <span className="mobile-home-oc-lbl">Owner on Title</span>
                  </div>
                  <span className="mobile-home-oc-val">
                    {propertyDetails.ownerNameOnTitle}
                  </span>
                </div>

                <div className="mobile-home-oc-row">
                  <div className="mobile-home-oc-lbl-wrap">
                    <div className="mobile-home-oc-row-icon green">
                      <Building size={13} />
                    </div>
                    <span className="mobile-home-oc-lbl">Legal Entity</span>
                  </div>
                  <span className="mobile-home-oc-val">
                    {propertyDetails.legalEntityName}
                  </span>
                </div>

                <div className="mobile-home-oc-row">
                  <div className="mobile-home-oc-lbl-wrap">
                    <div className="mobile-home-oc-row-icon amber">
                      <Clock size={13} />
                    </div>
                    <span className="mobile-home-oc-lbl">Registration</span>
                  </div>
                  <span className="mobile-home-oc-val">
                    {propertyDetails.registrationDate || '12 Nov 2021'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Building Amenities Preview */}
          <div className="mobile-home-card">
            <div className="mobile-home-card-header">
              <div className="mobile-home-card-title-group">
                <div className="mobile-home-card-icon-badge emerald">
                  <Sparkles size={14} />
                </div>
                <span>Building Amenities &amp; Services</span>
              </div>
            </div>

            <div className="mobile-home-card-body">
              <div className="mobile-home-amenities-wrap">
                {propertyDetails.amenities.map((amenity) => (
                  <div key={amenity.id} className="mobile-home-amenity-chip">
                    {amenity.icon === 'waves' && <Waves size={13} />}
                    {amenity.icon === 'dumbbell' && <Dumbbell size={13} />}
                    {amenity.icon === 'sun' && <Sun size={13} />}
                    {amenity.icon === 'car' && <Car size={13} />}
                    {amenity.icon === 'trash' && <Trash2 size={13} />}
                    {amenity.icon === 'zap' && <Zap size={13} />}
                    <span>{amenity.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NOTICES & RULES */}
      {activeSegment === 'notices' && (
        <div className="mobile-home-tab-pane">
          {/* Filter Sub-Tabs */}
          <div className="mobile-home-filter-row">
            <div className="mobile-home-sub-tabs">
              <button
                type="button"
                className={`mobile-home-sub-tab ${noticeSubTab === 'all' ? 'active' : ''}`}
                onClick={() => setNoticeSubTab('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`mobile-home-sub-tab ${noticeSubTab === 'notices' ? 'active' : ''}`}
                onClick={() => setNoticeSubTab('notices')}
              >
                Notices ({notices.length})
              </button>
              <button
                type="button"
                className={`mobile-home-sub-tab ${noticeSubTab === 'bylaws' ? 'active' : ''}`}
                onClick={() => setNoticeSubTab('bylaws')}
              >
                By-Laws ({bylaws.length})
              </button>
            </div>
          </div>

          {/* Notices Feed */}
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`mobile-home-notice-item ${notice.urgency.toLowerCase()}`}
            >
              <div className="mobile-home-notice-header">
                <h4 className="mobile-home-notice-title">{notice.title}</h4>
                <span
                  className={`mobile-home-urgency-pill ${notice.urgency.toLowerCase()}`}
                >
                  {notice.urgency}
                </span>
              </div>
              <div className="mobile-home-notice-meta">
                <span className="mobile-home-notice-meta-item">
                  <Calendar size={11} /> {notice.date}
                </span>
                <span className="mobile-home-notice-meta-item">
                  <Clock size={11} /> {notice.time}
                </span>
                <span className="mobile-home-notice-meta-item">
                  <User size={11} /> {notice.author}
                </span>
              </div>
              <p className="mobile-home-notice-desc">{notice.summary}</p>
            </div>
          ))}

          {/* By-Laws Feed */}
          {filteredBylaws.map((rule) => (
            <div key={rule.id} className="mobile-home-bylaw-card">
              <div className="mobile-home-bylaw-header">
                <span className="mobile-home-bylaw-tag">{rule.code}</span>
                <h4 className="mobile-home-bylaw-title">{rule.title}</h4>
              </div>
              <p className="mobile-home-bylaw-body">{rule.summary}</p>
              <div className="mobile-home-bylaw-actions">
                <button
                  type="button"
                  className="mobile-home-bylaw-dl-btn"
                  onClick={() => {
                    if (showToast) showToast(`Downloading ${rule.code} PDF documentation...`, 'success');
                  }}
                >
                  <Download size={11} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}

          {filteredNotices.length === 0 && filteredBylaws.length === 0 && (
            <div className="mobile-home-alert-spotlight" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div className="mobile-home-alert-spotlight-icon" style={{ borderColor: '#94a3b8', color: '#64748b' }}>
                <Info size={16} />
              </div>
              <div className="mobile-home-alert-spotlight-content">
                <div className="mobile-home-alert-spotlight-title" style={{ color: '#334155' }}>
                  No items found
                </div>
                <p className="mobile-home-alert-spotlight-text" style={{ color: '#64748b' }}>
                  No notices or by-laws match your filter criteria.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMMITTEE */}
      {activeSegment === 'committee' && (
        <div className="mobile-home-tab-pane">
          {/* Decisions Link Banner */}
          <div
            className="mobile-home-committee-banner"
            onClick={() => onNavigate('/committee/decisions/')}
            role="button"
            tabIndex={0}
          >
            <div className="mobile-home-committee-banner-text">
              <span className="mobile-home-committee-banner-title">
                Committee Decisions &amp; Voting
              </span>
              <span className="mobile-home-committee-banner-sub">
                Review minutes, motions &amp; approved resolutions
              </span>
            </div>
            <div className="mobile-home-committee-banner-icon">
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Committee Member Cards (NO SQUISHED TABLES!) */}
          <div className="mobile-home-card">
            <div className="mobile-home-card-header">
              <div className="mobile-home-card-title-group">
                <div className="mobile-home-card-icon-badge blue">
                  <Users size={14} />
                </div>
                <span>Elected Committee Members</span>
              </div>
              <span className="mobile-home-plan-chip">
                {propertyDetails.committeeMembers.length} Members
              </span>
            </div>

            <div className="mobile-home-card-body" style={{ padding: '8px 10px' }}>
              {propertyDetails.committeeMembers.map((member) => {
                const isChair = member.position.toLowerCase() === 'chairperson';
                return (
                  <div key={member.id} className="mobile-home-member-card">
                    <div className="mobile-home-member-info-left">
                      <div
                        className={`mobile-home-member-avatar ${
                          isChair ? 'chairperson' : 'member'
                        }`}
                      >
                        {member.initials || 'M'}
                      </div>
                      <div className="mobile-home-member-text">
                        <span className="mobile-home-member-name">
                          {member.name}
                        </span>
                        <div className="mobile-home-member-role-row">
                          <span
                            className={`mobile-home-member-role-badge ${
                              isChair ? 'chairperson' : 'member'
                            }`}
                          >
                            {member.position}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="mobile-home-member-lot">{member.lot}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MANAGEMENT & BUILDING */}
      {activeSegment === 'building' && (
        <div className="mobile-home-tab-pane">
          {/* Managing Company Details Card */}
          <div className="mobile-home-company-card">
            <div className="mobile-home-company-header">
              <div className="mobile-home-company-title-wrap">
                <div className="mobile-home-company-icon">
                  <Building2 size={16} />
                </div>
                <div>
                  <h4 className="mobile-home-company-name">
                    {propertyDetails.managingCompany.name}
                  </h4>
                  <p className="mobile-home-company-lic">
                    {propertyDetails.managingCompany.license}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="mobile-home-company-copy-btn"
                onClick={handleCopyCompanyContacts}
                title="Copy company contacts"
              >
                <Copy size={11} />
                <span>Copy</span>
              </button>
            </div>

            <div className="mobile-home-company-details-list">
              <div className="mobile-home-company-row">
                <MapPin size={13} />
                <span>{propertyDetails.managingCompany.address}</span>
              </div>
              <div className="mobile-home-company-row">
                <Clock size={13} />
                <span>{propertyDetails.managingCompany.hours}</span>
              </div>
              <div className="mobile-home-company-row">
                <Globe size={13} />
                <a
                  href={propertyDetails.managingCompany.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0d9488', textDecoration: 'none' }}
                >
                  {propertyDetails.managingCompany.website}
                </a>
              </div>
            </div>

            <div className="mobile-home-company-actions">
              <a
                href={`tel:${propertyDetails.managingCompany.phoneRaw}`}
                className="mobile-home-action-btn primary"
              >
                <Phone size={13} />
                <span>Call Office</span>
              </a>

              <a
                href={`mailto:${propertyDetails.managingCompany.email}`}
                className="mobile-home-action-btn secondary"
              >
                <Mail size={13} />
                <span>Email Office</span>
              </a>
            </div>
          </div>

          {/* Building Showcase Gallery */}
          <div className="mobile-home-gallery-card">
            <div className="mobile-home-card-header">
              <div className="mobile-home-card-title-group">
                <div className="mobile-home-card-icon-badge">
                  <Building size={14} />
                </div>
                <span>Building Showcase</span>
              </div>

              <span className="mobile-home-plan-chip">
                {activePhotoIndex + 1} of {galleryPhotos.length}
              </span>
            </div>

            <div className="mobile-home-gallery-viewport">
              <img
                src={currentPhoto.src}
                alt={currentPhoto.title}
                className="mobile-home-gallery-img"
                style={{ transform: `rotate(${photoRotation}deg)` }}
              />

              <button
                type="button"
                className="mobile-home-gallery-nav-btn prev"
                onClick={handlePrevPhoto}
                aria-label="Previous photo"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                className="mobile-home-gallery-nav-btn next"
                onClick={handleNextPhoto}
                aria-label="Next photo"
              >
                <ChevronRight size={18} />
              </button>

              <div className="mobile-home-gallery-top-badge">
                <button
                  type="button"
                  className="mobile-home-gallery-tool-btn"
                  onClick={handleRotateLeft}
                  title="Rotate CCW"
                  aria-label="Rotate CCW"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  type="button"
                  className="mobile-home-gallery-tool-btn"
                  onClick={handleRotateRight}
                  title="Rotate CW"
                  aria-label="Rotate CW"
                >
                  <RotateCw size={12} />
                </button>
                {onOpenLightbox && (
                  <button
                    type="button"
                    className="mobile-home-gallery-tool-btn"
                    onClick={() => onOpenLightbox(activePhotoIndex, photoRotation)}
                    title="Fullscreen"
                    aria-label="Fullscreen"
                  >
                    <Maximize2 size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="mobile-home-gallery-caption-strip">
              <h5 className="mobile-home-gallery-title">{currentPhoto.title}</h5>
              <p className="mobile-home-gallery-desc">{currentPhoto.caption}</p>
            </div>

            <div className="mobile-home-gallery-thumbs">
              {galleryPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  className={`mobile-home-gallery-thumb-btn ${
                    index === activePhotoIndex ? 'active' : ''
                  }`}
                  onClick={() => {
                    setPhotoRotation(0);
                    setActivePhotoIndex(index);
                  }}
                  aria-label={`Photo ${index + 1}`}
                >
                  <img src={photo.thumb} alt={photo.title} />
                </button>
              ))}
            </div>
          </div>

          {/* Location & Transit */}
          <div className="mobile-home-location-card">
            <div className="mobile-home-card-header" style={{ padding: '0 0 10px', borderBottom: 'none' }}>
              <div className="mobile-home-card-title-group">
                <div className="mobile-home-card-icon-badge emerald">
                  <MapPin size={14} />
                </div>
                <span>Location &amp; Transit</span>
              </div>
            </div>

            <div className="mobile-home-map-frame-box">
              <iframe
                className="mobile-home-map-iframe"
                title="Property Map View"
                src="https://www.openstreetmap.org/export/embed.html?bbox=144.9800%2C-37.9100%2C145.0160%2C-37.8740&amp;layer=mapnik&amp;marker=-37.8920%2C144.9980"
                loading="lazy"
              />
            </div>

            <div className="mobile-home-transit-title">Public Transit Proximity:</div>
            <div className="mobile-home-transit-list">
              {propertyDetails.location.transit.map((t) => (
                <div key={t.name} className="mobile-home-transit-item">
                  <span>
                    <strong>{t.type}:</strong> {t.name}
                  </span>
                  <span className="mobile-home-transit-dist">{t.distance}</span>
                </div>
              ))}
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                propertyDetails.address.fullFormatted
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-home-directions-btn"
            >
              <Navigation size={13} />
              <span>Get Directions on Google Maps</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

    </div>
  );
};

export default MobileHomeView;
