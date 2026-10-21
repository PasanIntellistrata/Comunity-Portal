import React, { useState, useRef, useEffect } from 'react';
import { f7 } from 'framework7-react';
import { Menu, X, Building2, Check, Bell, User, LogOut, ChevronDown, Search, ArrowLeft, Sparkles, ArrowRight, CheckCheck } from 'lucide-react';
import { PROPERTIES } from '../js/data/invoice-data.js';
import { PROPERTY_NEWS } from '../js/data/home-data.js';

/**
 * AppNavbar — Common top navigation bar for all Intellistrata portal pages.
 *
 * Props:
 *   searchTerm          {string}      — current search input value
 *   onSearchChange      {fn(e)}       — change handler for search input
 *   onSearchClear       {fn()}        — clear handler for search input
 *   searchPlaceholder   {string}      — search placeholder text
 *   selectedProperty    {object}      — active property { id, name, address, lots }
 *   properties          {array}       — list of available properties
 *   onSelectProperty    {fn(prop)}    — handler when switching properties
 *   notificationCount   {number}      — unread notifications badge count
 *   onNotificationClick {fn()}        — handler when clicking bell icon
 *   currentUser         {object}      — user object { name, role, unit, email }
 *   onProfileClick      {fn()}        — handler when clicking profile settings
 *   onLogout            {fn()}        — handler when clicking log out
 *   onMobileMenuToggle  {fn()}        — handler for hamburger menu button on mobile
 *   className           {string}      — optional extra CSS class
 */
const AppNavbar = ({
  searchTerm = '',
  onSearchChange,
  onSearchClear,
  searchPlaceholder = 'Search invoices, documents, notices...',
  selectedProperty,
  properties = PROPERTIES,
  onSelectProperty,
  notificationCount = 3,
  onNotificationClick,
  currentUser,
  onProfileClick,
  onLogout,
  onMobileMenuToggle,
  className = '',
}) => {
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const propertyMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  // Auto focus mobile search input when mobile search is opened
  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // Close mobile search on screen resize above 768px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileSearchOpen) {
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileSearchOpen]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (propertyMenuRef.current && !propertyMenuRef.current.contains(e.target)) {
        setIsPropertyMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateHome = () => {
    setIsNotifOpen(false);
    try {
      f7.views.main.router.navigate('/home/', { animate: false, reloadCurrent: true });
    } catch (e) {
      window.location.href = '/home/';
    }
  };

  const unreadCount = hasMarkedRead ? 0 : (notificationCount !== undefined ? notificationCount : (PROPERTY_NEWS?.length || 3));

  const currentProp = selectedProperty || properties[0] || { name: 'Green Valley Residence' };

  const user = currentUser || {
    name: 'Portal Resident',
    role: 'Resident Owner',
    unit: '101',
    email: 'resident@intellistrata.com',
  };

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AS';

  const formatUnit = (unit) => {
    if (!unit) return '';
    const clean = String(unit).trim();
    if (clean.toLowerCase().startsWith('unit') || clean.toLowerCase().startsWith('penthouse')) {
      return `(${clean})`;
    }
    return `(Unit ${clean})`;
  };

  return (
    <header className={`app-navbar invoice-header ${isMobileSearchOpen ? 'mobile-search-active' : ''} ${className}`.trim()}>
      {isMobileSearchOpen ? (
        <div className="app-navbar-mobile-search-bar">
          <button
            type="button"
            className="app-navbar-mobile-search-back-btn"
            onClick={() => setIsMobileSearchOpen(false)}
            aria-label="Close search"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="app-navbar-mobile-search-input-wrap">
            <span className="app-navbar-mobile-search-icon">
              <Search size={15} />
            </span>
            <input
              id="app-navbar-mobile-search-input"
              ref={mobileSearchInputRef}
              type="text"
              className="app-navbar-mobile-search-input invoice-header-search"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={onSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || e.key === 'Enter') {
                  setIsMobileSearchOpen(false);
                }
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="app-navbar-mobile-search-clear-btn"
                onClick={() => {
                  if (onSearchClear) onSearchClear();
                  else if (onSearchChange) onSearchChange({ target: { value: '' } });
                  mobileSearchInputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="app-navbar-mobile-search-done-btn"
            onClick={() => setIsMobileSearchOpen(false)}
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <div className="app-navbar-left">
            {onMobileMenuToggle && (
              <button
                type="button"
                className="app-navbar-mobile-btn invoice-mobile-menu-btn"
                onClick={onMobileMenuToggle}
                aria-label="Toggle Navigation"
              >
                <Menu size={20} />
              </button>
            )}

            {/* Global Search Input */}
            <div className="app-navbar-search-wrap invoice-header-search-wrap">
              <span className="app-navbar-search-icon invoice-header-search-icon">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="app-navbar-search-input invoice-header-search"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={onSearchChange}
              />
              {searchTerm && onSearchClear && (
                <button
                  type="button"
                  className="app-navbar-search-clear invoice-search-clear-btn"
                  onClick={onSearchClear}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="app-navbar-right invoice-header-right">
            {/* Property Selector */}
            <div className="app-navbar-property-wrap invoice-property-menu-wrap" ref={propertyMenuRef}>
              <div
                className={`app-navbar-property-selector invoice-property-selector ${
                  isPropertyMenuOpen ? 'active' : ''
                }`}
                onClick={() => {
                  setIsPropertyMenuOpen((prev) => !prev);
                  setIsNotifOpen(false);
                  setIsUserMenuOpen(false);
                }}
                role="button"
                tabIndex={0}
                aria-label="Select Property"
                aria-expanded={isPropertyMenuOpen}
              >
                <div className="app-navbar-property-icon invoice-property-selector-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="app-navbar-property-text">
                  <div className="app-navbar-property-label invoice-property-selector-label">PROPERTY</div>
                  <div className="app-navbar-property-name invoice-property-selector-name">
                    {currentProp.name}
                  </div>
                </div>
                <span
                  className={`app-navbar-property-chevron invoice-property-selector-chevron ${
                    isPropertyMenuOpen ? 'open' : ''
                  }`}
                >
                  <ChevronDown size={14} />
                </span>
              </div>

              {isPropertyMenuOpen && (
                <div className="app-navbar-property-dropdown invoice-property-dropdown">
                  <div className="app-navbar-dropdown-header invoice-dropdown-header">
                    <div className="app-navbar-dropdown-title invoice-dropdown-title">Select Property</div>
                    <div className="app-navbar-dropdown-subtitle invoice-dropdown-subtitle">
                      Switch managed community
                    </div>
                  </div>
                  <div className="app-navbar-dropdown-list invoice-dropdown-list">
                    {properties.map((prop) => (
                      <button
                        key={prop.id}
                        type="button"
                        className={`app-navbar-dropdown-item invoice-property-item ${
                          prop.id === currentProp.id ? 'selected' : ''
                        }`}
                        onClick={() => {
                          if (onSelectProperty) onSelectProperty(prop);
                          setIsPropertyMenuOpen(false);
                        }}
                      >
                        <div className="app-navbar-property-item-icon invoice-property-item-icon">
                          <Building2 size={16} />
                        </div>
                        <div className="app-navbar-property-item-info invoice-property-item-info">
                          <div className="app-navbar-property-item-name invoice-property-item-name">
                            {prop.name}
                          </div>
                          <div className="app-navbar-property-item-addr invoice-property-item-addr">
                            {prop.address}
                          </div>
                        </div>
                        {prop.id === currentProp.id && (
                          <span className="app-navbar-property-item-check invoice-property-item-check">
                            <Check size={14} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              className={`app-navbar-search-toggle-btn ${searchTerm ? 'has-query' : ''}`}
              onClick={() => setIsMobileSearchOpen(true)}
              aria-label="Search"
              title="Search"
            >
              <Search size={18} />
              {searchTerm && <span className="app-navbar-search-active-dot" />}
            </button>

            {/* Notification Bell with Property News & Updates Dropdown */}
            <div className="app-navbar-notif-wrap invoice-notif-wrap" ref={notifMenuRef}>
              <button
                type="button"
                className={`app-navbar-notif-btn invoice-notif-btn ${isNotifOpen ? 'active' : ''}`}
                onClick={() => {
                  setIsNotifOpen((prev) => !prev);
                  setIsUserMenuOpen(false);
                  setIsPropertyMenuOpen(false);
                  if (onNotificationClick) onNotificationClick();
                }}
                aria-label="Notifications"
                aria-expanded={isNotifOpen}
                title="Property News & Updates"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="app-navbar-notif-badge invoice-notif-badge">{unreadCount}</span>
                )}
              </button>

              {/* Notification Dropdown (Property News & Updates) */}
              {isNotifOpen && (
                <div className="app-navbar-notif-dropdown" role="region" aria-label="Property News & Updates Notifications">
                  <div className="app-navbar-notif-header">
                    <div className="app-navbar-notif-header-title">
                      <div className="app-navbar-notif-header-icon-wrap">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <div className="app-navbar-notif-title-text">Property News &amp; Updates</div>
                        <div className="app-navbar-notif-subtitle">
                          {unreadCount > 0 ? `${unreadCount} unread notices` : 'All notices up to date'}
                        </div>
                      </div>
                    </div>
                    <div className="app-navbar-notif-header-actions">
                      {unreadCount > 0 ? (
                        <button
                          type="button"
                          className="app-navbar-notif-mark-read-btn"
                          onClick={() => setHasMarkedRead(true)}
                          title="Mark all notices as read"
                        >
                          <CheckCheck size={14} />
                          <span>Mark read</span>
                        </button>
                      ) : (
                        <span className="app-navbar-notif-all-read-pill">All Read</span>
                      )}
                    </div>
                  </div>

                  <div className="app-navbar-notif-list">
                    {PROPERTY_NEWS.map((item) => (
                      <article
                        key={item.id}
                        className="app-navbar-notif-item"
                        onClick={handleNavigateHome}
                        title="Click to view details in Home feed"
                      >
                        <div className="app-navbar-notif-meta">
                          <span className={`app-navbar-notif-tag ${item.tag ? item.tag.toLowerCase() : ''}`}>{item.tag}</span>
                          <span className="app-navbar-notif-date">{item.date}</span>
                          <span className="app-navbar-notif-dot">&bull;</span>
                          <span className="app-navbar-notif-read">{item.readTime}</span>
                        </div>
                        <h4 className="app-navbar-notif-item-title">{item.title}</h4>
                        <p className="app-navbar-notif-item-text">{item.content}</p>
                      </article>
                    ))}
                  </div>

                  <div className="app-navbar-notif-footer">
                    <button
                      type="button"
                      className="app-navbar-notif-footer-link"
                      onClick={handleNavigateHome}
                    >
                      <span>View all in Home Feed</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown Pill */}
            <div className="app-navbar-user-wrap invoice-user-menu-wrap" ref={userMenuRef}>
              <div
                className="app-navbar-user-pill invoice-user-avatar-wrap"
                onClick={() => {
                  setIsUserMenuOpen((prev) => !prev);
                  setIsNotifOpen(false);
                  setIsPropertyMenuOpen(false);
                }}
                role="button"
                tabIndex={0}
                aria-label="User profile menu"
              >
                <div className="app-navbar-user-avatar invoice-user-avatar">{initials}</div>
                <div className="app-navbar-user-info">
                  <div className="app-navbar-user-name invoice-user-info-name">{user.name}</div>
                  <div className="app-navbar-user-role invoice-user-info-role">
                    {user.role} {formatUnit(user.unit)}
                  </div>
                </div>
                <span
                  className={`app-navbar-user-chevron ${
                    isUserMenuOpen ? 'open' : ''
                  }`}
                >
                  <ChevronDown size={14} />
                </span>
              </div>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="app-navbar-user-dropdown invoice-user-dropdown">
                  <div className="app-navbar-user-dropdown-header invoice-dropdown-header">
                    <div className="app-navbar-dropdown-name invoice-dropdown-name">{user.name}</div>
                    <div className="app-navbar-dropdown-role invoice-dropdown-role">
                      {user.email || `${user.role} • Unit ${user.unit || '101'}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="app-navbar-user-dropdown-item invoice-dropdown-item"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onProfileClick) {
                        onProfileClick();
                      } else {
                        try {
                          f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true });
                        } catch (e) {
                          window.location.href = '/profile/';
                        }
                      }
                    }}
                  >
                    <User size={15} />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    type="button"
                    className="app-navbar-user-dropdown-item logout invoice-dropdown-item logout"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default AppNavbar;
