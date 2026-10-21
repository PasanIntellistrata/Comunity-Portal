import React, { useMemo, useEffect } from 'react';
import { f7 } from 'framework7-react';
import {
  Home,
  LayoutDashboard,
  Receipt,
  ClipboardList,
  CreditCard,
  FileText,
  Folder,
  Files,
  Wrench,
  DollarSign,
  TrendingUp,
  Users,
  Landmark,
  BarChart2,
  Settings,
  Circle,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LogOut,
  User,
  Accessibility,
  X,
  Building2,
} from 'lucide-react';
import { authService } from '../js/services/auth.js';
import { usePortalSelection } from '../js/services/portal-selection.js';

/**
 * getNavIcon — maps nav item IDs to icon glyphs.
 * Exported so other pages can reuse the same icon set.
 */
export const getNavIcon = (id) => {
  const icons = {
    home: <Home size={18} />,
    dashboard: <LayoutDashboard size={18} />,
    levy: <ClipboardList size={18} />,
    payments: <CreditCard size={18} />,
    invoices: <FileText size={18} />,
    documents: <Files size={18} />,
    maintenance: <Wrench size={18} />,
    finance: <DollarSign size={18} />,
    investments: <TrendingUp size={18} />,
    community: <Users size={18} />,
    committee: <Landmark size={18} />,
    reports: <BarChart2 size={18} />,
    accessibility: <Accessibility size={18} />,
    profile: <User size={18} />,
    settings: <Settings size={18} />,
  };
  return icons[id] || <Circle size={8} />;
};

/**
 * AppSidebar — Shared responsive sidebar navigation component.
 * Features a modern, enterprise-grade mobile drawer experience on mobile (<= 900px)
 * while preserving the clean, established desktop layout (> 900px).
 *
 * Props:
 *   isOpen           {boolean}  — mobile open/close state
 *   onClose          {fn()}     — called when backdrop overlay or close button is clicked
 *   navItems         {array}    — navigation item definitions
 *   expandedNav      {object}   — { [id]: bool } expanded state
 *   activeChildNav   {string}   — which child nav label is active
 *   activeNavId      {string}   — which top-level nav id is active (e.g. 'invoices')
 *   onToggleExpand   {fn(id)}   — toggle expanded state for an item
 *   onNavClick       {fn(item)} — click a top-level nav item
 *   onChildNavClick  {fn(child)}— click a child nav link
 *   onLogout         {fn()}     — logout handler
 *   onLogoClick      {fn()}     — logo click handler
 *   currentUser      {object}   — optional current user override
 *   selectedProperty {object}   — optional selected property override
 *   selectedLot      {string}   — optional selected lot override
 */
const AppSidebar = ({
  isOpen = false,
  onClose,
  navItems = [],
  expandedNav = {},
  activeChildNav = '',
  activeNavId = 'invoices',
  onToggleExpand,
  onNavClick,
  onChildNavClick,
  onLogout,
  onLogoClick,
  currentUser,
  selectedProperty,
  selectedLot,
}) => {
  // Connect to central property & lot selection if not explicitly provided
  const portalSelection = usePortalSelection();
  const activeProperty = selectedProperty || portalSelection?.selectedProperty;
  const activeLot = selectedLot || portalSelection?.selectedLot;

  // Resolve current logged-in user
  const loggedUser = currentUser || authService.getUser() || {
    name: 'Portal Resident',
    role: 'Resident Owner',
    unit: '101',
    email: 'resident@intellistrata.com',
  };

  const initials = loggedUser.name
    ? loggedUser.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : 'AS';

  // Close sidebar on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Group nav items into categorized sections for modern mobile ergonomics
  const groupedSections = useMemo(() => {
    const coreItems = [];
    const strataItems = [];
    const systemItems = [];
    const otherItems = [];

    navItems.forEach((item) => {
      if (['home', 'levy', 'payments', 'invoices', 'documents', 'maintenance'].includes(item.id)) {
        coreItems.push(item);
      } else if (['committee', 'finance', 'investments', 'community', 'reports'].includes(item.id)) {
        strataItems.push(item);
      } else if (['accessibility', 'profile', 'settings'].includes(item.id)) {
        systemItems.push(item);
      } else {
        otherItems.push(item);
      }
    });

    const sections = [];
    if (coreItems.length > 0) {
      sections.push({ id: 'core', label: 'Main Navigation', items: coreItems });
    }
    if (strataItems.length > 0) {
      sections.push({ id: 'strata', label: 'Strata & Community', items: strataItems });
    }
    if (systemItems.length > 0) {
      sections.push({ id: 'system', label: 'Preferences', items: systemItems });
    }
    if (otherItems.length > 0) {
      sections.push({ id: 'other', label: 'Other', items: otherItems });
    }

    return sections.length > 0 ? sections : [{ id: 'all', label: '', items: navItems }];
  }, [navItems]);

  const handleProfileClick = () => {
    onClose?.();
    try {
      f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true });
    } catch (e) {
      window.location.href = '/profile/';
    }
  };

  const handleItemClick = (item, hasChildren) => {
    if (hasChildren) {
      onToggleExpand?.(item.id);
    } else {
      onNavClick?.(item);
      onClose?.();
    }
  };

  const handleChildClick = (child) => {
    onChildNavClick?.(child);
    onClose?.();
  };

  return (
    <>
      {/* Overlay backdrop — visible on mobile when sidebar drawer is open */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`invoice-sidebar ${isOpen ? 'open' : ''}`}
        id="app-sidebar"
        aria-label="Sidebar Navigation"
      >
        {/* Header / Logo Row */}
        <div className="invoice-sidebar-logo-row">
          <div
            className="invoice-sidebar-logo"
            onClick={(e) => {
              onLogoClick?.();
              onClose?.();
            }}
            role="button"
            tabIndex={0}
            aria-label="Intellistrata Home"
          >
            <div className="invoice-sidebar-logo-icon-wrap">
              <svg
                className="invoice-sidebar-logo-icon"
                viewBox="0 0 90 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g
                  fill="none"
                  stroke="#00BFA5"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 6 86 L 75 86" />
                  <path d="M 6 86 L 6 55 Q 6 52 9 52 L 26 52 Q 29 52 29 55 L 29 86" />
                  <path d="M 29 86 L 29 27 Q 29 24 32 24 L 49 24 Q 52 24 52 27 L 52 86" />
                  <path d="M 52 86 L 52 5 Q 52 2 55 2 L 72 2 Q 75 2 75 5 L 75 86" />
                </g>
              </svg>
            </div>
            <div className="invoice-sidebar-brand-text">
              <span className="invoice-sidebar-logo-name">Intellistrata</span>
              <span className="invoice-sidebar-mobile-tag">Community Portal</span>
            </div>
          </div>

          {/* Dedicated Mobile Close (X) Button */}
          <button
            type="button"
            className="mobile-sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
        </div>

        {/* Mobile Property & Scheme Context Badge */}
        <div className="mobile-sidebar-property-badge">
          <div className="mobile-sidebar-prop-icon">
            <Building2 size={13} />
          </div>
          <div className="mobile-sidebar-prop-info">
            <span className="mobile-sidebar-prop-name">
              {activeProperty?.name || 'Green Valley Residence'}
            </span>
            <span className="mobile-sidebar-prop-unit">
              Unit / Lot: <strong>{activeLot || 'All Lots'}</strong>
            </span>
          </div>
        </div>

        {/* Mobile User Profile Mini-Card */}
        <div
          className="mobile-sidebar-user-card"
          onClick={handleProfileClick}
          role="button"
          tabIndex={0}
          title="View My Profile"
        >
          <div className="mobile-sidebar-user-avatar">
            {initials}
          </div>
          <div className="mobile-sidebar-user-meta">
            <div className="mobile-sidebar-user-name">{loggedUser.name}</div>
            <div className="mobile-sidebar-user-sub">
              <span className="mobile-sidebar-user-role">{loggedUser.role || 'Resident'}</span>
              <span className="mobile-sidebar-user-dot">•</span>
              <span className="mobile-sidebar-user-unit">
                {loggedUser.unit ? `Lot ${loggedUser.unit}` : (activeLot || 'Lot A-03')}
              </span>
            </div>
          </div>
          <ChevronRight size={15} className="mobile-sidebar-user-chevron" />
        </div>

        {/* Navigation Sections & Links */}
        <nav className="invoice-sidebar-nav" aria-label="Main navigation">
          {groupedSections.map((section) => (
            <div key={section.id} className="mobile-sidebar-section">
              {section.label && (
                <div className="mobile-sidebar-section-header">
                  <span>{section.label}</span>
                </div>
              )}

              {section.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = !!expandedNav[item.id];
                const isActive = item.id === activeNavId;

                return (
                  <div key={item.id} className="invoice-nav-item">
                    <button
                      type="button"
                      className={`invoice-nav-link ${isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''
                        }`}
                      onClick={() => handleItemClick(item, hasChildren)}
                    >
                      <span className="invoice-nav-icon">{getNavIcon(item.id)}</span>
                      <span className="invoice-nav-label">{item.label}</span>
                      {hasChildren ? (
                        <span className="invoice-nav-chevron">
                          <ChevronDown size={14} />
                        </span>
                      ) : isActive ? (
                        <span className="invoice-nav-active-pill" />
                      ) : null}
                    </button>

                    {hasChildren && isExpanded && (
                      <div className="invoice-nav-children">
                        {item.children.map((child) => {
                          const isChildActive = child === activeChildNav;
                          return (
                            <button
                              type="button"
                              key={child}
                              className={`invoice-nav-child-link ${isChildActive ? 'active' : ''
                                }`}
                              onClick={() => handleChildClick(child)}
                            >
                              <span className="invoice-nav-child-bullet" />
                              <span className="invoice-nav-child-text">{child}</span>
                              {isChildActive && (
                                <span className="invoice-nav-child-active-dot" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer, Help & Sign Out */}
        <div className="invoice-sidebar-footer">
          <button
            type="button"
            className="invoice-sidebar-help-link"
            onClick={() => {
              onClose?.();
              onNavClick?.({ id: 'help', label: 'Help & Support' });
            }}
          >
            <div className="mobile-sidebar-footer-icon-wrap">
              <HelpCircle size={15} />
            </div>
            <span>Help &amp; Support</span>
          </button>

          <button
            type="button"
            className="invoice-sidebar-logout-link"
            onClick={async () => {
              onClose?.();
              if (onLogout) {
                onLogout();
              } else {
                await authService.logout();
                try {
                  f7.views.main.router.navigate('/login/', { reloadCurrent: true, ignoreCache: true });
                } catch (e) {
                  window.location.href = '/login/';
                }
              }
            }}
          >
            <div className="mobile-sidebar-footer-icon-wrap logout">
              <LogOut size={15} />
            </div>
            <span>Sign Out</span>
          </button>

          <div className="mobile-sidebar-bottom-meta">
            <div className="mobile-sidebar-system-status">
              <span className="mobile-sidebar-status-dot" />
              <span>Systems Operational</span>
            </div>
            <span className="mobile-sidebar-version">v2.4.0 • Enterprise</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
