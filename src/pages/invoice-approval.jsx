import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Page, f7 } from 'framework7-react';
import {
  X,
  Calendar,
  Download,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileText,
} from 'lucide-react';
import { authService } from '../js/services/auth.js';
import {
  PROPERTIES,
  SUMMARY_STATS as INITIAL_STATS,
  VENDORS,
  NAV_ITEMS as INITIAL_NAV_ITEMS,
  INVOICES as INITIAL_INVOICES,
  ITEMS_PER_PAGE as DEFAULT_PER_PAGE,
} from '../js/data/invoice-data.js';
import { usePortalSelection } from '../js/services/portal-selection.js';
import AppSidebar from '../components/AppSidebar.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
import LotSelector from '../components/LotSelector.jsx';
import QuickActionsPopup from '../components/QuickActionsPopup.jsx';
import AiAssistantPopup from '../components/AiAssistantPopup.jsx';
import FloatingActionButtons from '../components/FloatingActionButtons.jsx';
import MobileInvoiceApproval from '../components/MobileInvoiceApproval.jsx';

const InvoiceApprovalPage = ({ onLogout }) => {
  // Current user info from auth service
  const currentUser = authService.getUser() || {
    name: 'Portal Resident',
    role: 'Resident Owner',
    unit: '101',
    email: 'resident@intellistrata.com',
  };

  // State
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  
  // Shared Property & Lot Selection
  const {
    selectedProperty,
    selectedLot,
    setSelectedProperty,
    setSelectedLot,
    properties,
  } = usePortalSelection();

  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const [isLotMenuOpen, setIsLotMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState(INITIAL_NAV_ITEMS);
  const [expandedNav, setExpandedNav] = useState({ invoices: true });
  const [activeChildNav, setActiveChildNav] = useState('Invoice Approval');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Quick Actions & AI Assistant Popups state
  const [activePopup, setActivePopup] = useState(null); // 'quickActions' | 'aiAssistant' | null
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Dropdown & Popup click-outside refs
  const propertyMenuRef = useRef(null);
  const lotMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const popupRef = useRef(null);
  const fabGroupRef = useRef(null);
  const aiChatEndRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (propertyMenuRef.current && !propertyMenuRef.current.contains(e.target)) {
        setIsPropertyMenuOpen(false);
      }
      if (lotMenuRef.current && !lotMenuRef.current.contains(e.target)) {
        setIsLotMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        fabGroupRef.current &&
        !fabGroupRef.current.contains(e.target)
      ) {
        setActivePopup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Mobile-responsive items per page
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 900);
  const [itemsPerPage, setItemsPerPage] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 900 ? 5 : DEFAULT_PER_PAGE
  );
  const [expandedCardId, setExpandedCardId] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      setItemsPerPage((prev) => {
        // Only auto-adjust if user hasn't manually changed it
        if (mobile && prev === DEFAULT_PER_PAGE) return 5;
        if (!mobile && prev === 5) return DEFAULT_PER_PAGE;
        return prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, duration);
  }, []);

  // Handlers for Property & Lot
  const handleSelectProperty = useCallback(
    (prop) => {
      setSelectedProperty(prop);
      setIsPropertyMenuOpen(false);
      setCurrentPage(1);
      showToast(`Switched to ${prop.name}`, 'success');
    },
    [setSelectedProperty, showToast]
  );

  const handleSelectLot = useCallback(
    (lot) => {
      setSelectedLot(lot);
      setIsLotMenuOpen(false);
      setCurrentPage(1);
      showToast(`Selected ${lot}`, 'info');
    },
    [setSelectedLot, showToast]
  );

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        !searchTerm ||
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = !statusFilter || inv.status === statusFilter;
      const matchVendor = !vendorFilter || inv.vendor === vendorFilter;
      const matchProperty =
        !inv.property || inv.property === selectedProperty.name;
      const matchLot =
        selectedLot === 'All Lots' ||
        !inv.lot ||
        inv.lot === selectedLot ||
        inv.lot === 'Common Area' ||
        inv.lot === 'All Lots';
      return matchSearch && matchStatus && matchVendor && matchProperty && matchLot;
    });
  }, [invoices, searchTerm, statusFilter, vendorFilter, selectedProperty, selectedLot]);

  // Dynamic stats calculation
  const stats = useMemo(() => {
    const pendingCount = invoices.filter((i) => i.status === 'Pending').length;
    const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;
    const approvedCount = invoices.filter((i) => i.status === 'Approved').length;

    return INITIAL_STATS.map((stat) => {
      if (stat.id === 'pending') {
        return { ...stat, value: pendingCount };
      }
      if (stat.id === 'overdue') {
        return { ...stat, value: overdueCount };
      }
      if (stat.id === 'approved') {
        return { ...stat, value: approvedCount };
      }
      return stat;
    });
  }, [invoices]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const pagedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const allOnPageSelected =
    pagedInvoices.length > 0 &&
    pagedInvoices.every((inv) => selectedIds.has(inv.id));
  const someOnPageSelected =
    !allOnPageSelected && pagedInvoices.some((inv) => selectedIds.has(inv.id));

  // Handlers
  const handleSelectAll = (checked) => {
    const newSelected = new Set(selectedIds);
    pagedInvoices.forEach((inv) => {
      if (checked) {
        newSelected.add(inv.id);
      } else {
        newSelected.delete(inv.id);
      }
    });
    setSelectedIds(newSelected);
  };

  const handleSelectRow = (id, checked) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleApprove = (id) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'Approved' } : inv))
    );
    showToast(`Invoice ${id} approved successfully!`, 'success');
  };

  const handleReject = (id) => {
    showToast(`Invoice ${id} marked for review / rejection.`, 'error');
  };

  const handleApproveSelected = () => {
    if (selectedIds.size === 0) return;
    setInvoices((prev) =>
      prev.map((inv) =>
        selectedIds.has(inv.id) ? { ...inv, status: 'Approved' } : inv
      )
    );
    const count = selectedIds.size;
    setSelectedIds(new Set());
    showToast(`${count} invoices approved successfully!`, 'success');
  };

  const handleRejectSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setSelectedIds(new Set());
    showToast(`${count} selected invoices rejected.`, 'error');
  };

  const handleLogoutClick = async () => {
    setIsUserMenuOpen(false);
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

  const toggleNavExpanded = (id) => {
    setExpandedNav((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Popup handlers
  const handleToggleQuickActions = () => {
    setActivePopup((prev) => (prev === 'quickActions' ? null : 'quickActions'));
  };

  const handleToggleAiAssistant = () => {
    setActivePopup((prev) => (prev === 'aiAssistant' ? null : 'aiAssistant'));
  };

  const handleClosePopup = () => {
    setActivePopup(null);
  };

  const handleQuickAction = (actionKey) => {
    switch (actionKey) {
      case 'approve': {
        const pending = invoices.filter((i) => i.status === 'Pending');
        if (selectedIds.size > 0) {
          handleApproveSelected();
          setActivePopup(null);
        } else if (pending.length > 0) {
          handleApprove(pending[0].id);
          setActivePopup(null);
        } else {
          showToast('All pending invoices are already approved!', 'info');
          setActivePopup(null);
        }
        break;
      }
      case 'pending': {
        setStatusFilter('Pending');
        setCurrentPage(1);
        setActivePopup(null);
        showToast('Filtered: Reviewing 4 pending invoices', 'info');
        break;
      }
      case 'overdue': {
        setStatusFilter('Overdue');
        setCurrentPage(1);
        setActivePopup(null);
        showToast('Filtered: 2 overdue invoices require attention', 'error');
        break;
      }
      case 'export': {
        setActivePopup(null);
        showToast('Exporting invoices to CSV...', 'success');
        break;
      }
      case 'details': {
        const target = invoices[0];
        setActivePopup(null);
        showToast(`Viewing details for invoice ${target.id} (${target.vendor})`, 'info');
        break;
      }
      case 'documents': {
        setActivePopup(null);
        showToast('Opening My Documents repository...', 'info');
        break;
      }
      default:
        setActivePopup(null);
    }
  };

  const AI_SUGGESTIONS = [
    'Show unpaid invoices',
    'Which invoices need approval?',
    'Explain invoice INV-2026-0587',
    'Show invoices from ABC Services',
  ];

  const handleAiSuggestion = (query) => {
    const userMsg = { id: Date.now(), sender: 'user', text: query, time: 'Just now' };
    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    setTimeout(() => {
      let replyText = '';
      if (query === 'Show unpaid invoices') {
        setStatusFilter('');
        setSearchTerm('');
        replyText =
          'I found 6 unpaid invoices (4 Pending, 2 Overdue) totaling $13,700.00. The highest priority is CleanPro Facilities ($3,200.00, overdue since 22 May). Unpaid records are now visible in the table.';
      } else if (query === 'Which invoices need approval?') {
        setStatusFilter('Pending');
        replyText =
          'There are 4 invoices currently awaiting committee approval totaling $12,450.00:\n• INV-2026-089: Apex Plumbing Solutions ($1,450.00)\n• INV-2026-088: BrightSpark Electrical ($820.00)\n• INV-2026-087: CleanPro Facilities ($3,200.00)\n• INV-2026-086: Evergreen Landscaping ($650.00)\n\nTable filter updated to show only Pending invoices.';
      } else if (query.includes('INV-2026-0587')) {
        replyText =
          'Invoice INV-2026-0587 was submitted by CoolAir Systems for quarterly HVAC preventative maintenance ($1,250.00) under Lot A-03. Work performed: 12 rooftop unit filter replacements, compressor coil cleaning, and refrigerant testing. Status: Overdue.';
      } else if (query.includes('ABC Services')) {
        setVendorFilter('All Vendors');
        replyText =
          'Recent records for ABC Services:\n• INV-2026-0421 ($2,400.00 - Lift Maintenance, Approved)\n• INV-2026-0512 ($1,150.00 - Scheduled Inspection, Paid)\nBoth records match scheduled maintenance SLAs.';
      } else {
        replyText = `Analysis complete for "${query}". Current records for ${selectedProperty.name} (${selectedLot}): 4 pending approval ($12,450.00), 2 overdue ($1,250.00), and 18 approved this month.`;
      }

      const aiReply = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: replyText,
        time: 'Just now',
      };
      setAiMessages((prev) => [...prev, aiReply]);
      setIsAiTyping(false);
    }, 400);
  };

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const query = aiInput.trim();
    setAiInput('');
    const userMsg = { id: Date.now(), sender: 'user', text: query, time: 'Just now' };
    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let replyText = '';
      if (lower.includes('pending') || lower.includes('approval') || lower.includes('approve')) {
        setStatusFilter('Pending');
        replyText =
          'You have 4 invoices pending approval ($12,450.00 total). Apex Plumbing ($1,450) and CleanPro Facilities ($3,200) require urgent sign-off. Filter applied.';
      } else if (lower.includes('overdue') || lower.includes('late')) {
        setStatusFilter('Overdue');
        replyText =
          'There are 2 overdue invoices totaling $1,250.00. Filter applied to display overdue items.';
      } else if (lower.includes('total') || lower.includes('budget') || lower.includes('spend')) {
        replyText = `For ${selectedProperty.name}, total expenditure this month is $31,210.00 across 18 approved invoices, remaining within the quarterly budget forecast.`;
      } else if (lower.includes('export') || lower.includes('csv') || lower.includes('download')) {
        showToast('Exporting invoices to CSV...', 'success');
        replyText = 'Export has been initiated. Your CSV download will include all active invoice records with metadata.';
      } else {
        replyText = `Regarding "${query}": I searched records for ${selectedProperty.name} (${selectedLot}). Everything is synced with the Strata management system. You can ask me to filter by vendor, check overdue amounts, or explain line items.`;
      }

      const aiReply = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: replyText,
        time: 'Just now',
      };
      setAiMessages((prev) => [...prev, aiReply]);
      setIsAiTyping(false);
    }, 450);
  };

  return (
    <Page name="invoice-approval" noNavbar noToolbar className="invoice-page">
      <div className="invoice-app-shell">
        {/* ===== SIDEBAR ===== */}
        <AppSidebar
          isOpen={isSidebarOpen}
          navItems={navItems}
          expandedNav={expandedNav}
          activeChildNav={activeChildNav}
          activeNavId="invoices"
          onToggleExpand={toggleNavExpanded}
          onNavClick={(item) => {
            if (item.id === 'home') {
              try { f7.views.main.router.navigate('/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/'; }
            } else if (item.id === 'levy') {
              try { f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/levy/'; }
            } else if (item.id === 'documents') {
              try { f7.views.main.router.navigate('/documents/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/documents/'; }
            } else if (item.id === 'profile') {
              try { f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/profile/'; }
            } else if (item.id === 'committee') {
              try { f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/committee/decisions/'; }
            } else if (item.id === 'payments') {
              try { f7.views.main.router.navigate('/payment-plan/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/payment-plan/'; }
            } else {
              showToast(`Section ${item.label} coming soon`);
            }
          }}
          onChildNavClick={(child) => {
            if (child === 'Report Issues') {
              try { f7.views.main.router.navigate('/report-issues/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/report-issues/'; }
            } else if (child === 'Maintenance') {
              try { f7.views.main.router.navigate('/maintenance/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/maintenance/'; }
            } else if (child === 'Levy Overview' || child === 'My Levy') {
              try { f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/levy/'; }
            } else if (child === 'Invoice Approval' || child === 'All Invoices') {
              setActiveChildNav('Invoice Approval');
              try { f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/invoices/'; }
            } else if (child === 'Committee Decisions') {
              try { f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/committee/decisions/'; }
            } else {
              setActiveChildNav(child);
              showToast(`Section ${child} coming soon`);
            }
          }}
          onLogout={handleLogoutClick}
          onLogoClick={() => showToast('Intellistrata Portal')}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* ===== MAIN AREA ===== */}
        <div className="invoice-main-area">
          {/* HEADER */}
          <AppNavbar
            searchTerm={searchTerm}
            onSearchChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            onSearchClear={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
            searchPlaceholder="Search invoices, documents, notices..."
            selectedProperty={selectedProperty}
            properties={properties}
            onSelectProperty={handleSelectProperty}
            notificationCount={3}
            currentUser={currentUser}
            onProfileClick={() => {
              try { f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/profile/'; }
            }}
            onLogout={handleLogoutClick}
            onMobileMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
          />

          {/* CONTENT AREA */}
          <main className="invoice-content-area">
            {/* DESKTOP EXPERIENCE (> 900px) */}
            <div className="invoice-desktop-view">
              {/* Breadcrumb */}
              <nav className="invoice-breadcrumb" aria-label="Breadcrumb">
              <a href="#" onClick={(e) => e.preventDefault()}>
                Dashboard
              </a>
              <span className="sep">›</span>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Invoices
              </a>
              <span className="sep">›</span>
              <span className="current">Invoice Approval</span>
            </nav>

            {/* Title Row */}
            <div className="invoice-page-title-row">
              <div>
                <h1 className="invoice-page-title">Invoice Approval</h1>
                <p className="invoice-page-subtitle">
                  Managing{' '}
                  <span className="property-highlight">
                    {selectedProperty.name}
                  </span>{' '}
                  &bull; <span className="lot-highlight">{selectedLot}</span>
                </p>
              </div>

              <LotSelector
                selectedLot={selectedLot}
                lots={selectedProperty.lots}
                propertyName={selectedProperty.name}
                onSelectLot={handleSelectLot}
              />
            </div>

            {/* Stats Cards */}
            <div className="invoice-stats-grid">
              {stats.map((stat) => (
                <div key={stat.id} className="invoice-stat-card">
                  <div
                    className="invoice-stat-icon"
                    style={{ background: stat.iconBg, color: stat.iconColor }}
                  >
                    {stat.id === 'pending' && <Clock size={18} />}
                    {stat.id === 'overdue' && <AlertCircle size={18} />}
                    {stat.id === 'approved' && <CheckCircle2 size={18} />}
                    {stat.id === 'total' && <DollarSign size={18} />}
                    {!['pending', 'overdue', 'approved', 'total'].includes(stat.id) && <FileText size={18} />}
                  </div>
                  <div className="invoice-stat-body">
                    <div className="invoice-stat-label">{stat.label}</div>
                    <div
                      className={`invoice-stat-value ${
                        String(stat.value).startsWith('$') ? 'large-money' : ''
                      }`}
                    >
                      {stat.value}
                    </div>
                    {stat.sub && (
                      <div
                        className={`invoice-stat-sub ${stat.trend || ''}`}
                      >
                        {stat.sub}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Card (Filters + Table + Pagination) */}
            <div className="invoice-main-card">
              {/* Filter Bar */}
              <div className="invoice-filter-bar">
                <div className="invoice-filter-search-wrap">
                  <span className="invoice-filter-search-icon">
                    <svg
                      width="14"
                      height="14"
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
                    className="invoice-filter-search"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="invoice-search-clear-btn"
                      onClick={() => setSearchTerm('')}
                      aria-label="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  className="invoice-filter-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by status"
                >
                  <option value="">Status: All</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Approved">Approved</option>
                </select>

                <select
                  className="invoice-filter-select"
                  value={vendorFilter}
                  onChange={(e) => {
                    setVendorFilter(e.target.value === 'All Vendors' ? '' : e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by vendor"
                >
                  {VENDORS.map((v) => (
                    <option key={v} value={v === 'All Vendors' ? '' : v}>
                      {v}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="invoice-filter-btn"
                  onClick={() => showToast('Date range filter coming soon')}
                >
                  <Calendar size={14} />
                  <span>01 May 2026 – 25 May 2026</span>
                </button>

                <button
                  type="button"
                  className="invoice-btn-export"
                  onClick={() => showToast('Exporting invoices to CSV...', 'success')}
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Bulk Action Bar */}
              {selectedIds.size > 0 && (
                <div className="invoice-bulk-bar">
                  <span className="selected-count">
                    Selected {selectedIds.size} invoice
                    {selectedIds.size !== 1 ? 's' : ''}
                  </span>
                  <div className="invoice-bulk-actions">
                    <button
                      type="button"
                      className="invoice-btn-approve-sel"
                      onClick={handleApproveSelected}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Approve Selected</span>
                    </button>
                    <button
                      type="button"
                      className="invoice-btn-reject-sel"
                      onClick={handleRejectSelected}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Reject Selected</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Table — hidden on mobile via CSS */}
              <div className="invoice-table-wrap">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>
                        <label className="invoice-checkbox-label">
                          <input
                            type="checkbox"
                            className="invoice-checkbox-input"
                            checked={allOnPageSelected}
                            onChange={(e) => handleSelectAll(!allOnPageSelected)}
                            aria-label="Select all invoices on page"
                          />
                          <span
                            className={`invoice-checkbox-box ${
                              allOnPageSelected
                                ? 'checked'
                                : someOnPageSelected
                                ? 'indeterminate'
                                : ''
                            }`}
                          >
                            {allOnPageSelected && (
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {!allOnPageSelected && someOnPageSelected && (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                              >
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            )}
                          </span>
                        </label>
                      </th>
                      <th>Invoice No.</th>
                      <th>Vendor</th>
                      <th>Date</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Submitted By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedInvoices.length === 0 ? (
                      <tr>
                        <td
                          colSpan="9"
                          style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          No invoices match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      pagedInvoices.map((inv) => {
                        const isSelected = selectedIds.has(inv.id);
                        const statusClass =
                          inv.status === 'Pending'
                            ? 'invoice-badge-pending'
                            : inv.status === 'Overdue'
                            ? 'invoice-badge-overdue'
                            : 'invoice-badge-approved';

                        return (
                          <tr
                            key={inv.id}
                            className={isSelected ? 'selected' : ''}
                          >
                            <td>
                              <label className="invoice-checkbox-label">
                                <input
                                  type="checkbox"
                                  className="invoice-checkbox-input"
                                  checked={isSelected}
                                  onChange={(e) =>
                                    handleSelectRow(inv.id, e.target.checked)
                                  }
                                  aria-label={`Select invoice ${inv.id}`}
                                />
                                <span
                                  className={`invoice-checkbox-box ${
                                    isSelected ? 'checked' : ''
                                  }`}
                                >
                                  {isSelected && (
                                    <svg
                                      width="11"
                                      height="11"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </span>
                              </label>
                            </td>
                            <td>
                              <span
                                className="invoice-id-cell"
                                onClick={() =>
                                  showToast(`Viewing details for ${inv.id}`)
                                }
                              >
                                {inv.id}
                              </span>
                            </td>
                            <td>
                              <span className="invoice-vendor-name">
                                {inv.vendor}
                              </span>
                            </td>
                            <td className="invoice-date-cell">{inv.date}</td>
                            <td className="invoice-date-cell">{inv.dueDate}</td>
                            <td className="invoice-amount-cell">{inv.amount}</td>
                            <td>
                              <span className={`invoice-badge ${statusClass}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td style={{ color: 'var(--color-text-body)' }}>
                              {inv.submittedBy}
                            </td>
                            <td>
                              <div className="invoice-action-cell">
                                <button
                                  type="button"
                                  className="invoice-action-btn action-view"
                                  title="View invoice"
                                  onClick={() =>
                                    showToast(`Previewing invoice ${inv.id}`)
                                  }
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                </button>
                                {inv.status !== 'Approved' && (
                                  <>
                                    <button
                                      type="button"
                                      className="invoice-action-btn approve"
                                      title="Approve invoice"
                                      onClick={() => handleApprove(inv.id)}
                                    >
                                      <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      className="invoice-action-btn reject"
                                      title="Reject invoice"
                                      onClick={() => handleReject(inv.id)}
                                    >
                                      <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List — hidden on desktop via CSS */}
              <div className="invoice-mobile-list">
                {pagedInvoices.length === 0 ? (
                  <div className="invoice-mobile-empty">
                    No invoices match your filter criteria.
                  </div>
                ) : (
                  pagedInvoices.map((inv) => {
                    const isSelected = selectedIds.has(inv.id);
                    const isExpanded = expandedCardId === inv.id;
                    const statusClass =
                      inv.status === 'Pending'
                        ? 'invoice-badge-pending'
                        : inv.status === 'Overdue'
                        ? 'invoice-badge-overdue'
                        : 'invoice-badge-approved';
                    return (
                      <div
                        key={inv.id}
                        className={`invoice-mobile-card${isSelected ? ' selected' : ''}`}
                      >
                        {/* Row 1: checkbox + vendor + status badge */}
                        <div className="invoice-mobile-card-row1">
                          <label className="invoice-checkbox-label">
                            <input
                              type="checkbox"
                              className="invoice-checkbox-input"
                              checked={isSelected}
                              onChange={(e) => handleSelectRow(inv.id, e.target.checked)}
                              aria-label={`Select invoice ${inv.id}`}
                            />
                            <span className={`invoice-checkbox-box${isSelected ? ' checked' : ''}`}>
                              {isSelected && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                          </label>
                          <span className="invoice-mobile-card-vendor">{inv.vendor}</span>
                          <span className={`invoice-badge ${statusClass}`}>{inv.status}</span>
                        </div>

                        {/* Row 2: invoice ID · due date · amount · actions */}
                        <div className="invoice-mobile-card-row2">
                          <span
                            className="invoice-id-cell"
                            onClick={() => showToast(`Viewing details for ${inv.id}`)}
                          >
                            {inv.id}
                          </span>
                          <span className="invoice-mobile-dot-sep">·</span>
                          <span className="invoice-mobile-due">Due {inv.dueDate}</span>
                          <span className="invoice-mobile-amount">{inv.amount}</span>
                          <div className="invoice-mobile-actions">
                            <button
                              type="button"
                              className="invoice-action-btn action-view"
                              title="View invoice"
                              onClick={() => showToast(`Previewing invoice ${inv.id}`)}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            {inv.status !== 'Approved' && (
                              <button
                                type="button"
                                className="invoice-mobile-more-btn"
                                title="Actions"
                                onClick={() => setExpandedCardId(isExpanded ? null : inv.id)}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                  <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded actions row */}
                        {isExpanded && inv.status !== 'Approved' && (
                          <div className="invoice-mobile-expanded-actions">
                            <span className="invoice-mobile-submitter">By {inv.submittedBy}</span>
                            <button
                              type="button"
                              className="invoice-action-btn approve"
                              title="Approve invoice"
                              onClick={() => { handleApprove(inv.id); setExpandedCardId(null); }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="invoice-action-btn reject"
                              title="Reject invoice"
                              onClick={() => { handleReject(inv.id); setExpandedCardId(null); }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              <div className="invoice-pagination-bar">
                <div className="invoice-pagination-info">
                  {filteredInvoices.length > 0 ? (
                    `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(
                      currentPage * itemsPerPage,
                      filteredInvoices.length
                    )} of ${filteredInvoices.length} invoices`
                  ) : (
                    'No invoices to display'
                  )}
                </div>

                <div className="invoice-pagination-pages">
                  <button
                    type="button"
                    className="invoice-page-btn nav-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        className={`invoice-page-btn ${
                          p === currentPage ? 'active' : ''
                        }`}
                        onClick={() => setCurrentPage(p)}
                        aria-label={`Page ${p}`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    className="invoice-page-btn nav-btn"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>

                <select
                  className="invoice-per-page-select"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  aria-label="Invoices per page"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* MOBILE EXPERIENCE (<= 900px) */}
          <MobileInvoiceApproval
            invoices={invoices}
            onApprove={handleApprove}
            onReject={handleReject}
            onApproveSelected={handleApproveSelected}
            onRejectSelected={handleRejectSelected}
            selectedIds={selectedIds}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            selectedProperty={selectedProperty}
            selectedLot={selectedLot}
            properties={properties}
            onSelectProperty={handleSelectProperty}
            onSelectLot={handleSelectLot}
            showToast={showToast}
            currentUser={currentUser}
          />
        </main>
        </div>
      </div>

      {/* Quick Actions Popup */}
      {activePopup === 'quickActions' && (
        <QuickActionsPopup
          popupRef={popupRef}
          onClose={handleClosePopup}
          onAction={handleQuickAction}
        />
      )}



      {/* AI Assistant Popup */}
      {activePopup === 'aiAssistant' && (
        <AiAssistantPopup
          popupRef={popupRef}
          onClose={handleClosePopup}
          messages={aiMessages}
          isTyping={isAiTyping}
          input={aiInput}
          onInputChange={setAiInput}
          onSubmit={handleAiSubmit}
          onSuggestion={handleAiSuggestion}
          aiChatEndRef={aiChatEndRef}
          onClearChat={() => setAiMessages([])}
        />
      )}

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        fabGroupRef={fabGroupRef}
        activePopup={activePopup}
        onToggleQuickActions={handleToggleQuickActions}
        onToggleAiAssistant={handleToggleAiAssistant}
      />

      {/* Toast Notification */}
      <div
        className={`invoice-toast ${toast.show ? 'show' : ''} ${toast.type}`}
        role="alert"
      >
        {toast.message}
      </div>
    </Page>
  );
};

export default InvoiceApprovalPage;
