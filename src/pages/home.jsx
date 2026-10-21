import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Page, f7 } from 'framework7-react';
import {
  Home,
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
  Share2,
  AlertCircle,
  Sparkles,
  Info,
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
  Copy,
} from 'lucide-react';
import { authService } from '../js/services/auth.js';
import { usePortalSelection } from '../js/services/portal-selection.js';
import { NAV_ITEMS as BASE_NAV_ITEMS } from '../js/data/invoice-data.js';
import {
  STRATA_PROPERTY_DETAILS,
  GALLERY_PHOTOS,
  PROPERTY_NOTICES,
  PROPERTY_RULES_BYLAWS,
} from '../js/data/home-data.js';
import AppSidebar from '../components/AppSidebar.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
import LotSelector from '../components/LotSelector.jsx';
import QuickActionsPopup from '../components/QuickActionsPopup.jsx';
import AiAssistantPopup from '../components/AiAssistantPopup.jsx';
import FloatingActionButtons from '../components/FloatingActionButtons.jsx';
import MobileHomeView from '../components/MobileHomeView.jsx';

const HomePage = ({ onLogout }) => {
  // Current user info
  const currentUser = authService.getUser() || {
    name: 'Portal Resident',
    role: 'Resident Owner',
    unit: '101',
    email: 'resident@intellistrata.com',
  };

  // Shared Portal Property & Lot selection
  const {
    selectedProperty,
    selectedLot,
    setSelectedProperty,
    setSelectedLot,
    properties,
  } = usePortalSelection();

  // Navigation State
  const [navItems] = useState(() =>
    BASE_NAV_ITEMS.map((item) => ({
      ...item,
      active: item.id === 'home',
    }))
  );
  const [expandedNav, setExpandedNav] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navbarSearch, setNavbarSearch] = useState('');

  // Gallery State
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Tab & Filter States
  const [activeNoticeTab, setActiveNoticeTab] = useState('all'); // 'all' | 'notices' | 'bylaws'
  const [showEmptyBannerNotice, setShowEmptyBannerNotice] = useState(true);

  // Popups & FABs state
  const [activePopup, setActivePopup] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const popupRef = useRef(null);
  const fabGroupRef = useRef(null);
  const aiChatEndRef = useRef(null);

  // Toast Helper
  const showToast = useCallback((text, type = 'info') => {
    f7.toast
      .create({
        text,
        position: 'bottom',
        closeTimeout: 3000,
        cssClass: type === 'success' ? 'toast-success' : '',
      })
      .open();
  }, []);

  // Gallery Navigation Handlers
  const handlePrevPhoto = useCallback(() => {
    setPhotoRotation(0);
    setActivePhotoIndex((prev) =>
      prev === 0 ? GALLERY_PHOTOS.length - 1 : prev - 1
    );
  }, []);

  const handleNextPhoto = useCallback(() => {
    setPhotoRotation(0);
    setActivePhotoIndex((prev) =>
      prev === GALLERY_PHOTOS.length - 1 ? 0 : prev + 1
    );
  }, []);

  const handleRotateLeft = useCallback(() => {
    setPhotoRotation((prev) => (prev - 90 + 360) % 360);
    showToast('Photo rotated 90° CCW');
  }, [showToast]);

  const handleRotateRight = useCallback(() => {
    setPhotoRotation((prev) => (prev + 90) % 360);
    showToast('Photo rotated 90° CW');
  }, [showToast]);

  // Sidebar navigation click handler
  const handleNavClick = (item) => {
    if (item.id === 'home') {
      // Already on home
    } else if (item.id === 'invoices') {
      try {
        f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/invoices/';
      }
    } else if (item.id === 'levy') {
      try {
        f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/levy/';
      }
    } else if (item.id === 'maintenance') {
      try {
        f7.views.main.router.navigate('/maintenance/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/maintenance/';
      }
    } else if (item.id === 'documents') {
      try {
        f7.views.main.router.navigate('/documents/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/documents/';
      }
    } else if (item.id === 'profile') {
      try {
        f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/profile/';
      }
    } else if (item.id === 'payments') {
      try {
        f7.views.main.router.navigate('/payment-plan/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/payment-plan/';
      }
    } else if (item.id === 'committee') {
      try {
        f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/committee/decisions/';
      }
    } else {
      showToast(`${item.label} section coming soon`);
    }
  };

  const handleChildNavClick = (child) => {
    if (child === 'Invoice Approval' || child === 'All Invoices') {
      try {
        f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/invoices/';
      }
    } else if (child === 'Levy Overview' || child === 'My Levy') {
      try {
        f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/levy/';
      }
    } else if (child === 'Report Issues') {
      try {
        f7.views.main.router.navigate('/report-issues/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/report-issues/';
      }
    } else if (child === 'Maintenance') {
      try {
        f7.views.main.router.navigate('/maintenance/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/maintenance/';
      }
    } else if (child === 'Committee Decisions') {
      try {
        f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/committee/decisions/';
      }
    } else {
      showToast(`Section ${child} coming soon`);
    }
  };

  const handleLogoutClick = async () => {
    await authService.logout();
    if (onLogout) {
      onLogout();
    }
    try {
      f7.views.main.router.navigate('/login/', { reloadCurrent: true, ignoreCache: true });
    } catch (e) {
      window.location.href = '/login/';
    }
  };

  // Current active photo object
  const currentPhoto = GALLERY_PHOTOS[activePhotoIndex] || GALLERY_PHOTOS[0];

  // Filtered notices
  const displayedNotices = useMemo(() => {
    if (activeNoticeTab === 'bylaws') return [];
    return PROPERTY_NOTICES;
  }, [activeNoticeTab]);

  const displayedBylaws = useMemo(() => {
    if (activeNoticeTab === 'notices') return [];
    return PROPERTY_RULES_BYLAWS;
  }, [activeNoticeTab]);

  return (
    <Page name="home" noNavbar noToolbar className="home-page">
      <div className="home-app-shell">
        {/* ===== SHARED SIDEBAR ===== */}
        <AppSidebar
          isOpen={isSidebarOpen}
          navItems={navItems}
          expandedNav={expandedNav}
          activeNavId="home"
          activeChildNav=""
          onToggleExpand={(id) => setExpandedNav((prev) => ({ ...prev, [id]: !prev[id] }))}
          onNavClick={handleNavClick}
          onChildNavClick={handleChildNavClick}
          onLogout={handleLogoutClick}
          onLogoClick={() => showToast('Intellistrata Portal')}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className="home-main-area" id="home-main-area">
          {/* Top Navbar */}
          <AppNavbar
            searchTerm={navbarSearch}
            onSearchChange={(e) => setNavbarSearch(e.target.value)}
            onSearchClear={() => setNavbarSearch('')}
            searchPlaceholder="Search notices, rules, contacts, building info..."
            selectedProperty={selectedProperty}
            properties={properties}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              showToast(`Switched to ${prop.name}`, 'success');
            }}
            notificationCount={3}
            currentUser={currentUser}
            onLogout={handleLogoutClick}
            onMobileMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
          />

          {/* Scrollable Content Area */}
          <div className="home-content-area" id="home-content-area">
            {/* DESKTOP EXPERIENCE (> 900px) */}
            <div className="home-desktop-view">
              <div className="home-content-container">
                {/* Breadcrumb & Title Bar */}
                <div className="home-title-row">
                  <div>
                    <nav className="home-breadcrumbs" aria-label="Breadcrumb">
                      <a href="/">Portal</a>
                      <span>&bull;</span>
                      <span>Home</span>
                    </nav>
                    <h1 className="home-page-title">
                      <span>Home</span>
                    </h1>
                  </div>

                  {/* Shared Lot Selector */}
                  <div className="home-title-right">
                    <LotSelector
                      selectedLot={selectedLot}
                      lots={selectedProperty?.lots || ['All Lots', 'Lot A-01', 'Lot A-02', 'Lot A-03']}
                      propertyName={selectedProperty?.name || STRATA_PROPERTY_DETAILS.schemeName}
                      onSelectLot={(lot) => {
                        setSelectedLot(lot);
                        showToast(`Selected ${lot}`, 'info');
                      }}
                    />
                  </div>
                </div>

                {/* ===== HERO / WELCOME CARD ===== */}
                <section className="home-hero-card" aria-label="Property Overview">
                  <div className="home-hero-accent-bar" />
                  <div className="home-hero-body">
                    <div className="home-hero-left">
                      {/* Modern Hexagonal DEMO / Strata Badge */}
                      <div className="home-hero-logo-box" title="Owners Corporation Registered Badge">
                        <svg
                          className="home-hero-crest-svg"
                          viewBox="0 0 100 100"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <polygon
                            points="50,5 92,28 92,72 50,95 8,72 8,28"
                            stroke="#0284c7"
                            strokeWidth="6"
                            fill="rgba(14, 165, 233, 0.08)"
                          />
                          <path
                            d="M50 20 L75 36 V62 L50 78 L25 62 V36 Z"
                            fill="rgba(14, 165, 233, 0.15)"
                            stroke="#0ea5e9"
                            strokeWidth="3"
                          />
                        </svg>
                        <span className="home-hero-logo-text">DEMO</span>
                      </div>

                      {/* Property Title & Address */}
                      <div className="home-hero-info">
                        <div className="home-hero-title-row">
                          <h2 className="home-hero-welcome-title">
                            Welcome to {selectedProperty?.name || STRATA_PROPERTY_DETAILS.schemeName}
                          </h2>
                          <span className="home-hero-scheme-badge">Active Scheme</span>
                        </div>
                        <div className="home-hero-address-row">
                          <MapPin size={14} />
                          <span>{selectedProperty?.address || STRATA_PROPERTY_DETAILS.address.fullFormatted}</span>
                        </div>

                        {/* Selected Property and Lot Display (Details Only) */}
                        <div className="home-strata-plan-row">
                          <div className="home-detail-display-pill">
                            <Building2 size={13} className="home-strata-pill-icon" />
                            <span className="home-detail-display-label">Property:</span>
                            <span className="home-detail-display-value">
                              {selectedProperty?.name || STRATA_PROPERTY_DETAILS.schemeName}
                            </span>
                            {STRATA_PROPERTY_DETAILS.planNumber && (
                              <span className="home-strata-plan-code">
                                Plan {STRATA_PROPERTY_DETAILS.planNumber}
                              </span>
                            )}
                          </div>

                          <div className="home-detail-display-pill">
                            <Building size={13} className="home-strata-pill-icon" />
                            <span className="home-detail-display-label">Lot:</span>
                            <span className="home-detail-display-value font-semibold">
                              {selectedLot || 'All Lots'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metric Quick-Pills on Hero Right */}
                    <div className="home-hero-metrics">
                      <div
                        className="home-hero-metric-chip"
                        onClick={() => {
                          try {
                            f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true });
                          } catch (e) {
                            window.location.href = '/levy/';
                          }
                        }}
                        title="View Levy Breakdown"
                      >
                        <div className="home-hero-metric-icon emerald">
                          <CreditCard size={16} />
                        </div>
                        <div className="home-hero-metric-text">
                          <span className="home-hero-metric-val">Current (Paid)</span>
                          <span className="home-hero-metric-lbl">Levy Status</span>
                        </div>
                      </div>

                      <div
                        className="home-hero-metric-chip"
                        onClick={() => {
                          const el = document.getElementById('home-notices-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        title="View Building Notices"
                      >
                        <div className="home-hero-metric-icon amber">
                          <Bell size={16} />
                        </div>
                        <div className="home-hero-metric-text">
                          <span className="home-hero-metric-val">{PROPERTY_NOTICES.length} Active</span>
                          <span className="home-hero-metric-lbl">Notices &amp; Rules</span>
                        </div>
                      </div>

                      <div
                        className="home-hero-metric-chip"
                        onClick={() => {
                          const el = document.getElementById('home-oc-details-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        title="View Strata Committee"
                      >
                        <div className="home-hero-metric-icon emerald">
                          <Users size={16} />
                        </div>
                        <div className="home-hero-metric-text">
                          <span className="home-hero-metric-val">3 Members</span>
                          <span className="home-hero-metric-lbl">Strata Committee</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ===== TWO-COLUMN MAIN GRID ===== */}
                <div className="home-grid-layout">
                  {/* Left Column: Owners Corporation Details, Building Notices & Rules, Community News */}
                  <div className="home-grid-column primary-column">
                    {/* 1. Owners Corporation & Strata Plan Details Card (Core Scheme Identity) */}
                    <div className="home-section-card" id="home-oc-details-section">
                      <div className="home-section-header">
                        <div className="home-section-header-title">
                          <div className="home-section-icon-badge">
                            <Landmark size={16} />
                          </div>
                          <span>Owners Corporation / Strata Plan Details</span>
                        </div>
                        <span className="home-page-title-badge">Plan {STRATA_PROPERTY_DETAILS.planNumber}</span>
                      </div>

                      <div className="home-oc-card-body">
                        {/* Key Details Grid */}
                        <div className="home-oc-details-grid">
                          <div className="home-oc-detail-item">
                            <div className="home-oc-icon-circle">
                              <Building2 size={16} />
                            </div>
                            <div className="home-oc-info">
                              <span className="home-oc-label">Plan Number</span>
                              <span className="home-oc-value font-mono">{STRATA_PROPERTY_DETAILS.planNumber}</span>
                            </div>
                          </div>

                          <div className="home-oc-detail-item">
                            <div className="home-oc-icon-circle">
                              <User size={16} />
                            </div>
                            <div className="home-oc-info">
                              <span className="home-oc-label">Owner Name On Title</span>
                              <span className="home-oc-value font-semibold">{STRATA_PROPERTY_DETAILS.ownerNameOnTitle}</span>
                            </div>
                          </div>

                          <div className="home-oc-detail-item full-width">
                            <div className="home-oc-icon-circle">
                              <Building size={16} />
                            </div>
                            <div className="home-oc-info">
                              <span className="home-oc-label">Strata Plan Entity</span>
                              <span className="home-oc-value font-medium">{STRATA_PROPERTY_DETAILS.legalEntityName}</span>
                            </div>
                          </div>

                          <div className="home-oc-detail-item">
                            <div className="home-oc-icon-circle">
                              <User size={16} />
                            </div>
                            <div className="home-oc-info">
                              <span className="home-oc-label">Strata Manager</span>
                              <span className="home-oc-value">{STRATA_PROPERTY_DETAILS.strataManager.name}</span>
                            </div>
                          </div>

                          <div className="home-oc-detail-item">
                            <div className="home-oc-icon-circle">
                              <Phone size={16} />
                            </div>
                            <div className="home-oc-info">
                              <span className="home-oc-label">Phone</span>
                              <span className="home-oc-value text-muted">
                                {STRATA_PROPERTY_DETAILS.strataManager.phone}
                                <span className="home-oc-sub-note"> (Office: {STRATA_PROPERTY_DETAILS.managingCompany.phone})</span>
                              </span>
                            </div>
                          </div>

                          <div className="home-oc-detail-item full-width">
                            <div className="home-oc-icon-circle">
                              <Mail size={16} />
                            </div>
                            <div className="home-oc-info">
                              <span className="home-oc-label">Manager Direct Email</span>
                              <a
                                href={`mailto:${STRATA_PROPERTY_DETAILS.strataManager.email}`}
                                className="home-oc-value home-contact-link"
                              >
                                {STRATA_PROPERTY_DETAILS.strataManager.email}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Committee Members Table Section */}
                        <div className="home-committee-section">
                          <div className="home-committee-header">
                            <div className="home-committee-title-group">
                              <div className="home-section-icon-badge">
                                <Users size={16} />
                              </div>
                              <h4 className="home-committee-title">Committee Members</h4>
                              <span className="home-committee-count-badge">
                                {STRATA_PROPERTY_DETAILS.committeeMembers.length} Members
                              </span>
                            </div>
                            <a
                              href="/committee/decisions/"
                              className="home-committee-decisions-link"
                              onClick={(e) => {
                                e.preventDefault();
                                try {
                                  f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
                                } catch (err) {
                                  window.location.href = '/#!/committee/decisions/';
                                }
                              }}
                            >
                              <span>Committee Decisions</span>
                              <ChevronRight size={14} />
                            </a>
                          </div>

                          <div className="home-committee-table-wrap">
                            <table className="home-committee-table">
                              <thead>
                                <tr>
                                  <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                                  <th>Name</th>
                                  <th>Position</th>
                                  <th style={{ textAlign: 'right' }}>Lot</th>
                                </tr>
                              </thead>
                              <tbody>
                                {STRATA_PROPERTY_DETAILS.committeeMembers.map((member) => (
                                  <tr key={member.id}>
                                    <td style={{ textAlign: 'center' }} className="home-committee-num-cell">
                                      {member.id}
                                    </td>
                                    <td>
                                      <div className="home-committee-member-name-row">
                                        <span className="home-committee-avatar">{member.initials}</span>
                                        <span className="home-committee-member-name">{member.name}</span>
                                      </div>
                                    </td>
                                    <td>
                                      <span
                                        className={`home-committee-role-badge ${member.position.toLowerCase() === 'chairperson' ? 'chairperson' : 'member'
                                          }`}
                                      >
                                        {member.position}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }} className="home-committee-lot-cell">
                                      {member.lot}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Building Notices & Rules Card */}
                    <div className="home-section-card" id="home-notices-section">
                      <div className="home-section-header">
                        <div className="home-section-header-title">
                          <div className="home-section-icon-badge">
                            <FileText size={16} />
                          </div>
                          <span>Building Notices &amp; Rules</span>
                        </div>

                        {/* Tab Switcher */}
                        <div className="home-pill-tabs">
                          <button
                            type="button"
                            className={`home-pill-tab ${activeNoticeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveNoticeTab('all')}
                          >
                            All
                          </button>
                          <button
                            type="button"
                            className={`home-pill-tab ${activeNoticeTab === 'notices' ? 'active' : ''}`}
                            onClick={() => setActiveNoticeTab('notices')}
                          >
                            Notices ({PROPERTY_NOTICES.length})
                          </button>
                          <button
                            type="button"
                            className={`home-pill-tab ${activeNoticeTab === 'bylaws' ? 'active' : ''}`}
                            onClick={() => setActiveNoticeTab('bylaws')}
                          >
                            By-Laws ({PROPERTY_RULES_BYLAWS.length})
                          </button>
                        </div>
                      </div>

                      {/* Soft Alert Banner */}
                      {showEmptyBannerNotice && (
                        <div className="home-notice-alert-box">
                          <AlertCircle size={18} className="home-notice-alert-icon" />
                          <span>Currently there are no news items available for this property.</span>
                        </div>
                      )}

                      {/* Interactive Notices & By-Laws List */}
                      <div className="home-notices-list">
                        {displayedNotices.map((notice) => (
                          <div key={notice.id} className="home-notice-card">
                            <div className="home-notice-header">
                              <h4 className="home-notice-title">{notice.title}</h4>
                              <span
                                className={`home-notice-urgency-badge ${notice.urgency.toLowerCase()}`}
                              >
                                {notice.urgency}
                              </span>
                            </div>
                            <div className="home-notice-meta">
                              <span className="home-notice-meta-item">
                                <Calendar size={13} /> {notice.date}
                              </span>
                              <span className="home-notice-meta-item">
                                <Clock size={13} /> {notice.time}
                              </span>
                              <span className="home-notice-meta-item">
                                <User size={13} /> {notice.author}
                              </span>
                            </div>
                            <p className="home-notice-summary">{notice.summary}</p>
                          </div>
                        ))}

                        {displayedBylaws.map((rule) => (
                          <div key={rule.id} className="home-bylaw-item">
                            <div className="home-bylaw-info">
                              <div className="home-bylaw-title-row">
                                <span className="home-bylaw-code">{rule.code}</span>
                                <span className="home-bylaw-title">{rule.title}</span>
                              </div>
                              <p className="home-bylaw-summary">{rule.summary}</p>
                            </div>
                            <button
                              type="button"
                              className="home-bylaw-download-btn"
                              onClick={() => showToast(`Downloading ${rule.code} documentation...`, 'success')}
                            >
                              <Download size={13} />
                              <span>PDF</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Managing Company Details, Photo Gallery, Location */}
                  <div className="home-grid-column secondary-column">
                    {/* Managing Company Details Card */}
                    <div className="home-section-card">
                      <div className="home-section-header">
                        <div className="home-section-header-title">
                          <div className="home-section-icon-badge">
                            <Building2 size={16} />
                          </div>
                          <span>Managing Company Details</span>
                        </div>

                        <button
                          type="button"
                          className="home-contact-copy-btn"
                          title="Copy all managing company contacts to clipboard"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(
                                `Managing Company: ${STRATA_PROPERTY_DETAILS.managingCompany.name}\nAddress: ${STRATA_PROPERTY_DETAILS.managingCompany.address}\nPhone: ${STRATA_PROPERTY_DETAILS.managingCompany.phone}\nWebsite: ${STRATA_PROPERTY_DETAILS.managingCompany.website}\nEmail: ${STRATA_PROPERTY_DETAILS.managingCompany.email}\nStrata Manager: ${STRATA_PROPERTY_DETAILS.strataManager.name} (${STRATA_PROPERTY_DETAILS.strataManager.email})`
                              );
                            }
                            showToast('Managing company contacts copied!', 'success');
                          }}
                        >
                          <Copy size={13} />
                          <span>Copy Contacts</span>
                        </button>
                      </div>

                      <div className="home-contact-body">
                        {/* Managing Company */}
                        <div className="home-contact-item">
                          <div className="home-contact-icon-circle">
                            <Building2 size={18} />
                          </div>
                          <div className="home-contact-info-wrap">
                            <span className="home-contact-label">Managing Company:</span>
                            <span className="home-contact-value font-semibold">
                              {STRATA_PROPERTY_DETAILS.managingCompany.name}
                            </span>
                            <span className="home-contact-subtext">
                              {STRATA_PROPERTY_DETAILS.managingCompany.license}
                            </span>
                          </div>
                        </div>

                        {/* Company Address */}
                        <div className="home-contact-item">
                          <div className="home-contact-icon-circle">
                            <MapPin size={18} />
                          </div>
                          <div className="home-contact-info-wrap">
                            <span className="home-contact-label">Address:</span>
                            <span className="home-contact-value">
                              {STRATA_PROPERTY_DETAILS.managingCompany.address}
                            </span>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="home-contact-item">
                          <div className="home-contact-icon-circle">
                            <Phone size={18} />
                          </div>
                          <div className="home-contact-info-wrap">
                            <span className="home-contact-label">Phone:</span>
                            <a
                              href={`tel:${STRATA_PROPERTY_DETAILS.managingCompany.phoneRaw}`}
                              className="home-contact-value home-contact-link font-medium"
                            >
                              {STRATA_PROPERTY_DETAILS.managingCompany.phone}
                            </a>
                            <span className="home-contact-subtext">
                              {STRATA_PROPERTY_DETAILS.managingCompany.hours}
                            </span>
                          </div>
                        </div>

                        {/* Website */}
                        <div className="home-contact-item">
                          <div className="home-contact-icon-circle">
                            <Globe size={18} />
                          </div>
                          <div className="home-contact-info-wrap">
                            <span className="home-contact-label">Website:</span>
                            <a
                              href={STRATA_PROPERTY_DETAILS.managingCompany.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="home-contact-value home-contact-link"
                            >
                              <span>{STRATA_PROPERTY_DETAILS.managingCompany.website}</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>

                        {/* General Company Email */}
                        <div className="home-contact-item">
                          <div className="home-contact-icon-circle">
                            <Mail size={18} />
                          </div>
                          <div className="home-contact-info-wrap">
                            <span className="home-contact-label">General Email:</span>
                            <a
                              href={`mailto:${STRATA_PROPERTY_DETAILS.managingCompany.email}`}
                              className="home-contact-value home-contact-link"
                            >
                              {STRATA_PROPERTY_DETAILS.managingCompany.email}
                            </a>
                          </div>
                        </div>

                        {/* Strata Manager */}
                        <div className="home-contact-item">
                          <div className="home-contact-icon-circle">
                            <User size={18} />
                          </div>
                          <div className="home-contact-info-wrap">
                            <span className="home-contact-label">Strata Manager:</span>
                            <span className="home-contact-value">
                              {STRATA_PROPERTY_DETAILS.strataManager.name}
                            </span>
                            <span className="home-contact-subtext">
                              {STRATA_PROPERTY_DETAILS.strataManager.role}
                            </span>
                          </div>
                        </div>

                        {/* Quick Contact Action Buttons */}
                        <div className="home-contact-actions-strip">
                          <a
                            href={`tel:${STRATA_PROPERTY_DETAILS.managingCompany.phoneRaw}`}
                            className="home-contact-strip-btn"
                          >
                            <Phone size={13} />
                            <span>Call Office</span>
                          </a>
                          <a
                            href={`mailto:${STRATA_PROPERTY_DETAILS.managingCompany.email}`}
                            className="home-contact-strip-btn"
                          >
                            <Mail size={13} />
                            <span>Email Office</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* 3. Building Showcase (Photo Gallery) */}
                    <div className="home-section-card">
                      <div className="home-section-header">
                        <div className="home-section-header-title">
                          <div className="home-section-icon-badge">
                            <Building size={16} />
                          </div>
                          <span>Building Showcase</span>
                        </div>

                        <div className="home-section-header-actions">
                          <span className="home-page-title-badge">
                            {activePhotoIndex + 1} of {GALLERY_PHOTOS.length}
                          </span>
                          <button
                            type="button"
                            className="home-gallery-tool-btn"
                            onClick={() => setIsLightboxOpen(true)}
                            title="View Fullscreen"
                            aria-label="View Fullscreen"
                          >
                            <Maximize2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Gallery Viewport */}
                      <div className="home-gallery-wrapper">
                        <div className="home-gallery-viewport">
                          <img
                            src={currentPhoto.src}
                            alt={currentPhoto.title}
                            className="home-gallery-img"
                            style={{
                              transform: `rotate(${photoRotation}deg)`,
                            }}
                          />

                          {/* Navigation Arrows */}
                          <button
                            type="button"
                            className="home-gallery-arrow prev"
                            onClick={handlePrevPhoto}
                            aria-label="Previous image"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            type="button"
                            className="home-gallery-arrow next"
                            onClick={handleNextPhoto}
                            aria-label="Next image"
                          >
                            <ChevronRight size={20} />
                          </button>

                          {/* Rotate Controls */}
                          <div className="home-gallery-tool-bar">
                            <button
                              type="button"
                              className="home-gallery-tool-btn"
                              onClick={handleRotateLeft}
                              title="Rotate Counter-Clockwise"
                              aria-label="Rotate Counter-Clockwise"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              type="button"
                              className="home-gallery-tool-btn"
                              onClick={handleRotateRight}
                              title="Rotate Clockwise"
                              aria-label="Rotate Clockwise"
                            >
                              <RotateCw size={14} />
                            </button>
                          </div>

                          {/* Photo Caption Overlay */}
                          <div className="home-gallery-caption-overlay">
                            <h4 className="home-gallery-caption-title">{currentPhoto.title}</h4>
                            <p className="home-gallery-caption-text">{currentPhoto.caption}</p>
                          </div>
                        </div>

                        {/* Thumbnail Strip */}
                        <div className="home-gallery-thumbs">
                          {GALLERY_PHOTOS.map((photo, index) => (
                            <button
                              key={photo.id}
                              type="button"
                              className={`home-gallery-thumb-btn ${index === activePhotoIndex ? 'active' : ''
                                }`}
                              onClick={() => {
                                setPhotoRotation(0);
                                setActivePhotoIndex(index);
                              }}
                              aria-label={`Select photo ${index + 1}`}
                            >
                              <img src={photo.thumb} alt={photo.title} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 4. Property Location & Transit Card */}
                    <div className="home-section-card">
                      <div className="home-section-header">
                        <div className="home-section-header-title">
                          <div className="home-section-icon-badge">
                            <MapPin size={16} />
                          </div>
                          <span>Location &amp; Transit</span>
                        </div>

                        <div className="home-section-header-actions">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              STRATA_PROPERTY_DETAILS.address.fullFormatted
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="home-bylaw-download-btn"
                            title="Open Google Maps"
                          >
                            <Navigation size={12} />
                            <span>Google Maps</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>

                      <div className="home-location-compact-wrap">
                        <div className="home-map-container compact">
                          <iframe
                            className="home-map-iframe"
                            title="Property Map View"
                            src="https://www.openstreetmap.org/export/embed.html?bbox=144.9800%2C-37.9100%2C145.0160%2C-37.8740&amp;layer=mapnik&amp;marker=-37.8920%2C144.9980"
                            loading="lazy"
                          />
                        </div>

                        <div className="home-location-details-box">
                          <div className="home-location-transit-title">Public Transit Proximity:</div>
                          <div className="home-map-transit-list">
                            {STRATA_PROPERTY_DETAILS.location.transit.map((t) => (
                              <div key={t.name} className="home-map-transit-item">
                                <span>
                                  <strong>{t.type}:</strong> {t.name}
                                </span>
                                <span className="home-map-transit-dist">{t.distance}</span>
                              </div>
                            ))}
                          </div>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                              STRATA_PROPERTY_DETAILS.address.fullFormatted
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="home-map-directions-btn"
                          >
                            <Navigation size={13} />
                            <span>Get Driving / Transit Directions</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE EXPERIENCE (<= 900px) */}
            <MobileHomeView
              propertyDetails={STRATA_PROPERTY_DETAILS}
              selectedProperty={selectedProperty}
              selectedLot={selectedLot}
              properties={properties}
              onSelectProperty={(prop) => {
                setSelectedProperty(prop);
                showToast(`Switched to ${prop.name}`, 'success');
              }}
              onSelectLot={(lot) => {
                setSelectedLot(lot);
                showToast(`Selected ${lot}`, 'info');
              }}
              currentUser={currentUser}
              galleryPhotos={GALLERY_PHOTOS}
              notices={PROPERTY_NOTICES}
              bylaws={PROPERTY_RULES_BYLAWS}
              showToast={showToast}
              onNavigate={(path) => {
                try {
                  f7.views.main.router.navigate(path, { animate: false, reloadCurrent: true });
                } catch (e) {
                  window.location.href = path;
                }
              }}
              onOpenLightbox={(idx, rot) => {
                setActivePhotoIndex(idx);
                setPhotoRotation(rot || 0);
                setIsLightboxOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {isLightboxOpen && (
        <div className="home-lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <button
            type="button"
            className="home-lightbox-close"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close fullscreen"
          >
            <X size={20} />
          </button>
          <img
            src={currentPhoto.src}
            alt={currentPhoto.title}
            className="home-lightbox-img"
            style={{ transform: `rotate(${photoRotation}deg)` }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onQuickActionsClick={() => setActivePopup('quickActions')}
        onAiAssistantClick={() => setActivePopup('aiAssistant')}
        activePopup={activePopup}
        fabGroupRef={fabGroupRef}
      />

      {/* Quick Actions Popup */}
      {activePopup === 'quickActions' && (
        <QuickActionsPopup
          popupRef={popupRef}
          onClose={() => setActivePopup(null)}
          onAction={(key) => {
            setActivePopup(null);
            if (key === 'report') {
              try { f7.views.main.router.navigate('/report-issues/', { animate: false }); } catch (e) { window.location.href = '/report-issues/'; }
            } else if (key === 'levy') {
              try { f7.views.main.router.navigate('/levy/', { animate: false }); } catch (e) { window.location.href = '/levy/'; }
            } else {
              showToast(`Action "${key}" triggered`);
            }
          }}
        />
      )}

      {/* AI Assistant Popup */}
      {activePopup === 'aiAssistant' && (
        <AiAssistantPopup
          popupRef={popupRef}
          onClose={() => setActivePopup(null)}
          messages={aiMessages}
          isTyping={isAiTyping}
          input={aiInput}
          onInputChange={(e) => setAiInput(e.target.value)}
          onSubmit={(e) => {
            e.preventDefault();
            if (!aiInput.trim()) return;
            const query = aiInput.trim();
            setAiInput('');
            setAiMessages((prev) => [
              ...prev,
              { id: Date.now(), sender: 'user', text: query, time: 'Just now' },
            ]);
            setIsAiTyping(true);
            setTimeout(() => {
              setAiMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + 1,
                  sender: 'assistant',
                  text: `I've analyzed your question about "${query}". For ${STRATA_PROPERTY_DETAILS.schemeName}, managing agent DEMOX Strata Pty Ltd and strata manager John Smith are on duty. Annual fire testing is scheduled for 28 Sep 2026. Let me know if you would like me to file a maintenance request or check your levy balance.`,
                  time: 'Just now',
                },
              ]);
              setIsAiTyping(false);
            }, 500);
          }}
          onSuggestionClick={(query) => {
            setAiMessages((prev) => [
              ...prev,
              { id: Date.now(), sender: 'user', text: query, time: 'Just now' },
            ]);
            setIsAiTyping(true);
            setTimeout(() => {
              setAiMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + 1,
                  sender: 'assistant',
                  text: `Here is information on "${query}": By-law 04 sets noise curfews from 10 PM on weekdays. General waste collection runs Tuesdays & Fridays. For urgent leaks or power outages, call our 24/7 hotline at 1800 555 888.`,
                  time: 'Just now',
                },
              ]);
              setIsAiTyping(false);
            }, 500);
          }}
          chatEndRef={aiChatEndRef}
        />
      )}
    </Page>
  );
};

export default HomePage;
