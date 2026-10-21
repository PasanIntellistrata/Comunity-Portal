import React, { useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Page, f7 } from 'framework7-react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Camera,
  Pencil,
  Calendar,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  Shield,
  SlidersHorizontal,
  Bell,
  Clock,
  Lock,
  Smartphone,
  Laptop,
  ChevronRight,
  RefreshCw,
  X,
  Save,
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
  UserCheck,
  Share2,
  Settings,
  Flame,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { authService } from '../js/services/auth.js';
import { NAV_ITEMS as BASE_NAV_ITEMS } from '../js/data/invoice-data.js';
import { usePortalSelection } from '../js/services/portal-selection.js';
import AppSidebar from '../components/AppSidebar.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
import QuickActionsPopup from '../components/QuickActionsPopup.jsx';
import AiAssistantPopup from '../components/AiAssistantPopup.jsx';
import FloatingActionButtons from '../components/FloatingActionButtons.jsx';
import MobileProfileView from '../components/MobileProfileView.jsx';

const MyProfilePage = () => {
  // Global portal state
  const { selectedProperty, setSelectedProperty, properties } = usePortalSelection();

  // Seed profile from the currently logged-in user (Google / Microsoft / email)
  const authUser = authService.getUser() || {};

  // Derive initials from auth user name
  const authInitials = authUser.name
    ? authUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PU';

  // User profile state — top-level identity fields are always seeded from auth
  const [userProfile, setUserProfile] = useState({
    fullName: authUser.name || 'Pasan Udara',
    preferredName: authUser.name ? authUser.name.split(' ')[0] : 'Pasan',
    role: authUser.role || 'Resident Owner',
    committeeRole: authUser.role || 'Strata Committee Chairperson',
    email: authUser.email || 'pasan.udara@example.com',
    secondaryEmail: 'pasan.work@example.com',
    emailVerified: true,
    phone: '+94 77 123 4567',
    secondaryPhone: '+94 71 555 9988',
    phoneVerified: true,
    dob: '28 Jun 1999',
    address: 'Block A, Unit 3, Green Valley Residence, Nugegoda',
    lotNumber: authUser.unit ? `Lot A-${String(authUser.unit).padStart(2, '0')}` : 'Lot A-03',
    unitNumber: authUser.unit ? `Unit ${authUser.unit}, Level 2` : 'Unit 3, Level 2',
    building: 'Green Valley Residence - Tower A',
    unitEntitlement: '125 / 10,000 UOE',
    parkingBay: 'Basement 2, Bay #14',
    storageLot: 'Storage Locker #S-08',
    occupancyType: 'Owner Occupier',
    joinedOn: '15 Jan 2026',
    initials: authInitials,
    emergencyContact: {
      name: 'Dilini Udara',
      relationship: 'Spouse',
      phone: '+94 71 987 6543',
      email: 'dilini.u@example.com',
    },
    manager: {
      name: 'Sarah Jenkins',
      title: 'Senior Strata Manager',
      agency: 'Intellistrata Management',
      phone: '+94 11 234 5678',
      email: 's.jenkins@intellistrata.com',
      hours: 'Mon - Fri: 8:30 AM - 5:30 PM',
    },
    security: {
      twoFactorEnabled: true,
      lastPasswordChange: '10 May 2026',
      loginAlerts: true,
      activeSessionsCount: 2,
    },
    notifications: {
      emailNotices: true,
      smsLevyAlerts: true,
      pushMaintenance: true,
      communityEvents: false,
    },
  });

  const currentUser = {
    name: userProfile.fullName,
    role: userProfile.role,
    email: userProfile.email,
    unit: authUser.unit || '',
    initials: userProfile.initials,
  };

  // Navigation & UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState({});
  const [activeTab, setActiveTab] = useState('Overview');
  const [navbarSearch, setNavbarSearch] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ...userProfile });

  // Popups & FABs state
  const [activePopup, setActivePopup] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const popupRef = useRef(null);
  const fabGroupRef = useRef(null);
  const aiChatEndRef = useRef(null);

  // Toast notification state
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMsg(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  }, []);

  const handleCopy = (text, fieldKey) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldKey);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Profile completion calculation
  const completionMilestones = useMemo(() => {
    return [
      {
        id: 'personal',
        label: 'Personal Information',
        desc: 'Full name, date of birth & contact channels',
        completed: Boolean(userProfile.fullName && userProfile.dob),
        weight: 20,
      },
      {
        id: 'contact',
        label: 'Contact Verification',
        desc: 'Verified email & mobile number',
        completed: Boolean(userProfile.emailVerified && userProfile.phoneVerified),
        weight: 20,
      },
      {
        id: 'photo',
        label: 'Profile Photo',
        desc: 'Avatar picture or initials badge',
        completed: true,
        weight: 15,
      },
      {
        id: 'security',
        label: 'Security & 2FA Setup',
        desc: 'Two-factor auth & secure password',
        completed: Boolean(userProfile.security.twoFactorEnabled),
        weight: 20,
      },
      {
        id: 'emergency',
        label: 'Emergency Contact',
        desc: 'Next of kin details for building incidents',
        completed: Boolean(userProfile.emergencyContact?.name && userProfile.emergencyContact?.phone),
        weight: 10,
      },
      {
        id: 'notifications',
        label: 'Notification Preferences',
        desc: 'Set communication channels for levy & AGM notices',
        completed: Boolean(userProfile.notifications?.communityEvents),
        weight: 15,
      },
    ];
  }, [userProfile]);

  const completionPercentage = useMemo(() => {
    return completionMilestones.reduce((acc, item) => {
      return acc + (item.completed ? item.weight : 0);
    }, 0);
  }, [completionMilestones]);

  const nextIncompleteMilestone = useMemo(() => {
    return completionMilestones.find((m) => !m.completed);
  }, [completionMilestones]);

  // Sidebar navigation items
  const navItems = useMemo(() => {
    return BASE_NAV_ITEMS.map((item) => ({
      ...item,
      active: item.id === 'profile',
    }));
  }, []);

  const handleToggleExpand = (id) => {
    setExpandedNav((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleNavClick = (item) => {
    if (item.id === 'home') {
      try {
        f7.views.main.router.navigate('/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/';
      }
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
      // already on profile
    } else if (item.id === 'committee') {
      try {
        f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/committee/decisions/';
      }
    } else {
      showToast(`${item.label} section coming soon!`);
    }
  };

  const handleChildNavClick = (child) => {
    if (child === 'Invoice Approval' || child === 'All Invoices') {
      try {
        f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/invoices/';
      }
    } else if (child === 'Levy Overview') {
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
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    try {
      f7.views.main.router.navigate('/login/', { reloadCurrent: true, ignoreCache: true });
    } catch (e) {
      window.location.href = '/login/';
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUserProfile((prev) => ({
      ...prev,
      ...editForm,
      emergencyContact: prev.emergencyContact,
    }));
    setEditModalOpen(false);
    showToast('Profile information updated successfully!');
  };

  const handleToggleNotification = (key) => {
    setUserProfile((prev) => {
      const updated = {
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: !prev.notifications[key],
        },
      };
      showToast(`Updated notification preference for ${key}`);
      return updated;
    });
  };

  const handleToggle2FA = () => {
    setUserProfile((prev) => {
      const nextState = !prev.security.twoFactorEnabled;
      showToast(nextState ? 'Two-Factor Authentication enabled!' : 'Two-Factor Authentication disabled.');
      return {
        ...prev,
        security: {
          ...prev.security,
          twoFactorEnabled: nextState,
        },
      };
    });
  };

  const handleAvatarChange = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      showToast('Profile avatar uploaded successfully!');
    };
    input.click();
  };

  return (
    <Page name="my-profile" noNavbar noToolbar className="invoice-page">
      <div className="invoice-app-shell">
        {/* Sidebar Navigation */}
        <AppSidebar
          isOpen={sidebarOpen}
          navItems={navItems}
          expandedNav={expandedNav}
          activeChildNav=""
          activeNavId="profile"
          onToggleExpand={handleToggleExpand}
          onNavClick={handleNavClick}
          onChildNavClick={handleChildNavClick}
          onLogout={handleLogout}
          onLogoClick={() => {
            try {
              f7.views.main.router.navigate('/');
            } catch (e) {
              window.location.href = '/';
            }
          }}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Area */}
        <div className="invoice-main-area">
          {/* Top Header Navbar */}
          <AppNavbar
            searchTerm={navbarSearch}
            onSearchChange={(e) => setNavbarSearch(e.target.value)}
            onSearchClear={() => setNavbarSearch('')}
            searchPlaceholder="Search invoices, documents, notices..."
            selectedProperty={selectedProperty}
            properties={properties}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              showToast(`Switched to ${prop.name}`);
            }}
            notificationCount={3}
            currentUser={currentUser}
            onProfileClick={() => setActiveTab('Overview')}
            onLogout={handleLogout}
            onMobileMenuToggle={() => setSidebarOpen((prev) => !prev)}
          />

          {/* Page Content */}
          <main className="invoice-content-area profile-v2-container">
            {/* DESKTOP EXPERIENCE (> 900px) */}
            <div className="profile-desktop-view">
              {/* Breadcrumbs & Title Bar */}
            <div className="profile-v2-header-bar">
              <div>
                <h1 className="profile-v2-main-title">My Profile</h1>
                <nav className="profile-v2-breadcrumb" aria-label="Breadcrumb">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      try {
                        f7.views.main.router.navigate('/');
                      } catch (err) {
                        window.location.href = '/';
                      }
                    }}
                  >
                    Dashboard
                  </a>
                  <span className="profile-v2-crumb-sep">/</span>
                  <span>Profile</span>
                  <span className="profile-v2-crumb-sep">/</span>
                  <span className="active">{activeTab}</span>
                </nav>
              </div>

              <div className="profile-v2-header-quick-actions">
                <button
                  type="button"
                  className="profile-v2-btn-primary"
                  onClick={() => {
                    setEditForm({ ...userProfile });
                    setEditModalOpen(true);
                  }}
                >
                  <Pencil size={14} />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* HERO PROFILE CARD */}
            <div className="profile-hero-card">
              {/* Cover Gradient / Pattern Banner */}
              <div className="profile-hero-banner">
                <div className="profile-hero-banner-pattern" />
                <div className="profile-hero-badge-pill">
                  <ShieldCheck size={14} />
                  <span>Strata Verified Resident</span>
                </div>
              </div>

              {/* Identity Row */}
              <div className="profile-hero-content">
                <div className="profile-hero-avatar-wrapper">
                  <div className="profile-hero-avatar">
                    <span>{userProfile.initials}</span>
                  </div>
                  <button
                    type="button"
                    className="profile-hero-camera-btn"
                    onClick={handleAvatarChange}
                    title="Change Profile Photo"
                  >
                    <Camera size={15} />
                  </button>
                  <span className="profile-hero-status-indicator" title="Active Resident" />
                </div>

                <div className="profile-hero-info">
                  <div className="profile-hero-name-row">
                    <h2 className="profile-hero-name">{userProfile.fullName}</h2>
                    <span className="profile-hero-role-tag">{userProfile.role}</span>
                    <span className="profile-hero-committee-tag">
                      <Award size={13} />
                      <span>{userProfile.committeeRole}</span>
                    </span>
                  </div>

                  <div className="profile-hero-meta-row">
                    <span className="profile-hero-meta-item">
                      <Building size={14} className="profile-hero-meta-icon" />
                      <span>{userProfile.building}</span>
                    </span>
                    <span className="profile-hero-meta-dot">•</span>
                    <span className="profile-hero-meta-item">
                      <Home size={14} className="profile-hero-meta-icon" />
                      <strong>{userProfile.lotNumber}</strong> ({userProfile.unitNumber})
                    </span>
                    <span className="profile-hero-meta-dot">•</span>
                    <span className="profile-hero-meta-item">
                      <Calendar size={14} className="profile-hero-meta-icon" />
                      <span>Joined {userProfile.joinedOn}</span>
                    </span>
                  </div>
                </div>

                <div className="profile-hero-actions">
                  <button
                    type="button"
                    className="profile-hero-action-btn secondary"
                    onClick={() => {
                      showToast('Profile link generated and copied to clipboard!');
                    }}
                    title="Share Profile"
                  >
                    <Share2 size={15} />
                    <span>Share</span>
                  </button>
                  <button
                    type="button"
                    className="profile-hero-action-btn primary"
                    onClick={() => {
                      setEditForm({ ...userProfile });
                      setEditModalOpen(true);
                    }}
                  >
                    <Pencil size={15} />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>

              {/* Horizontal Navigation Tabs */}
              <div className="profile-hero-tabs-bar">
                {[
                  { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
                  { id: 'Personal Details', label: 'Personal Details', icon: User },
                  { id: 'Property & Lot', label: 'Property & Lot', icon: Home },
                  { id: 'Security', label: 'Security & Access', icon: Shield },
                  { id: 'Notifications', label: 'Preferences', icon: Bell },
                  { id: 'Activity Log', label: 'Activity Log', icon: Clock },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`profile-hero-tab-btn ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        showToast(`Switched to ${tab.label}`);
                      }}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MAIN 2-COLUMN PROFILE CONTENT */}
            <div className="profile-v2-main-grid">
              {/* LEFT COLUMN: Main Tab Content */}
              <div className="profile-v2-left-col">
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'Overview' && (
                  <div className="profile-tab-section-fade">
                    {/* Next Milestone Banner (If profile not 100%) */}
                    {completionPercentage < 100 && nextIncompleteMilestone && (
                      <div className="profile-nudge-banner">
                        <div className="profile-nudge-left">
                          <div className="profile-nudge-icon-wrap">
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <h4 className="profile-nudge-title">
                              Complete Your Profile ({completionPercentage}% Finished)
                            </h4>
                            <p className="profile-nudge-sub">
                              Next milestone: <strong>{nextIncompleteMilestone.label}</strong> — {nextIncompleteMilestone.desc}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="profile-nudge-btn"
                          onClick={() => {
                            if (nextIncompleteMilestone.id === 'notifications') {
                              setActiveTab('Notifications');
                            } else {
                              setEditForm({ ...userProfile });
                              setEditModalOpen(true);
                            }
                          }}
                        >
                          <span>Complete Now</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}

                    {/* Personal Information Card */}
                    <div className="profile-content-card">
                      <div className="profile-card-header">
                        <div className="profile-card-title-group">
                          <div className="profile-card-header-icon blue">
                            <User size={18} />
                          </div>
                          <div>
                            <h3 className="profile-card-heading">Personal Information</h3>
                            <p className="profile-card-subheading">Personal details and primary resident identification</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="profile-btn-ghost"
                          onClick={() => {
                            setEditForm({ ...userProfile });
                            setEditModalOpen(true);
                          }}
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="profile-details-grid">
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Legal Full Name</span>
                          <span className="profile-detail-value font-semibold">{userProfile.fullName}</span>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Preferred Name</span>
                          <span className="profile-detail-value">{userProfile.preferredName}</span>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Primary Email Address</span>
                          <div className="profile-detail-value-wrap">
                            <span className="profile-detail-value">{userProfile.email}</span>
                            <span className="profile-verified-badge" title="Verified email">
                              <CheckCircle2 size={12} />
                              <span>Verified</span>
                            </span>
                            <button
                              type="button"
                              className="profile-btn-copy"
                              onClick={() => handleCopy(userProfile.email, 'email')}
                              title="Copy Primary Email"
                            >
                              {copiedField === 'email' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Secondary Email Address</span>
                          <div className="profile-detail-value-wrap">
                            <span className="profile-detail-value">{userProfile.secondaryEmail || 'None added'}</span>
                            {userProfile.secondaryEmail && (
                              <button
                                type="button"
                                className="profile-btn-copy"
                                onClick={() => handleCopy(userProfile.secondaryEmail, 'secondaryEmail')}
                                title="Copy Secondary Email"
                              >
                                {copiedField === 'secondaryEmail' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Primary Mobile Phone</span>
                          <div className="profile-detail-value-wrap">
                            <span className="profile-detail-value">{userProfile.phone}</span>
                            <span className="profile-verified-badge" title="Verified phone">
                              <CheckCircle2 size={12} />
                              <span>Verified</span>
                            </span>
                            <button
                              type="button"
                              className="profile-btn-copy"
                              onClick={() => handleCopy(userProfile.phone, 'phone')}
                              title="Copy Primary Phone"
                            >
                              {copiedField === 'phone' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Secondary Mobile Phone</span>
                          <div className="profile-detail-value-wrap">
                            <span className="profile-detail-value">{userProfile.secondaryPhone || 'None added'}</span>
                            {userProfile.secondaryPhone && (
                              <button
                                type="button"
                                className="profile-btn-copy"
                                onClick={() => handleCopy(userProfile.secondaryPhone, 'secondaryPhone')}
                                title="Copy Secondary Phone"
                              >
                                {copiedField === 'secondaryPhone' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Date of Birth</span>
                          <div className="profile-detail-value-wrap">
                            <Calendar size={14} className="profile-detail-icon" />
                            <span className="profile-detail-value">{userProfile.dob}</span>
                          </div>
                        </div>

                        <div className="profile-detail-item full-width">
                          <span className="profile-detail-label">Registered Strata Address</span>
                          <div className="profile-detail-value-wrap">
                            <MapPin size={14} className="profile-detail-icon" />
                            <span className="profile-detail-value">{userProfile.address}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Property & Strata Lot Card */}
                    <div className="profile-content-card">
                      <div className="profile-card-header">
                        <div className="profile-card-title-group">
                          <div className="profile-card-header-icon green">
                            <Building size={18} />
                          </div>
                          <div>
                            <h3 className="profile-card-heading">Property & Lot Ownership</h3>
                            <p className="profile-card-subheading">Strata plan details, lot allocations, and unit entitlement</p>
                          </div>
                        </div>
                        <span className="profile-badge-pill green">
                          <Home size={12} />
                          <span>{userProfile.occupancyType}</span>
                        </span>
                      </div>

                      <div className="profile-details-grid">
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Strata Plan Lot</span>
                          <span className="profile-detail-value font-bold text-primary">{userProfile.lotNumber}</span>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Unit / Apartment</span>
                          <span className="profile-detail-value">{userProfile.unitNumber}</span>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Unit Entitlement</span>
                          <span className="profile-detail-value font-semibold">{userProfile.unitEntitlement}</span>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Allocated Parking</span>
                          <div className="profile-detail-value-wrap">
                            <Car size={14} className="profile-detail-icon" />
                            <span className="profile-detail-value">{userProfile.parkingBay}</span>
                          </div>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Storage Locker</span>
                          <div className="profile-detail-value-wrap">
                            <Box size={14} className="profile-detail-icon" />
                            <span className="profile-detail-value">{userProfile.storageLot}</span>
                          </div>
                        </div>

                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Committee Appointment</span>
                          <span className="profile-detail-value font-semibold text-primary">
                            {userProfile.committeeRole}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Security & Access Quick Overview */}
                    <div className="profile-content-card">
                      <div className="profile-card-header">
                        <div className="profile-card-title-group">
                          <div className="profile-card-header-icon purple">
                            <Shield size={18} />
                          </div>
                          <div>
                            <h3 className="profile-card-heading">Security & Account Safeguards</h3>
                            <p className="profile-card-subheading">Authentication methods, active logins, and portal security</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="profile-btn-ghost"
                          onClick={() => setActiveTab('Security')}
                        >
                          <span>Manage Security</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      <div className="profile-security-row-list">
                        <div className="profile-security-tile">
                          <div className="profile-security-tile-icon-box">
                            <Lock size={18} />
                          </div>
                          <div className="profile-security-tile-body">
                            <span className="profile-security-tile-title">Password Security</span>
                            <span className="profile-security-tile-desc">
                              Last changed on {userProfile.security.lastPasswordChange} • Strong
                            </span>
                          </div>
                          <button
                            type="button"
                            className="profile-btn-outline-xs"
                            onClick={() => showToast('Password change link sent to your email!')}
                          >
                            Change
                          </button>
                        </div>

                        <div className="profile-security-tile">
                          <div className="profile-security-tile-icon-box green">
                            <Smartphone size={18} />
                          </div>
                          <div className="profile-security-tile-body">
                            <div className="profile-security-title-wrap">
                              <span className="profile-security-tile-title">Two-Factor Authentication (2FA)</span>
                              <span className={`profile-status-pill ${userProfile.security.twoFactorEnabled ? 'active' : 'inactive'}`}>
                                {userProfile.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <span className="profile-security-tile-desc">
                              Secured via Authenticator App & SMS OTP
                            </span>
                          </div>
                          <button
                            type="button"
                            className="profile-btn-toggle"
                            onClick={handleToggle2FA}
                            title="Toggle 2FA"
                          >
                            {userProfile.security.twoFactorEnabled ? (
                              <ToggleRight size={28} color="#0d9488" />
                            ) : (
                              <ToggleLeft size={28} color="#94a3b8" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PERSONAL DETAILS TAB */}
                {activeTab === 'Personal Details' && (
                  <div className="profile-tab-section-fade">
                    <div className="profile-content-card">
                      <div className="profile-card-header">
                        <div className="profile-card-title-group">
                          <div className="profile-card-header-icon blue">
                            <User size={18} />
                          </div>
                          <div>
                            <h3 className="profile-card-heading">Personal & Contact Record</h3>
                            <p className="profile-card-subheading">Update your official strata roll contact details</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="profile-v2-btn-primary"
                          onClick={() => {
                            setEditForm({ ...userProfile });
                            setEditModalOpen(true);
                          }}
                        >
                          <Pencil size={14} />
                          <span>Edit Details</span>
                        </button>
                      </div>

                      <div className="profile-details-grid">
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Full Name</span>
                          <span className="profile-detail-value font-semibold">{userProfile.fullName}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Role in Scheme</span>
                          <span className="profile-detail-value">{userProfile.role}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Primary Email Address</span>
                          <span className="profile-detail-value">{userProfile.email}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Secondary Email Address</span>
                          <span className="profile-detail-value">{userProfile.secondaryEmail || 'None added'}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Primary Mobile Phone</span>
                          <span className="profile-detail-value">{userProfile.phone}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Secondary Mobile Phone</span>
                          <span className="profile-detail-value">{userProfile.secondaryPhone || 'None added'}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Date of Birth</span>
                          <span className="profile-detail-value">{userProfile.dob}</span>
                        </div>
                        <div className="profile-detail-item full-width">
                          <span className="profile-detail-label">Physical Address</span>
                          <span className="profile-detail-value">{userProfile.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="profile-content-card">
                      <div className="profile-card-header">
                        <div className="profile-card-title-group">
                          <div className="profile-card-header-icon red">
                            <AlertCircle size={18} />
                          </div>
                          <div>
                            <h3 className="profile-card-heading">Emergency Contact (Next of Kin)</h3>
                            <p className="profile-card-subheading">Contacted only during building emergencies or urgent strata notices</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="profile-btn-ghost"
                          onClick={() => {
                            showToast('To update Next of Kin / Emergency contacts, please contact your Strata Manager.');
                          }}
                        >
                          <Pencil size={13} />
                          <span>Request Change</span>
                        </button>
                      </div>

                      <div className="profile-details-grid">
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Contact Name</span>
                          <span className="profile-detail-value font-semibold">{userProfile.emergencyContact.name}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Relationship</span>
                          <span className="profile-detail-value">{userProfile.emergencyContact.relationship}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Emergency Phone</span>
                          <span className="profile-detail-value">{userProfile.emergencyContact.phone}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Emergency Email</span>
                          <span className="profile-detail-value">{userProfile.emergencyContact.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PROPERTY & LOT TAB */}
                {activeTab === 'Property & Lot' && (
                  <div className="profile-tab-section-fade">
                    <div className="profile-content-card">
                      <div className="profile-card-header">
                        <div className="profile-card-title-group">
                          <div className="profile-card-header-icon green">
                            <Building size={18} />
                          </div>
                          <div>
                            <h3 className="profile-card-heading">Strata Plan & Lot Specifications</h3>
                            <p className="profile-card-subheading">Official registry data for SP 94820 - Green Valley Residence</p>
                          </div>
                        </div>
                      </div>

                      <div className="profile-details-grid">
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Strata Plan Scheme</span>
                          <span className="profile-detail-value font-semibold">SP 94820 (Green Valley)</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Lot Allocation</span>
                          <span className="profile-detail-value font-bold text-primary">{userProfile.lotNumber}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Unit Entitlement</span>
                          <span className="profile-detail-value">{userProfile.unitEntitlement}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Occupancy Status</span>
                          <span className="profile-detail-value">{userProfile.occupancyType}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Parking Allocation</span>
                          <span className="profile-detail-value">{userProfile.parkingBay}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Storage Allocation</span>
                          <span className="profile-detail-value">{userProfile.storageLot}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">Move-In / Settlement Date</span>
                          <span className="profile-detail-value">{userProfile.joinedOn}</span>
                        </div>
                        <div className="profile-detail-item">
                          <span className="profile-detail-label">By-Laws Acknowledgment</span>
                          <span className="profile-verified-badge">
                            <CheckCircle2 size={12} />
                            <span>Signed & Compliant</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SECURITY TAB */}
                {activeTab === 'Security' && (
                  <div className="profile-tab-section-fade">
                    <div className="profile-content-card">
                      <div className="profile-card-header">
                        <div className="profile-card-title-group">
                          <div className="profile-card-header-icon purple">
                            <Shield size={18} />
                          </div>
                          <div>
                            <h3 className="profile-card-heading">Password & Authentication</h3>
                            <p className="profile-card-subheading">Manage your credentials, 2-factor verification, and session control</p>
                          </div>
                        </div>
                      </div>

                      <div className="profile-security-row-list">
                        <div className="profile-security-tile">
                          <div className="profile-security-tile-icon-box">
                            <Lock size={18} />
                          </div>
                          <div className="profile-security-tile-body">
                            <span className="profile-security-tile-title">Account Password</span>
                            <span className="profile-security-tile-desc">
                              Last changed {userProfile.security.lastPasswordChange} • Strength: Strong
                            </span>
                          </div>
                          <button
                            type="button"
                            className="profile-btn-primary-sm"
                            onClick={() => showToast('Password reset link dispatched!')}
                          >
                            Update Password
                          </button>
                        </div>

                        <div className="profile-security-tile">
                          <div className="profile-security-tile-icon-box green">
                            <Smartphone size={18} />
                          </div>
                          <div className="profile-security-tile-body">
                            <div className="profile-security-title-wrap">
                              <span className="profile-security-tile-title">Two-Factor Authentication (2FA)</span>
                              <span className={`profile-status-pill ${userProfile.security.twoFactorEnabled ? 'active' : 'inactive'}`}>
                                {userProfile.security.twoFactorEnabled ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <span className="profile-security-tile-desc">
                              Requires 6-digit verification code when logging in from new browsers
                            </span>
                          </div>
                          <button
                            type="button"
                            className="profile-btn-toggle"
                            onClick={handleToggle2FA}
                          >
                            {userProfile.security.twoFactorEnabled ? (
                              <ToggleRight size={28} color="#0d9488" />
                            ) : (
                              <ToggleLeft size={28} color="#94a3b8" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="profile-content-card">
                      <div className="profile-card-header">
                        <div className="profile-card-title-group">
                          <div className="profile-card-header-icon blue">
                            <Laptop size={18} />
                          </div>
                          <div>
                            <h3 className="profile-card-heading">Active Browser Sessions</h3>
                            <p className="profile-card-subheading">Devices currently authenticated to your strata account</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="profile-btn-outline-xs text-red"
                          onClick={() => showToast('Logged out of all other devices')}
                        >
                          Revoke Other Sessions
                        </button>
                      </div>

                      <div className="profile-sessions-list">
                        <div className="profile-session-item">
                          <div className="profile-session-device-icon">
                            <Laptop size={18} />
                          </div>
                          <div className="profile-session-info">
                            <div className="profile-session-name-row">
                              <span className="profile-session-name">Windows PC • Chrome 124.0</span>
                              <span className="profile-session-current-badge">Current Device</span>
                            </div>
                            <span className="profile-session-meta">Colombo, Sri Lanka • IP: 112.134.x.x • Active now</span>
                          </div>
                        </div>

                        <div className="profile-session-item">
                          <div className="profile-session-device-icon">
                            <Smartphone size={18} />
                          </div>
                          <div className="profile-session-info">
                            <div className="profile-session-name-row">
                              <span className="profile-session-name">Apple iPhone 15 Pro • Safari Mobile</span>
                            </div>
                            <span className="profile-session-meta">Nugegoda, Sri Lanka • IP: 175.157.x.x • Last active 3 hours ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. NOTIFICATIONS TAB */}
                {activeTab === 'Notifications' && (
                  <div className="profile-tab-section-fade">
                    <div className="profile-content-card">
                      <div className="profile-card-header">
                        <div className="profile-card-title-group">
                          <div className="profile-card-header-icon amber">
                            <Bell size={18} />
                          </div>
                          <div>
                            <h3 className="profile-card-heading">Communication & Notification Preferences</h3>
                            <p className="profile-card-subheading">Choose how and when you receive strata updates and financial alerts</p>
                          </div>
                        </div>
                      </div>

                      <div className="profile-preference-list">
                        {[
                          {
                            key: 'emailNotices',
                            title: 'Official Strata Notices & Minutes',
                            desc: 'Receive AGM announcements, committee meeting minutes, and by-law notices via email',
                            enabled: userProfile.notifications.emailNotices,
                          },
                          {
                            key: 'smsLevyAlerts',
                            title: 'SMS Payment & Levy Reminders',
                            desc: 'Receive instant SMS alerts 7 days prior to quarterly levy due dates',
                            enabled: userProfile.notifications.smsLevyAlerts,
                          },
                          {
                            key: 'pushMaintenance',
                            title: 'Building Maintenance & Lift Notices',
                            desc: 'Immediate notifications for water shutdowns, lift maintenance, and contractor visits',
                            enabled: userProfile.notifications.pushMaintenance,
                          },
                          {
                            key: 'communityEvents',
                            title: 'Community News & Resident Events',
                            desc: 'Social updates, neighbor notices, and community BBQ announcements',
                            enabled: userProfile.notifications.communityEvents,
                          },
                        ].map((pref) => (
                          <div key={pref.key} className="profile-preference-item">
                            <div className="profile-preference-info">
                              <span className="profile-preference-title">{pref.title}</span>
                              <span className="profile-preference-desc">{pref.desc}</span>
                            </div>
                            <button
                              type="button"
                              className="profile-btn-toggle"
                              onClick={() => handleToggleNotification(pref.key)}
                            >
                              {pref.enabled ? (
                                <ToggleRight size={28} color="#0d9488" />
                              ) : (
                                <ToggleLeft size={28} color="#94a3b8" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. ACTIVITY LOG TAB */}
                {activeTab === 'Activity Log' && (
                  <div className="profile-tab-section-fade">
                    <div className="profile-content-card">
                      <div className="profile-card-header">
                        <div className="profile-card-title-group">
                          <div className="profile-card-header-icon blue">
                            <Clock size={18} />
                          </div>
                          <div>
                            <h3 className="profile-card-heading">Account Activity History</h3>
                            <p className="profile-card-subheading">Chronological record of logins, profile modifications, and committee actions</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="profile-btn-ghost"
                          onClick={() => showToast('Activity log refreshed')}
                        >
                          <RefreshCw size={13} />
                          <span>Refresh</span>
                        </button>
                      </div>

                      <div className="profile-activity-timeline">
                        {[
                          {
                            title: 'Logged in from Windows Desktop (Chrome)',
                            time: 'Today at 10:32 AM',
                            tag: 'Security',
                            tagColor: 'blue',
                            icon: RefreshCw,
                          },
                          {
                            title: 'Approved Contractor Invoice #INV-2026-088 ($1,450.00)',
                            time: 'Yesterday at 04:15 PM',
                            tag: 'Committee',
                            tagColor: 'green',
                            icon: CheckCircle2,
                          },
                          {
                            title: 'Updated Profile Contact & Emergency Information',
                            time: '18 May 2026, 02:45 PM',
                            tag: 'Profile',
                            tagColor: 'purple',
                            icon: User,
                          },
                          {
                            title: 'Downloaded Quarterly Financial Statement Q1-2026.pdf',
                            time: '15 May 2026, 11:20 AM',
                            tag: 'Documents',
                            tagColor: 'amber',
                            icon: Box,
                          },
                          {
                            title: 'Changed Account Password',
                            time: '10 May 2026, 11:15 AM',
                            tag: 'Security',
                            tagColor: 'red',
                            icon: Lock,
                          },
                          {
                            title: 'Two-Factor Authentication Setup Verified',
                            time: '12 Jan 2026, 09:20 AM',
                            tag: 'Security',
                            tagColor: 'green',
                            icon: Shield,
                          },
                        ].map((act, idx) => {
                          const ActIcon = act.icon;
                          return (
                            <div key={idx} className="profile-timeline-row">
                              <div className={`profile-timeline-icon ${act.tagColor}`}>
                                <ActIcon size={14} />
                              </div>
                              <div className="profile-timeline-content">
                                <div className="profile-timeline-top">
                                  <span className="profile-timeline-title">{act.title}</span>
                                  <span className={`profile-timeline-badge ${act.tagColor}`}>{act.tag}</span>
                                </div>
                                <span className="profile-timeline-time">{act.time}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Profile Completion & Helper Cards */}
              <div className="profile-v2-right-col">
                {/* 1. PROMINENT PROFILE COMPLETION WIDGET */}
                <div className="profile-completion-card-v2">
                  <div className="profile-completion-header">
                    <div className="profile-completion-title-wrap">
                      <h3 className="profile-completion-title">Profile Completion</h3>
                      <p className="profile-completion-sub">
                        {completionPercentage === 100
                          ? 'All milestones reached! Your profile is complete.'
                          : 'Complete your profile to unlock full strata verification.'}
                      </p>
                    </div>

                    <div className="profile-completion-badge-tag">
                      {completionPercentage === 100 ? '100% Complete' : `${completionPercentage}%`}
                    </div>
                  </div>

                  {/* Circular Gauge Progress */}
                  <div className="profile-gauge-container">
                    <div className="profile-gauge-svg-wrap">
                      <svg viewBox="0 0 120 120" width="100" height="100">
                        {/* Background Track */}
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="10"
                        />
                        {/* Dynamic Colored Progress Arc */}
                        {/* Circumference = 2 * PI * 48 = 301.59 */}
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          fill="none"
                          stroke={completionPercentage === 100 ? '#10b981' : '#0d9488'}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray="301.59"
                          strokeDashoffset={301.59 - (301.59 * completionPercentage) / 100}
                          transform="rotate(-90 60 60)"
                          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                        />
                      </svg>
                      <div className="profile-gauge-center-text">
                        <span className="profile-gauge-number">{completionPercentage}%</span>
                        <span className="profile-gauge-caption">Completed</span>
                      </div>
                    </div>

                    <div className="profile-gauge-status-box">
                      <div className="profile-gauge-status-title">
                        {completionPercentage === 100 ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Sparkles size={14} /> Full Verification
                          </span>
                        ) : (
                          <span className="text-slate-800 font-bold">Good Progress!</span>
                        )}
                      </div>
                      <p className="profile-gauge-status-desc">
                        {completionPercentage === 100
                          ? 'Your resident file is up to date with committee records.'
                          : `Just ${100 - completionPercentage}% remaining to achieve complete verification.`}
                      </p>
                    </div>
                  </div>

                  {/* Checklist Milestones */}
                  <div className="profile-checklist-v2">
                    {completionMilestones.map((m) => (
                      <div
                        key={m.id}
                        className={`profile-checklist-item-v2 ${m.completed ? 'done' : 'pending'}`}
                        onClick={() => {
                          if (!m.completed) {
                            if (m.id === 'notifications') {
                              setActiveTab('Notifications');
                            } else {
                              setEditForm({ ...userProfile });
                              setEditModalOpen(true);
                            }
                          }
                        }}
                      >
                        <div className="profile-checklist-status-icon">
                          {m.completed ? (
                            <CheckCircle2 size={18} color="#10b981" />
                          ) : (
                            <Circle size={18} color="#94a3b8" />
                          )}
                        </div>
                        <div className="profile-checklist-item-text">
                          <span className="profile-checklist-name">{m.label}</span>
                          <span className="profile-checklist-weight">+{m.weight}%</span>
                        </div>
                        {!m.completed && (
                          <button type="button" className="profile-checklist-add-btn">
                            Add
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Action */}
                  {completionPercentage < 100 ? (
                    <button
                      type="button"
                      className="profile-completion-cta-btn"
                      onClick={() => {
                        if (nextIncompleteMilestone?.id === 'notifications') {
                          setActiveTab('Notifications');
                        } else {
                          setEditForm({ ...userProfile });
                          setEditModalOpen(true);
                        }
                      }}
                    >
                      <span>Complete Remaining Steps</span>
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <div className="profile-completion-all-done">
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Profile is 100% verified</span>
                    </div>
                  )}
                </div>

                {/* 2. ASSIGNED STRATA MANAGER CARD */}
                <div className="profile-companion-card">
                  <div className="profile-companion-header">
                    <div className="profile-card-header-icon green">
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <h4 className="profile-companion-title">Assigned Strata Manager</h4>
                      <span className="profile-companion-sub">Primary building representative</span>
                    </div>
                  </div>

                  <div className="profile-manager-details">
                    <div className="profile-manager-name-row">
                      <span className="profile-manager-name">{userProfile.manager.name}</span>
                      <span className="profile-manager-badge">{userProfile.manager.title}</span>
                    </div>
                    <span className="profile-manager-agency">{userProfile.manager.agency}</span>

                    <div className="profile-manager-contact-links">
                      <a
                        href={`tel:${userProfile.manager.phone}`}
                        className="profile-manager-link"
                        onClick={(e) => {
                          e.preventDefault();
                          showToast(`Calling ${userProfile.manager.phone}...`);
                        }}
                      >
                        <Phone size={14} />
                        <span>{userProfile.manager.phone}</span>
                      </a>
                      <a
                        href={`mailto:${userProfile.manager.email}`}
                        className="profile-manager-link"
                        onClick={(e) => {
                          e.preventDefault();
                          showToast(`Drafting email to ${userProfile.manager.email}...`);
                        }}
                      >
                        <Mail size={14} />
                        <span>{userProfile.manager.email}</span>
                      </a>
                      <div className="profile-manager-hours">
                        <Clock size={13} />
                        <span>{userProfile.manager.hours}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. QUICK PROPERTY ID BADGE CARD */}
                <div className="profile-companion-card strata-id-card">
                  <div className="profile-id-chip">
                    <div className="profile-id-chip-top">
                      <Building size={16} />
                      <span>Green Valley Residence</span>
                    </div>
                    <div className="profile-id-number">{userProfile.lotNumber}</div>
                    <div className="profile-id-footer">
                      <span>{userProfile.fullName}</span>
                      <span>{userProfile.occupancyType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* MOBILE EXPERIENCE (<= 900px) */}
            <MobileProfileView
              userProfile={userProfile}
              completionPercentage={completionPercentage}
              nextIncompleteMilestone={nextIncompleteMilestone}
              onEditProfile={() => {
                setEditForm({ ...userProfile });
                setEditModalOpen(true);
              }}
              onAvatarChange={handleAvatarChange}
              onToggle2FA={handleToggle2FA}
              onToggleNotification={handleToggleNotification}
              showToast={showToast}
              handleCopy={handleCopy}
              copiedField={copiedField}
            />
          </main>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {editModalOpen && createPortal(
        <div className="profile-modern-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="profile-modern-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-top-accent" />

            <div className="profile-modern-modal-header">
              <div className="profile-modal-title-wrap">
                <div className="profile-modal-header-icon">
                  <UserCheck size={22} />
                </div>
                <div>
                  <div className="profile-modal-tag-row">
                    <h3 className="profile-modern-modal-title">Edit Profile Information</h3>
                  </div>
                  <p className="profile-modern-modal-subtitle">
                    Update your official resident identity and strata communication channels
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="profile-modern-modal-close"
                onClick={() => setEditModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="profile-modern-modal-body">
                {/* 1. Personal Identity Section */}
                <div className="profile-modal-section-card">
                  <div className="profile-modal-section-title">
                    <User size={14} color="#0d9488" />
                    <span>Resident Identity</span>
                  </div>

                  <div className="profile-form-two-col">
                    <div className="profile-modern-form-group">
                      <label className="profile-modern-label">
                        <span>Legal Full Name</span>
                        <span className="profile-req-star">*</span>
                      </label>
                      <div className="profile-input-with-icon">
                        <User size={15} className="profile-field-icon" />
                        <input
                          type="text"
                          className="profile-modern-input"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          required
                          placeholder="e.g. Pasan Udara"
                        />
                      </div>
                    </div>

                    <div className="profile-modern-form-group">
                      <label className="profile-modern-label">
                        <span>Preferred / Known Name</span>
                      </label>
                      <div className="profile-input-with-icon">
                        <User size={15} className="profile-field-icon" />
                        <input
                          type="text"
                          className="profile-modern-input"
                          value={editForm.preferredName}
                          onChange={(e) => setEditForm({ ...editForm, preferredName: e.target.value })}
                          placeholder="e.g. Pasan"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="profile-form-two-col" style={{ marginTop: '12px' }}>
                    <div className="profile-modern-form-group">
                      <label className="profile-modern-label">
                        <span>Date of Birth</span>
                      </label>
                      <div className="profile-input-with-icon">
                        <Calendar size={15} className="profile-field-icon" />
                        <input
                          type="text"
                          className="profile-modern-input"
                          value={editForm.dob}
                          onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                          placeholder="DD Mon YYYY"
                        />
                      </div>
                    </div>

                    <div className="profile-modern-form-group">
                      <label className="profile-modern-label">
                        <span>Role in Scheme</span>
                        <span className="profile-badge-pill slate compact">Official</span>
                      </label>
                      <div className="profile-input-with-icon">
                        <Award size={15} className="profile-field-icon" />
                        <input
                          type="text"
                          className="profile-modern-input read-only"
                          value={editForm.role}
                          readOnly
                          title="Official role managed by Strata Committee"
                        />
                        <Lock size={13} className="profile-input-lock-icon" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Communication Channels Section */}
                <div className="profile-modal-section-card">
                  <div className="profile-modal-section-title">
                    <Phone size={14} color="#0d9488" />
                    <span>Communication & Notice Channels</span>
                  </div>

                  <div className="profile-form-two-col">
                    <div className="profile-modern-form-group">
                      <label className="profile-modern-label">
                        <span>Primary Email Address</span>
                        <span className="profile-badge-pill green compact">Required</span>
                      </label>
                      <div className="profile-input-with-icon">
                        <Mail size={15} className="profile-field-icon" />
                        <input
                          type="email"
                          className="profile-modern-input"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          required
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>

                    <div className="profile-modern-form-group">
                      <label className="profile-modern-label">
                        <span>Secondary Email Address</span>
                        <span className="profile-badge-pill slate compact">Optional</span>
                      </label>
                      <div className="profile-input-with-icon">
                        <Mail size={15} className="profile-field-icon" />
                        <input
                          type="email"
                          className="profile-modern-input"
                          placeholder="e.g. personal@example.com"
                          value={editForm.secondaryEmail || ''}
                          onChange={(e) => setEditForm({ ...editForm, secondaryEmail: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="profile-form-two-col" style={{ marginTop: '12px' }}>
                    <div className="profile-modern-form-group">
                      <label className="profile-modern-label">
                        <span>Primary Mobile Phone</span>
                        <span className="profile-badge-pill green compact">Required</span>
                      </label>
                      <div className="profile-input-with-icon">
                        <Phone size={15} className="profile-field-icon" />
                        <input
                          type="tel"
                          className="profile-modern-input"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          required
                          placeholder="+94 77 123 4567"
                        />
                      </div>
                    </div>

                    <div className="profile-modern-form-group">
                      <label className="profile-modern-label">
                        <span>Secondary Mobile Phone</span>
                        <span className="profile-badge-pill slate compact">Optional</span>
                      </label>
                      <div className="profile-input-with-icon">
                        <Phone size={15} className="profile-field-icon" />
                        <input
                          type="tel"
                          className="profile-modern-input"
                          placeholder="e.g. +94 71 555 9988"
                          value={editForm.secondaryPhone || ''}
                          onChange={(e) => setEditForm({ ...editForm, secondaryPhone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Strata Property Address */}
                <div className="profile-modal-section-card">
                  <div className="profile-modal-section-title">
                    <MapPin size={14} color="#0d9488" />
                    <span>Strata Scheme Property Address</span>
                  </div>

                  <div className="profile-modern-form-group">
                    <label className="profile-modern-label">
                      <span>Registered Scheme Address</span>
                      <span className="profile-req-star">*</span>
                    </label>
                    <div className="profile-input-with-icon">
                      <MapPin size={15} className="profile-field-icon" />
                      <input
                        type="text"
                        className="profile-modern-input"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        required
                        placeholder="Block / Unit, Building Name, Street, City"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-modern-modal-footer">
                <div className="profile-modal-security-note">
                  <ShieldCheck size={16} color="#0d9488" />
                  <span>Verified under SP 94820 scheme by-laws</span>
                </div>

                <div className="profile-modal-actions">
                  <button
                    type="button"
                    className="profile-modern-btn-secondary"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="profile-modern-btn-primary">
                    <Save size={15} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Quick Actions Popup */}
      {activePopup === 'quickActions' && (
        <QuickActionsPopup
          popupRef={popupRef}
          onClose={() => setActivePopup(null)}
          onAction={(key) => {
            setActivePopup(null);
            showToast(`Action "${key}" triggered`);
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
          onInputChange={setAiInput}
          onSubmit={() => {
            if (!aiInput.trim()) return;
            const userMsg = { role: 'user', content: aiInput };
            setAiMessages((prev) => [...prev, userMsg]);
            setAiInput('');
            setIsAiTyping(true);
            setTimeout(() => {
              setAiMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: 'How can I assist you with your profile or strata account?',
                },
              ]);
              setIsAiTyping(false);
            }, 800);
          }}
          onSuggestion={(sugg) => setAiInput(sugg)}
          aiChatEndRef={aiChatEndRef}
          onClearChat={() => setAiMessages([])}
        />
      )}

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        fabGroupRef={fabGroupRef}
        activePopup={activePopup}
        onToggleQuickActions={() =>
          setActivePopup((prev) => (prev === 'quickActions' ? null : 'quickActions'))
        }
        onToggleAiAssistant={() =>
          setActivePopup((prev) => (prev === 'aiAssistant' ? null : 'aiAssistant'))
        }
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'appDropdownFade 0.2s ease',
          }}
        >
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}
    </Page>
  );
};

export default MyProfilePage;
