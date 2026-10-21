import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Page, f7, Icon } from 'framework7-react';
import { AlertTriangle, AlertCircle, Check, Paperclip, X, Search } from 'lucide-react';
import { authService } from '../js/services/auth.js';
import { PROPERTIES, NAV_ITEMS as BASE_NAV_ITEMS } from '../js/data/invoice-data.js';
import { usePortalSelection } from '../js/services/portal-selection.js';
import {
  ISSUE_CATEGORIES,
  ENQUIRY_TYPES,
  REPORT_STATS,
  INITIAL_ISSUES,
} from '../js/data/report-issues-data.js';
import AppSidebar from '../components/AppSidebar.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
import LotSelector from '../components/LotSelector.jsx';
import QuickActionsPopup from '../components/QuickActionsPopup.jsx';
import AiAssistantPopup from '../components/AiAssistantPopup.jsx';
import FloatingActionButtons from '../components/FloatingActionButtons.jsx';

const ReportIssuesPage = ({ onLogout }) => {
  // Current user info
  const currentUser = authService.getUser() || {
    name: 'Portal Resident',
    role: 'Resident Owner',
    unit: '101',
    email: 'resident@intellistrata.com',
  };

  // Navigation State
  const [navItems] = useState(() =>
    BASE_NAV_ITEMS.map((item) => {
      if (item.id === 'maintenance') {
        return {
          ...item,
          active: true,
          children: ['Report Issues', 'Maintenance'],
          activeChild: 'Report Issues',
        };
      }
      return { ...item, active: false };
    })
  );
  const [expandedNav, setExpandedNav] = useState({ maintenance: true });
  const [activeChildNav, setActiveChildNav] = useState('Report Issues');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Globally shared Property & Lot selection
  const {
    selectedProperty,
    selectedLot,
    setSelectedProperty,
    setSelectedLot,
    properties,
  } = usePortalSelection();

  // View state: 'both' | 'form' | 'table'
  const [activeView, setActiveView] = useState('both');

  // Issues Data State
  const [issues, setIssues] = useState(INITIAL_ISSUES);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form State
  const [enquiryType, setEnquiryType] = useState('');
  const [isCommonProperty, setIsCommonProperty] = useState('Yes');
  const [isEmergency, setIsEmergency] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState(currentUser.name || 'Pasan Udara');
  const [email, setEmail] = useState(currentUser.email || 'pasan.udara@intellistrata.com');
  const [phone, setPhone] = useState('+61 400 123 456');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Filters & Pagination State
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Detail Modal State
  const [viewingIssue, setViewingIssue] = useState(null);

  // Popups & FABs state
  const [activePopup, setActivePopup] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Refs
  const propertyMenuRef = useRef(null);
  const lotMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const formCardRef = useRef(null);
  const popupRef = useRef(null);
  const fabGroupRef = useRef(null);
  const aiChatEndRef = useRef(null);

  // Toast notification helper
  const showToast = useCallback((text, cssClass = '') => {
    f7.toast
      .create({
        text,
        position: 'bottom',
        closeTimeout: 3000,
        cssClass,
      })
      .open();
  }, []);

  // Logout handler
  const handleLogout = useCallback(async () => {
    await authService.logout();
    if (onLogout) {
      onLogout();
    }
    try {
      f7.views.main.router.navigate('/login/', { reloadCurrent: true, ignoreCache: true });
    } catch (e) {
      window.location.href = '/login/';
    }
  }, [onLogout]);

  // Issues scoped to the selected Property and Lot
  const scopedIssues = useMemo(() => {
    return issues.filter((item) => {
      const matchProperty =
        !item.property ||
        item.property.toLowerCase() === selectedProperty.name.toLowerCase();
      const matchLot =
        selectedLot === 'All Lots' ||
        !item.lot ||
        item.lot === selectedLot ||
        item.lot === 'Common Area' ||
        item.lot === 'All Lots';
      return matchProperty && matchLot;
    });
  }, [issues, selectedProperty, selectedLot]);

  // Dynamic KPI Stats scoped to active property & lot
  const dynamicStats = useMemo(() => {
    const total = scopedIssues.length;
    const open = scopedIssues.filter((i) => i.status === 'Open').length;
    const inProgress = scopedIssues.filter((i) => i.status === 'In Progress').length;
    const resolved = scopedIssues.filter((i) => i.status === 'Resolved').length;

    return REPORT_STATS.map((s) => {
      if (s.id === 'total') return { ...s, value: total };
      if (s.id === 'open') return { ...s, value: open };
      if (s.id === 'in_progress') return { ...s, value: inProgress };
      if (s.id === 'resolved') return { ...s, value: resolved };
      return s;
    });
  }, [scopedIssues]);

  // Dynamic Category Counts scoped to active property & lot
  const categoriesWithCounts = useMemo(() => {
    return ISSUE_CATEGORIES.map((cat) => {
      const count = scopedIssues.filter(
        (i) => i.category.toLowerCase() === cat.name.toLowerCase()
      ).length;
      return { ...cat, count };
    });
  }, [scopedIssues]);

  // Filtered Issues for Table (scoped issues + search + filter pills)
  const filteredIssues = useMemo(() => {
    return scopedIssues.filter((item) => {
      const matchSearch =
        !tableSearch.trim() ||
        item.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.id.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.location.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.reporter.toLowerCase().includes(tableSearch.toLowerCase());

      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchCat =
        categoryFilter === 'All' ||
        item.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchSearch && matchStatus && matchCat;
    });
  }, [scopedIssues, tableSearch, statusFilter, categoryFilter]);

  // Clean SVG Icon renderers (prevents font ligature splitting & dots)
  const renderStatIcon = (statId) => {
    switch (statId) {
      case 'total':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        );
      case 'open':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        );
      case 'resolved':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderCategoryIcon = (categoryId) => {
    switch (categoryId) {
      case 'plumbing':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'electrical':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      case 'cleaning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 2z" />
          </svg>
        );
      case 'security':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case 'infrastructure':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case 'other':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
            <circle cx="5" cy="12" r="2" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Paged issues
  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / itemsPerPage));
  const pagedIssues = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredIssues.slice(start, start + itemsPerPage);
  }, [filteredIssues, currentPage, itemsPerPage]);

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!enquiryType) errs.enquiryType = 'Enquiry Type is required';
    if (!subject.trim()) errs.subject = 'Subject is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    return errs;
  };

  // Handle Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateForm();
    setFormErrors(errs);

    if (Object.keys(errs).length > 0) {
      showToast('Please fill in all required fields.', 'color-red');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newIdNum = issues.length + 1;
      const idFormatted = `#MNT-24-${String(newIdNum).padStart(3, '0')}`;

      // Map enquiry type to category
      let categoryName = 'Other';
      if (enquiryType.includes('Plumbing')) categoryName = 'Plumbing';
      else if (enquiryType.includes('Electrical') || enquiryType.includes('Lighting'))
        categoryName = 'Electrical';
      else if (enquiryType.includes('Cleaning')) categoryName = 'Cleaning';
      else if (enquiryType.includes('Security')) categoryName = 'Security';
      else if (enquiryType.includes('Building') || enquiryType.includes('Grounds'))
        categoryName = 'Infrastructure';

      const newIssue = {
        id: idFormatted,
        title: subject,
        category: categoryName,
        location: `${selectedProperty.name} - ${selectedLot}`,
        status: 'Open',
        priority: isEmergency ? 'High' : 'Medium',
        reported: 'Today',
        fullDate: new Date().toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        commonProperty: isCommonProperty,
        isEmergency,
        reporter: name,
        email,
        phone,
        description,
        files: attachedFiles.map((f) => f.name),
      };

      setIssues((prev) => [newIssue, ...prev]);
      setIsSubmitting(false);

      // Reset form
      setSubject('');
      setDescription('');
      setEnquiryType('');
      setIsEmergency(false);
      setAttachedFiles([]);
      setFormErrors({});

      showToast(`Enquiry ${idFormatted} submitted successfully!`, 'color-green');

      // Scroll to issues table to see newly added item
      setActiveView('both');
      setCurrentPage(1);
    }, 450);
  };

  // Handle Clear Form
  const handleClear = () => {
    setEnquiryType('');
    setIsCommonProperty('Yes');
    setIsEmergency(false);
    setSubject('');
    setDescription('');
    setAttachedFiles([]);
    setFormErrors({});
    showToast('Form fields cleared');
  };

  // Category card click
  const handleCategoryCardClick = (cat) => {
    setSelectedCategory(cat.name);
    // Also sync with table filter or pre-select in form
    setCategoryFilter(cat.name);
    setCurrentPage(1);
    showToast(`Filtered by ${cat.name} category`);
  };

  // File upload simulation
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles((prev) => [
        ...prev,
        ...files.map((f) => ({ name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' })),
      ]);
      showToast(`${files.length} file(s) attached`);
    }
  };

  const removeFile = (idx) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // AI Assistant Chat Handler
  const handleAiSubmit = () => {
    if (!aiInput.trim()) return;
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: aiInput.trim(),
      time: 'Just now',
    };
    setAiMessages((prev) => [...prev, userMsg]);
    const promptText = aiInput.trim();
    setAiInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      let reply =
        "I've noted that maintenance issue. I can help you prefill the subject and description or identify whether it affects common property.";
      if (promptText.toLowerCase().includes('leak') || promptText.toLowerCase().includes('water')) {
        reply =
          'For water leaks, make sure to isolate the local stop valve if safe. In the report form, select Enquiry Type: "Plumbing Issue / Leak", and mark whether common building risers are affected.';
      } else if (promptText.toLowerCase().includes('lift') || promptText.toLowerCase().includes('elevator')) {
        reply =
          'Lift entrapments are urgent priorities. If someone is trapped, contact 000 or the emergency lift contractor immediately via the notice board number.';
      }

      setAiMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: reply,
          time: 'Just now',
        },
      ]);
      setIsAiTyping(false);
    }, 450);
  };

  return (
    <Page name="report-issues" noNavbar noToolbar className="report-issues-page">
      <div className="report-issues-shell">
        {/* ===== SIDEBAR ===== */}
        <AppSidebar
          isOpen={isSidebarOpen}
          navItems={navItems}
          expandedNav={expandedNav}
          activeChildNav={activeChildNav}
          activeNavId="maintenance"
          onToggleExpand={(id) =>
            setExpandedNav((prev) => ({ ...prev, [id]: !prev[id] }))
          }
          onNavClick={(item) => {
            if (item.id === 'home') {
              try { f7.views.main.router.navigate('/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/'; }
            } else if (item.id === 'invoices') {
              try { f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/invoices/'; }
            } else if (item.id === 'levy') {
              try { f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/levy/'; }
            } else if (item.id === 'documents') {
              try { f7.views.main.router.navigate('/documents/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/documents/'; }
            } else if (item.id === 'profile') {
              try { f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/profile/'; }
            } else if (item.id === 'committee') {
              try { f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/committee/decisions/'; }
            } else {
              showToast(`Section ${item.label} coming soon`);
            }
          }}
          onChildNavClick={(child) => {
            if (child === 'Invoice Approval' || child === 'All Invoices') {
              try {
                f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
              } catch (e) {
                window.location.href = '/invoices/';
              }
            } else if (child === 'Maintenance') {
              try {
                f7.views.main.router.navigate('/maintenance/', { animate: false, reloadCurrent: true });
              } catch (e) {
                window.location.href = '/maintenance/';
              }
            } else if (child === 'Report Issues') {
              setActiveChildNav('Report Issues');
            } else if (child === 'Levy Overview' || child === 'My Levy') {
              try {
                f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true });
              } catch (e) {
                window.location.href = '/levy/';
              }
            } else if (child === 'Committee Decisions') {
              try {
                f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
              } catch (e) {
                window.location.href = '/committee/decisions/';
              }
            } else {
              setActiveChildNav(child);
              showToast(`Section ${child} coming soon`);
            }
          }}
          onLogout={handleLogout}
          onLogoClick={() => showToast('Intellistrata Community Portal')}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* ===== MAIN CONTENT ===== */}
        <div className="report-issues-main">
          {/* Top Header Component */}
          <AppNavbar
            searchTerm={tableSearch}
            onSearchChange={(e) => {
              setTableSearch(e.target.value);
              setCurrentPage(1);
            }}
            onSearchClear={() => {
              setTableSearch('');
              setCurrentPage(1);
            }}
            searchPlaceholder="Search invoices, documents, notices..."
            selectedProperty={selectedProperty}
            properties={properties}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              showToast(`Switched to ${prop.name}`);
            }}
            notificationCount={3}
            currentUser={currentUser}
            onProfileClick={() => {
              try { f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/profile/'; }
            }}
            onLogout={handleLogout}
            onMobileMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
          />

          {/* Main Body Content */}
          <div className="report-issues-content">
            {/* Breadcrumb Navigation */}
            <nav className="report-breadcrumb" aria-label="Breadcrumb">
              <span
                className="report-breadcrumb-item"
                onClick={() => {
                  try {
                    f7.views.main.router.navigate('/');
                  } catch (e) {
                    window.location.href = '/';
                  }
                }}
              >
                Dashboard
              </span>
              <span className="report-breadcrumb-separator">›</span>
              <span className="report-breadcrumb-item">Maintenance</span>
              <span className="report-breadcrumb-separator">›</span>
              <span className="report-breadcrumb-current">Reported Issues Log</span>
            </nav>

            {/* Title & Lot Row */}
            <div className="report-title-row">
              <div>
                <h1 className="report-title">Reported Issues Log</h1>
                <p className="report-subtitle">
                  Track, filter, and inspect reported maintenance issues. Managing{' '}
                  <strong>{selectedProperty.name}</strong> · {selectedLot}
                </p>
              </div>

              {/* Lot Selector Component */}
              <LotSelector
                selectedLot={selectedLot}
                lots={selectedProperty?.lots || ['All Lots', 'Lot A-01', 'Lot A-02', 'Lot A-03', 'Lot B-01', 'Lot B-02']}
                propertyName={selectedProperty.name}
                onSelectLot={(lot) => {
                  setSelectedLot(lot);
                  showToast(`Selected ${lot}`);
                }}
              />
            </div>

            {/* 4 KPI Stat Cards */}
            <div className="report-stats-grid">
              {dynamicStats.map((stat) => (
                <div key={stat.id} className="report-stat-card">
                  <div
                    className="report-stat-icon-wrap"
                    style={{ background: stat.iconBg, color: stat.iconColor }}
                  >
                    {renderStatIcon(stat.id)}
                  </div>
                  <div className="report-stat-info">
                    <div className="report-stat-label">{stat.label}</div>
                    <div className="report-stat-value">{stat.value}</div>
                    <div className="report-stat-sub">{stat.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Issue Categories Grid */}
            <div className="report-categories-wrap">
                <div className="report-section-heading">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary, #0d9488)' }}>
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span>Issue Categories</span>
                </div>
                <div className="report-categories-grid">
                  {categoriesWithCounts.map((cat) => {
                    const isSelected = categoryFilter === cat.name;
                    return (
                      <div
                        key={cat.id}
                        className={`report-category-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleCategoryCardClick(cat)}
                      >
                        <div className="report-category-left">
                          <div
                            className="report-category-icon-box"
                            style={{ background: cat.bgColor, color: cat.color }}
                          >
                            {renderCategoryIcon(cat.id)}
                          </div>
                          <div className="report-category-info">
                            <h4>{cat.name}</h4>
                            <p>{cat.description}</p>
                          </div>
                        </div>
                        <div className="report-category-badge">
                          {cat.count} {cat.count === 1 ? 'issue' : 'issues'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            {/* Reported Issues Table Section */}
            <div className="report-table-card">
              <div className="report-table-header">
                <div className="report-table-header-title">
                  <h3>Reported Issues Log</h3>
                  <span className="report-table-count">
                    {filteredIssues.length} total
                  </span>
                </div>

                  <div className="report-table-filters">
                    {/* Search filter */}
                    <div className="report-table-search-wrap">
                      <Search size={15} className="report-table-search-icon" />
                      <input
                        type="text"
                        className="report-table-search"
                        placeholder="Search issues..."
                        value={tableSearch}
                        onChange={(e) => {
                          setTableSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                      {tableSearch && (
                        <button
                          type="button"
                          className="report-table-search-clear"
                          onClick={() => {
                            setTableSearch('');
                            setCurrentPage(1);
                          }}
                          aria-label="Clear search"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Status dropdown */}
                    <select
                      className="report-table-select"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="All">All Status</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>

                    {/* Category dropdown */}
                    <select
                      className="report-table-select"
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="All">All Categories</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Security">Security</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Table Data */}
                <div className="report-table-wrap">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Reported</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedIssues.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            style={{
                              textAlign: 'center',
                              padding: '36px',
                              color: '#94a3b8',
                            }}
                          >
                            No maintenance issues found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        pagedIssues.map((issue) => (
                          <tr key={issue.id}>
                            <td className="report-issue-id">{issue.id}</td>
                            <td className="report-issue-title">
                              {issue.isEmergency && (
                                <span title="Emergency Issue" style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', marginRight: 4 }}>
                                  <AlertTriangle size={15} />
                                </span>
                              )}
                              <span>{issue.title}</span>
                            </td>
                            <td>
                              <span className="report-issue-category-tag">
                                <span>{issue.category}</span>
                              </span>
                            </td>
                            <td>{issue.location}</td>
                            <td>
                              <span
                                className={`report-status-badge ${issue.status
                                  .toLowerCase()
                                  .replace(' ', '-')}`}
                              >
                                {issue.status === 'Resolved' && (
                                  <Check size={12} strokeWidth={3} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                )}
                                {issue.status}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`report-priority-tag ${issue.priority.toLowerCase()}`}
                              >
                                <span className="report-priority-dot"></span>
                                <span>{issue.priority}</span>
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>
                              {issue.reported}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="report-action-btn"
                                onClick={() => setViewingIssue(issue)}
                                title="View Issue Details"
                                aria-label="View Issue Details"
                              >
                                <Icon ios="f7:eye" md="material:visibility" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="report-pagination">
                  <div className="report-pagination-info">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredIssues.length)} of{' '}
                    {filteredIssues.length} issues
                  </div>

                  <div className="report-pagination-controls">
                    <button
                      type="button"
                      className="report-page-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      aria-label="Previous Page"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`report-page-btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="report-page-btn"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      aria-label="Next Page"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {viewingIssue && (
        <div
          className="report-modal-backdrop"
          onClick={() => setViewingIssue(null)}
        >
          <div
            className="report-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="report-modal-header">
              <h3>
                <span>Issue Details: {viewingIssue.id}</span>
              </h3>
              <button
                type="button"
                className="report-modal-close"
                onClick={() => setViewingIssue(null)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <div className="report-modal-body">
              <div className="report-detail-row">
                <div className="report-detail-label">Title</div>
                <div className="report-detail-val" style={{ fontWeight: 700 }}>
                  {viewingIssue.title}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div className="report-detail-label">Status</div>
                  <span
                    className={`report-status-badge ${viewingIssue.status
                      .toLowerCase()
                      .replace(' ', '-')}`}
                  >
                    {viewingIssue.status}
                  </span>
                </div>
                <div>
                  <div className="report-detail-label">Priority</div>
                  <span
                    className={`report-priority-tag ${viewingIssue.priority.toLowerCase()}`}
                  >
                    <span className="report-priority-dot"></span>
                    <span>{viewingIssue.priority}</span>
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div className="report-detail-label">Category</div>
                  <div className="report-detail-val">{viewingIssue.category}</div>
                </div>
                <div>
                  <div className="report-detail-label">Location</div>
                  <div className="report-detail-val">{viewingIssue.location}</div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div className="report-detail-label">Common Property</div>
                  <div className="report-detail-val">
                    {viewingIssue.commonProperty || 'Yes'}
                  </div>
                </div>
                <div>
                  <div className="report-detail-label">Reported Date</div>
                  <div className="report-detail-val">{viewingIssue.fullDate}</div>
                </div>
              </div>

              <div className="report-detail-row">
                <div className="report-detail-label">Description</div>
                <div
                  className="report-detail-val"
                  style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '8px',
                    lineHeight: '1.5',
                  }}
                >
                  {viewingIssue.description}
                </div>
              </div>

              <div className="report-detail-row">
                <div className="report-detail-label">Reported By</div>
                <div className="report-detail-val">
                  {viewingIssue.reporter} · {viewingIssue.email}
                  {viewingIssue.phone ? ` · ${viewingIssue.phone}` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FLOATING ACTION BUTTONS ===== */}
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

      {/* Quick Actions Popup */}
      {activePopup === 'quickActions' && (
        <QuickActionsPopup
          popupRef={popupRef}
          onClose={() => setActivePopup(null)}
          onAction={(actionKey) => {
            const key = typeof actionKey === 'string' ? actionKey : actionKey?.id || actionKey?.key;
            if (key === 'create-task' || key === 'pending' || key === 'approve') {
              setActiveView('form');
              formCardRef.current?.scrollIntoView({ behavior: 'smooth' });
              showToast('Opened issue report form');
            } else if (key === 'export') {
              showToast('Exporting issue reports to CSV...');
            } else {
              showToast(`Quick Action: ${key}`);
            }
            setActivePopup(null);
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
          onSubmit={handleAiSubmit}
          onSuggestion={(sug) => {
            setAiInput(sug);
            handleAiSubmit();
          }}
          aiChatEndRef={aiChatEndRef}
          onClearChat={() => setAiMessages([])}
          promptQuestion="How can I help you with maintenance & issues?"
          suggestions={[
            'Report plumbing leak in common area',
            'How to report an elevator breakdown?',
            'Who pays for lot vs common property repairs?',
            'What constitutes an urgent maintenance emergency?',
          ]}
        />
      )}
    </Page>
  );
};

export default ReportIssuesPage;
