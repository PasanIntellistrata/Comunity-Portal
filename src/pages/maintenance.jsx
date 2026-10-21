import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Page, f7 } from 'framework7-react';
import { X, Wrench, ClipboardList } from 'lucide-react';
import { authService } from '../js/services/auth.js';
import { PROPERTIES, NAV_ITEMS as BASE_NAV_ITEMS } from '../js/data/invoice-data.js';
import {
  MAINTENANCE_STATS,
  MAINTENANCE_VENDORS,
  WORK_ORDERS,
  QUOTATIONS,
  ITEMS_PER_PAGE_MAINT,
} from '../js/data/maintenance-data.js';
import { usePortalSelection } from '../js/services/portal-selection.js';
import AppSidebar from '../components/AppSidebar.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
import LotSelector from '../components/LotSelector.jsx';
import QuickActionsPopup from '../components/QuickActionsPopup.jsx';
import AiAssistantPopup from '../components/AiAssistantPopup.jsx';
import FloatingActionButtons from '../components/FloatingActionButtons.jsx';

// ── Badge helper ──────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    'Open': 'maint-badge--open',
    'In Progress': 'maint-badge--in-progress',
    'Completed': 'maint-badge--completed',
    'On Hold': 'maint-badge--on-hold',
    'Pending': 'maint-badge--pending',
    'Under Review': 'maint-badge--under-review',
    'Approved': 'maint-badge--approved',
    'Rejected': 'maint-badge--rejected',
  };
  return (
    <span className={`maint-badge ${map[status] || 'maint-badge--on-hold'}`}>
      {status}
    </span>
  );
};

// ── KPI Stat Icons ────────────────────────────────────────────────────────
const StatIcon = ({ id }) => {
  if (id === 'total') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
  if (id === 'open') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
  if (id === 'in_progress') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  );
  if (id === 'completed') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
  return null;
};

// ── Main Page ─────────────────────────────────────────────────────────────
const MaintenancePage = ({ onLogout }) => {
  const currentUser = authService.getUser() || {
    name: 'Portal Resident',
    role: 'Resident Owner',
    unit: '101',
    email: 'resident@intellistrata.com',
  };

  // ── Navigation State ───────────────────────────────────────────────────
  const [navItems] = useState(() =>
    BASE_NAV_ITEMS.map((item) => {
      if (item.id === 'maintenance') {
        return {
          ...item,
          active: true,
          children: ['Report Issues', 'Maintenance'],
          activeChild: 'Maintenance',
        };
      }
      return { ...item, active: false };
    })
  );
  const [expandedNav, setExpandedNav] = useState({ maintenance: true });
  const [activeChildNav, setActiveChildNav] = useState('Maintenance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Shared Property & Lot ──────────────────────────────────────────────
  const {
    selectedProperty,
    selectedLot,
    setSelectedProperty,
    setSelectedLot,
    properties,
  } = usePortalSelection();

  // ── Active Tab ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('workOrders'); // 'workOrders' | 'quotations'

  // ── Toast ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), duration);
  }, []);

  // ── Work Orders filters/pagination ─────────────────────────────────────
  const [woSearch, setWoSearch] = useState('');
  const [woStatusFilter, setWoStatusFilter] = useState('');
  const [woVendorFilter, setWoVendorFilter] = useState('');
  const [woPage, setWoPage] = useState(1);

  // ── Quotations filters/pagination ─────────────────────────────────────
  const [qtSearch, setQtSearch] = useState('');
  const [qtStatusFilter, setQtStatusFilter] = useState('');
  const [qtVendorFilter, setQtVendorFilter] = useState('');
  const [qtPage, setQtPage] = useState(1);

  // ── Detail Modal ───────────────────────────────────────────────────────
  const [viewingItem, setViewingItem] = useState(null); // { type: 'wo'|'qt', data: {...} }

  // ── FAB / Popup ────────────────────────────────────────────────────────
  const [activePopup, setActivePopup] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const popupRef = useRef(null);
  const fabGroupRef = useRef(null);
  const aiChatEndRef = useRef(null);

  // Click outside closes popup
  useEffect(() => {
    const handler = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        fabGroupRef.current && !fabGroupRef.current.contains(e.target)
      ) {
        setActivePopup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll AI chat to bottom
  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiTyping]);

  // ── Logout ────────────────────────────────────────────────────────────
  const handleLogoutClick = useCallback(async () => {
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

  // ── Property / Lot ────────────────────────────────────────────────────
  const handleSelectProperty = useCallback((prop) => {
    setSelectedProperty(prop);
    setWoPage(1);
    setQtPage(1);
    showToast(`Switched to ${prop.name}`, 'success');
  }, [setSelectedProperty, showToast]);

  const handleSelectLot = useCallback((lot) => {
    setSelectedLot(lot);
    setWoPage(1);
    setQtPage(1);
    showToast(`Selected ${lot}`, 'info');
  }, [setSelectedLot, showToast]);

  // ── Nav handlers ──────────────────────────────────────────────────────
  const toggleNavExpanded = (id) =>
    setExpandedNav((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleChildNavClick = (child) => {
    if (child === 'Report Issues') {
      try { f7.views.main.router.navigate('/report-issues/', { animate: false, reloadCurrent: true }); }
      catch (e) { window.location.href = '/report-issues/'; }
    } else if (child === 'Maintenance') {
      setActiveChildNav('Maintenance');
      // Already on maintenance page
    } else if (child === 'Invoice Approval' || child === 'All Invoices') {
      try { f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true }); }
      catch (e) { window.location.href = '/invoices/'; }
    } else if (child === 'Levy Overview' || child === 'My Levy') {
      try { f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true }); }
      catch (e) { window.location.href = '/levy/'; }
    } else if (child === 'Committee Decisions') {
      try { f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true }); }
      catch (e) { window.location.href = '/committee/decisions/'; }
    } else {
      setActiveChildNav(child);
      showToast(`${child} coming soon`);
    }
  };

  // ── Filtered Work Orders ──────────────────────────────────────────────
  const filteredWO = useMemo(() => {
    return WORK_ORDERS.filter((wo) => {
      const matchSearch = !woSearch ||
        wo.taskRef.toLowerCase().includes(woSearch.toLowerCase()) ||
        wo.taskSubject.toLowerCase().includes(woSearch.toLowerCase()) ||
        wo.vendor.toLowerCase().includes(woSearch.toLowerCase()) ||
        wo.woNumber.toLowerCase().includes(woSearch.toLowerCase());
      const matchStatus = !woStatusFilter || wo.status === woStatusFilter;
      const matchVendor = !woVendorFilter || woVendorFilter === 'All Vendors' || wo.vendor === woVendorFilter;
      const matchProp = !selectedProperty || !wo.property || wo.property === selectedProperty.name;
      const matchLot = selectedLot === 'All Lots' || !wo.lot || wo.lot === selectedLot || wo.lot === 'Common Area';
      return matchSearch && matchStatus && matchVendor && matchProp && matchLot;
    });
  }, [woSearch, woStatusFilter, woVendorFilter, selectedProperty, selectedLot]);

  const woPaged = useMemo(() => {
    const start = (woPage - 1) * ITEMS_PER_PAGE_MAINT;
    return filteredWO.slice(start, start + ITEMS_PER_PAGE_MAINT);
  }, [filteredWO, woPage]);

  const woTotalPages = Math.max(1, Math.ceil(filteredWO.length / ITEMS_PER_PAGE_MAINT));

  // ── Filtered Quotations ───────────────────────────────────────────────
  const filteredQT = useMemo(() => {
    return QUOTATIONS.filter((qt) => {
      const matchSearch = !qtSearch ||
        qt.quotationRef.toLowerCase().includes(qtSearch.toLowerCase()) ||
        qt.subject.toLowerCase().includes(qtSearch.toLowerCase()) ||
        qt.vendor.toLowerCase().includes(qtSearch.toLowerCase());
      const matchStatus = !qtStatusFilter || qt.status === qtStatusFilter;
      const matchVendor = !qtVendorFilter || qtVendorFilter === 'All Vendors' || qt.vendor === qtVendorFilter;
      const matchProp = !selectedProperty || !qt.property || qt.property === selectedProperty.name;
      return matchSearch && matchStatus && matchVendor && matchProp;
    });
  }, [qtSearch, qtStatusFilter, qtVendorFilter, selectedProperty]);

  const qtPaged = useMemo(() => {
    const start = (qtPage - 1) * ITEMS_PER_PAGE_MAINT;
    return filteredQT.slice(start, start + ITEMS_PER_PAGE_MAINT);
  }, [filteredQT, qtPage]);

  const qtTotalPages = Math.max(1, Math.ceil(filteredQT.length / ITEMS_PER_PAGE_MAINT));

  // ── Dynamic KPI Stats ─────────────────────────────────────────────────
  const dynamicStats = useMemo(() => {
    const scopedWO = WORK_ORDERS.filter((wo) =>
      (!selectedProperty || !wo.property || wo.property === selectedProperty.name) &&
      (selectedLot === 'All Lots' || !wo.lot || wo.lot === selectedLot || wo.lot === 'Common Area')
    );
    return MAINTENANCE_STATS.map((s) => {
      if (s.id === 'total') return { ...s, value: scopedWO.length };
      if (s.id === 'open') return { ...s, value: scopedWO.filter((w) => w.status === 'Open').length };
      if (s.id === 'in_progress') return { ...s, value: scopedWO.filter((w) => w.status === 'In Progress').length };
      if (s.id === 'completed') return { ...s, value: scopedWO.filter((w) => w.status === 'Completed').length };
      return s;
    });
  }, [selectedProperty, selectedLot]);

  // ── Popup handlers ────────────────────────────────────────────────────
  const handleToggleQuickActions = () =>
    setActivePopup((prev) => (prev === 'quickActions' ? null : 'quickActions'));

  const handleToggleAiAssistant = () =>
    setActivePopup((prev) => (prev === 'aiAssistant' ? null : 'aiAssistant'));

  const handleClosePopup = () => setActivePopup(null);

  const handleQuickAction = (actionKey) => {
    switch (actionKey) {
      case 'approve':
        setActiveTab('quotations');
        setQtStatusFilter('Pending');
        setActivePopup(null);
        showToast('Showing quotations pending review', 'info');
        break;
      case 'pending':
        setActiveTab('workOrders');
        setWoStatusFilter('Open');
        setActivePopup(null);
        showToast('Filtered: Open work orders', 'info');
        break;
      case 'overdue':
        setActiveTab('workOrders');
        setWoStatusFilter('In Progress');
        setActivePopup(null);
        showToast('Filtered: In Progress work orders', 'info');
        break;
      case 'export':
        setActivePopup(null);
        showToast('Exporting maintenance data to CSV...', 'success');
        break;
      case 'details':
        setActivePopup(null);
        if (filteredWO.length > 0) {
          handleOpenModal(filteredWO[0], 'workOrder');
        } else {
          showToast('No work orders available to view', 'info');
        }
        break;
      case 'documents':
        setActivePopup(null);
        showToast('Maintenance documents coming soon', 'info');
        break;
      default:
        setActivePopup(null);
    }
  };

  const AI_SUGGESTIONS = [
    'Show open work orders',
    'Which quotations need approval?',
    'Work orders by ABC Plumbing',
    'Completed work orders this month',
  ];

  const handleAiSuggestion = (query) => {
    const userMsg = { id: Date.now(), sender: 'user', text: query, time: 'Just now' };
    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);
    setTimeout(() => {
      let reply = '';
      if (query.toLowerCase().includes('open')) {
        setActiveTab('workOrders');
        setWoStatusFilter('Open');
        reply = `Found ${WORK_ORDERS.filter((w) => w.status === 'Open').length} open work orders. The highest priority items include the intercom system fault and leaking tap at Unit A03. Filter applied.`;
      } else if (query.toLowerCase().includes('quotation') || query.toLowerCase().includes('approval')) {
        setActiveTab('quotations');
        setQtStatusFilter('Pending');
        reply = `There are ${QUOTATIONS.filter((q) => q.status === 'Pending').length} quotations pending approval. Lobby lighting replacement ($1,480) and pool resurfacing ($8,900) require committee sign-off.`;
      } else if (query.toLowerCase().includes('abc plumbing')) {
        setWoVendorFilter('ABC Plumbing');
        setActiveTab('workOrders');
        reply = 'Showing all work orders for ABC Plumbing. They have 2 active work orders: leaking tap at Unit A03 (Open) and water pressure inspection (Open).';
      } else {
        reply = `Maintenance summary for ${selectedProperty.name}: ${dynamicStats.find(s => s.id === 'open')?.value || 0} open, ${dynamicStats.find(s => s.id === 'in_progress')?.value || 0} in progress, ${dynamicStats.find(s => s.id === 'completed')?.value || 0} completed. All records are up to date.`;
      }
      setAiMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'assistant', text: reply, time: 'Just now' }]);
      setIsAiTyping(false);
    }, 420);
  };

  const handleAiSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!aiInput.trim()) return;
    const query = aiInput.trim();
    setAiInput('');
    handleAiSuggestion(query);
  };

  // ── Pagination helper ─────────────────────────────────────────────────
  const renderPagination = (currentPage, totalPages, setPage, totalCount) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE_MAINT + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE_MAINT, totalCount);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <div className="maint-pagination">
        <span className="maint-pagination-info">
          Showing {start} to {end} of {totalCount}
        </span>
        <div className="maint-pagination-controls">
          <button
            className="maint-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >‹</button>
          {pages.map((pg) => (
            <button
              key={pg}
              className={`maint-page-btn ${pg === currentPage ? 'active' : ''}`}
              onClick={() => setPage(pg)}
              aria-label={`Page ${pg}`}
            >{pg}</button>
          ))}
          <button
            className="maint-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >›</button>
        </div>
      </div>
    );
  };

  // ── Detail Modal ──────────────────────────────────────────────────────
  const renderModal = () => {
    if (!viewingItem) return null;
    const { type, data } = viewingItem;
    const isWO = type === 'wo';
    return (
      <div className="maint-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setViewingItem(null); }}>
        <div className="maint-modal" role="dialog" aria-modal="true">
          <div className="maint-modal-header">
            <div>
              <div className="maint-modal-title">{isWO ? data.taskSubject : data.subject}</div>
              <div className="maint-modal-ref">{isWO ? data.taskRef : data.quotationRef}</div>
            </div>
            <button
              className="maint-modal-close"
              onClick={() => setViewingItem(null)}
              aria-label="Close"
            ><X size={16} /></button>
          </div>
          <div className="maint-modal-body">
            <div className="maint-detail-grid">
              {isWO ? (
                <>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Task Ref</div>
                    <div className="maint-detail-value maint-cell-ref">{data.taskRef}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">WO Number</div>
                    <div className="maint-detail-value maint-cell-ref">{data.woNumber}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Date Raised</div>
                    <div className="maint-detail-value">{data.dateRaised}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Status</div>
                    <div className="maint-detail-value"><StatusBadge status={data.status} /></div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Vendor</div>
                    <div className="maint-detail-value">{data.vendor}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Priority</div>
                    <div className="maint-detail-value">{data.priority}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Assigned To</div>
                    <div className="maint-detail-value">{data.assignedTo}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Location</div>
                    <div className="maint-detail-value">{data.lot}</div>
                  </div>
                  <div className="maint-detail-item full-width">
                    <div className="maint-detail-label">Summary of Work</div>
                    <div className="maint-detail-value">{data.summaryOfWork}</div>
                  </div>
                  <div className="maint-detail-item full-width">
                    <div className="maint-detail-label">Notes</div>
                    <div className="maint-detail-value">{data.notes}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Quotation Ref</div>
                    <div className="maint-detail-value maint-cell-ref">{data.quotationRef}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Date Raised</div>
                    <div className="maint-detail-value">{data.dateRaised}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Vendor</div>
                    <div className="maint-detail-value">{data.vendor}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Amount</div>
                    <div className="maint-detail-value maint-cell-amount">{data.amount}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Validity</div>
                    <div className="maint-detail-value">{data.validity}</div>
                  </div>
                  <div className="maint-detail-item">
                    <div className="maint-detail-label">Status</div>
                    <div className="maint-detail-value"><StatusBadge status={data.status} /></div>
                  </div>
                  <div className="maint-detail-item full-width">
                    <div className="maint-detail-label">Description</div>
                    <div className="maint-detail-value">{data.description}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <Page name="maintenance" noNavbar noToolbar className="invoice-page">
      <div className="invoice-app-shell">

        {/* ===== SIDEBAR ===== */}
        <AppSidebar
          isOpen={isSidebarOpen}
          navItems={navItems}
          expandedNav={expandedNav}
          activeChildNav={activeChildNav}
          activeNavId="maintenance"
          onToggleExpand={toggleNavExpanded}
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
              showToast(`${item.label} coming soon`);
            }
          }}
          onChildNavClick={handleChildNavClick}
          onLogout={handleLogoutClick}
          onLogoClick={() => showToast('Intellistrata Portal')}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* ===== MAIN AREA ===== */}
        <div className="invoice-main-area maint-main-area">

          {/* NAVBAR */}
          <AppNavbar
            searchTerm={activeTab === 'workOrders' ? woSearch : qtSearch}
            onSearchChange={(e) => {
              if (activeTab === 'workOrders') {
                setWoSearch(e.target.value);
                setWoPage(1);
              } else {
                setQtSearch(e.target.value);
                setQtPage(1);
              }
            }}
            onSearchClear={() => {
              if (activeTab === 'workOrders') {
                setWoSearch('');
                setWoPage(1);
              } else {
                setQtSearch('');
                setQtPage(1);
              }
            }}
            searchPlaceholder="Search maintenance, work orders, quotations..."
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

          {/* CONTENT */}
          <main className="invoice-content-area">

            {/* Breadcrumb */}
            <nav className="invoice-breadcrumb" aria-label="Breadcrumb">
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
              <span className="sep">›</span>
              <span className="current">Maintenance</span>
            </nav>

            {/* Title Row */}
            <div className="invoice-page-title-row">
              <div>
                <h1 className="invoice-page-title">Maintenance</h1>
                <p className="invoice-page-subtitle">
                  Managing{' '}
                  <span className="property-highlight">
                    {selectedProperty?.name || 'All Properties'}
                  </span>{' '}
                  &bull; <span className="lot-highlight">{selectedLot}</span>
                </p>
              </div>
              <LotSelector
                selectedLot={selectedLot}
                lots={selectedProperty?.lots || ['All Lots', 'Lot A-01', 'Lot A-02', 'Lot A-03', 'Lot B-01', 'Lot B-02']}
                propertyName={selectedProperty?.name || 'Green Valley Residence'}
                onSelectLot={handleSelectLot}
              />
            </div>

            {/* KPI Stats */}
            <div className="invoice-stats-grid">
              {dynamicStats.map((stat) => (
                <div key={stat.id} className="invoice-stat-card">
                  <div
                    className="invoice-stat-icon"
                    style={{ background: stat.iconBg, color: stat.iconColor }}
                  >
                    <StatIcon id={stat.id} />
                  </div>
                  <div className="invoice-stat-body">
                    <div className="invoice-stat-label">{stat.label}</div>
                    <div className="invoice-stat-value">{stat.value}</div>
                    {stat.sub && <div className="invoice-stat-sub">{stat.sub}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Tabs Card ─────────────────────────────────────────── */}
            <div className="maint-tabs-card">

              {/* Tab Strip */}
              <div className="maint-tab-strip" role="tablist">
                <button
                  id="tab-work-orders"
                  role="tab"
                  aria-selected={activeTab === 'workOrders'}
                  className={`maint-tab-btn ${activeTab === 'workOrders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('workOrders')}
                >
                  Work Orders
                </button>
                <button
                  id="tab-quotations"
                  role="tab"
                  aria-selected={activeTab === 'quotations'}
                  className={`maint-tab-btn ${activeTab === 'quotations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('quotations')}
                >
                  Quotations
                </button>
              </div>

              {/* ── WORK ORDERS TAB ────────────────────────────────── */}
              {activeTab === 'workOrders' && (
                <div className="maint-table-section" role="tabpanel" aria-labelledby="tab-work-orders">
                  {/* Controls */}
                  <div className="maint-table-controls">
                    <span className="maint-table-title">
                      Work Orders
                      <span className="maint-table-count">{filteredWO.length}</span>
                    </span>

                    {/* Search */}
                    <div className="maint-search-wrap">
                      <span className="maint-search-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </span>
                      <input
                        id="wo-search"
                        className="maint-search-input"
                        type="text"
                        placeholder="Search in table"
                        value={woSearch}
                        onChange={(e) => { setWoSearch(e.target.value); setWoPage(1); }}
                      />
                      {woSearch && (
                        <button className="maint-search-clear" onClick={() => { setWoSearch(''); setWoPage(1); }} aria-label="Clear search"><X size={12} /></button>
                      )}
                    </div>

                    {/* Status Filter */}
                    <select
                      id="wo-status-filter"
                      className="maint-filter-select"
                      value={woStatusFilter}
                      onChange={(e) => { setWoStatusFilter(e.target.value); setWoPage(1); }}
                      aria-label="Filter by status"
                    >
                      <option value="">Status: All</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>

                    {/* Vendor Filter */}
                    <select
                      id="wo-vendor-filter"
                      className="maint-filter-select"
                      value={woVendorFilter}
                      onChange={(e) => { setWoVendorFilter(e.target.value); setWoPage(1); }}
                      aria-label="Filter by vendor"
                    >
                      {MAINTENANCE_VENDORS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {/* Table */}
                  <div className="maint-table-wrap">
                    <table className="maint-table">
                      <thead>
                        <tr>
                          <th className="sortable">Task Ref <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Task Subject <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Date Raised <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">WO Number <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Vendor <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Summary of Work <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Status <span className="maint-sort-icon">↕</span></th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {woPaged.length === 0 ? (
                          <tr>
                            <td colSpan={8}>
                              <div className="maint-empty-state">
                                <div className="maint-empty-state-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                                  <Wrench size={38} strokeWidth={1.5} />
                                </div>
                                <div className="maint-empty-state-title">No work orders found</div>
                                <div className="maint-empty-state-sub">Try adjusting your filters</div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          woPaged.map((wo) => (
                            <tr key={wo.id}>
                              <td><span className="maint-cell-ref">{wo.taskRef}</span></td>
                              <td><span className="maint-cell-subject">{wo.taskSubject}</span></td>
                              <td>{wo.dateRaised}</td>
                              <td><span className="maint-cell-ref">{wo.woNumber}</span></td>
                              <td>{wo.vendor}</td>
                              <td><span className="maint-cell-summary">{wo.summaryOfWork}</span></td>
                              <td><StatusBadge status={wo.status} /></td>
                              <td>
                                <div className="maint-row-actions">
                                  <button
                                    className="maint-action-btn"
                                    onClick={() => setViewingItem({ type: 'wo', data: wo })}
                                    aria-label={`View details for ${wo.taskRef}`}
                                    title="View Details"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List — Work Orders */}
                  <div className="maint-mobile-list">
                    {woPaged.length === 0 ? (
                      <div className="maint-mobile-empty">
                        <Wrench size={32} strokeWidth={1.4} />
                        <p>No work orders found</p>
                      </div>
                    ) : (
                      woPaged.map((wo) => (
                        <div key={wo.id} className="maint-mobile-card">
                          <div className="maint-mobile-card-top">
                            <span className="maint-mobile-ref">{wo.taskRef}</span>
                            <StatusBadge status={wo.status} />
                          </div>
                          <div className="maint-mobile-subject">{wo.taskSubject}</div>
                          <div className="maint-mobile-card-meta">
                            <div className="maint-mobile-meta-item">
                              <span className="maint-mobile-meta-label">Date Raised</span>
                              <span className="maint-mobile-meta-value">{wo.dateRaised}</span>
                            </div>
                            <div className="maint-mobile-meta-item">
                              <span className="maint-mobile-meta-label">WO Number</span>
                              <span className="maint-mobile-meta-value maint-mono">{wo.woNumber}</span>
                            </div>
                            <div className="maint-mobile-meta-item">
                              <span className="maint-mobile-meta-label">Vendor</span>
                              <span className="maint-mobile-meta-value">{wo.vendor}</span>
                            </div>
                          </div>
                          <div className="maint-mobile-card-footer">
                            <button
                              className="maint-mobile-view-btn"
                              onClick={() => setViewingItem({ type: 'wo', data: wo })}
                              aria-label={`View details for ${wo.taskRef}`}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              View Details
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination */}
                  {filteredWO.length > 0 && renderPagination(woPage, woTotalPages, setWoPage, filteredWO.length)}
                </div>
              )}

              {/* ── QUOTATIONS TAB ─────────────────────────────────── */}
              {activeTab === 'quotations' && (
                <div className="maint-table-section" role="tabpanel" aria-labelledby="tab-quotations">
                  {/* Controls */}
                  <div className="maint-table-controls">
                    <span className="maint-table-title">
                      Quotations
                      <span className="maint-table-count">{filteredQT.length}</span>
                    </span>

                    {/* Search */}
                    <div className="maint-search-wrap">
                      <span className="maint-search-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </span>
                      <input
                        id="qt-search"
                        className="maint-search-input"
                        type="text"
                        placeholder="Search in table"
                        value={qtSearch}
                        onChange={(e) => { setQtSearch(e.target.value); setQtPage(1); }}
                      />
                      {qtSearch && (
                        <button className="maint-search-clear" onClick={() => { setQtSearch(''); setQtPage(1); }} aria-label="Clear search"><X size={12} /></button>
                      )}
                    </div>

                    {/* Status Filter */}
                    <select
                      id="qt-status-filter"
                      className="maint-filter-select"
                      value={qtStatusFilter}
                      onChange={(e) => { setQtStatusFilter(e.target.value); setQtPage(1); }}
                      aria-label="Filter quotation status"
                    >
                      <option value="">Status: All</option>
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    {/* Vendor Filter */}
                    <select
                      id="qt-vendor-filter"
                      className="maint-filter-select"
                      value={qtVendorFilter}
                      onChange={(e) => { setQtVendorFilter(e.target.value); setQtPage(1); }}
                      aria-label="Filter quotation vendor"
                    >
                      {MAINTENANCE_VENDORS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {/* Table */}
                  <div className="maint-table-wrap">
                    <table className="maint-table">
                      <thead>
                        <tr>
                          <th className="sortable">Quotation Ref <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Subject <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Date Raised <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Vendor <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Amount <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Validity <span className="maint-sort-icon">↕</span></th>
                          <th className="sortable">Status <span className="maint-sort-icon">↕</span></th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {qtPaged.length === 0 ? (
                          <tr>
                            <td colSpan={8}>
                              <div className="maint-empty-state">
                                <div className="maint-empty-state-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                                  <ClipboardList size={38} strokeWidth={1.5} />
                                </div>
                                <div className="maint-empty-state-title">No quotations found</div>
                                <div className="maint-empty-state-sub">Try adjusting your filters</div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          qtPaged.map((qt) => (
                            <tr key={qt.id}>
                              <td><span className="maint-cell-ref">{qt.quotationRef}</span></td>
                              <td><span className="maint-cell-subject">{qt.subject}</span></td>
                              <td>{qt.dateRaised}</td>
                              <td>{qt.vendor}</td>
                              <td><span className="maint-cell-amount">{qt.amount}</span></td>
                              <td><span className="maint-cell-validity">{qt.validity}</span></td>
                              <td><StatusBadge status={qt.status} /></td>
                              <td>
                                <div className="maint-row-actions">
                                  <button
                                    className="maint-action-btn"
                                    onClick={() => setViewingItem({ type: 'qt', data: qt })}
                                    aria-label={`View details for ${qt.quotationRef}`}
                                    title="View Details"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List — Quotations */}
                  <div className="maint-mobile-list">
                    {qtPaged.length === 0 ? (
                      <div className="maint-mobile-empty">
                        <ClipboardList size={32} strokeWidth={1.4} />
                        <p>No quotations found</p>
                      </div>
                    ) : (
                      qtPaged.map((qt) => (
                        <div key={qt.id} className="maint-mobile-card">
                          <div className="maint-mobile-card-top">
                            <span className="maint-mobile-ref">{qt.quotationRef}</span>
                            <StatusBadge status={qt.status} />
                          </div>
                          <div className="maint-mobile-subject">{qt.subject}</div>
                          <div className="maint-mobile-card-meta">
                            <div className="maint-mobile-meta-item">
                              <span className="maint-mobile-meta-label">Date Raised</span>
                              <span className="maint-mobile-meta-value">{qt.dateRaised}</span>
                            </div>
                            <div className="maint-mobile-meta-item">
                              <span className="maint-mobile-meta-label">Amount</span>
                              <span className="maint-mobile-meta-value maint-mobile-amount">{qt.amount}</span>
                            </div>
                            <div className="maint-mobile-meta-item">
                              <span className="maint-mobile-meta-label">Vendor</span>
                              <span className="maint-mobile-meta-value">{qt.vendor}</span>
                            </div>
                            <div className="maint-mobile-meta-item">
                              <span className="maint-mobile-meta-label">Validity</span>
                              <span className="maint-mobile-meta-value">{qt.validity}</span>
                            </div>
                          </div>
                          <div className="maint-mobile-card-footer">
                            <button
                              className="maint-mobile-view-btn"
                              onClick={() => setViewingItem({ type: 'qt', data: qt })}
                              aria-label={`View details for ${qt.quotationRef}`}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              View Details
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination */}
                  {filteredQT.length > 0 && renderPagination(qtPage, qtTotalPages, setQtPage, filteredQT.length)}
                </div>
              )}

            </div>
            {/* ── End Tabs Card ─ */}

          </main>
        </div>
        {/* ── End Main Area ─ */}

      </div>
      {/* ── End App Shell ─ */}

      {/* ── Detail Modal ──────────────────────────────────── */}
      {renderModal()}

      {/* ── Toast ──────────────────────────────────────────── */}
      <div
        className={`invoice-toast ${toast.show ? 'show' : ''} ${toast.type || 'info'}`}
        role="alert"
        aria-live="polite"
      >
        {toast.message}
      </div>

      {/* ── Floating Action Buttons ────────────────────────── */}
      <FloatingActionButtons
        fabGroupRef={fabGroupRef}
        activePopup={activePopup}
        onToggleQuickActions={handleToggleQuickActions}
        onToggleAiAssistant={handleToggleAiAssistant}
      />

      {/* ── Quick Actions Popup ────────────────────────────── */}
      {activePopup === 'quickActions' && (
        <QuickActionsPopup
          popupRef={popupRef}
          onClose={handleClosePopup}
          onAction={handleQuickAction}
        />
      )}

      {/* ── AI Assistant Popup ─────────────────────────────── */}
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
          promptQuestion="How can I help you with maintenance?"
          suggestions={AI_SUGGESTIONS}
        />
      )}
    </Page>
  );
};

export default MaintenancePage;
