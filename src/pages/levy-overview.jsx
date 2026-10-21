import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Page, f7 } from 'framework7-react';
import {
  Wallet,
  Calendar,
  Download,
  FileText,
  Landmark,
  PiggyBank,
  Wrench,
  ChevronDown,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { authService } from '../js/services/auth.js';
import { NAV_ITEMS as BASE_NAV_ITEMS } from '../js/data/invoice-data.js';
import { usePortalSelection } from '../js/services/portal-selection.js';
import AppSidebar from '../components/AppSidebar.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
import LotSelector from '../components/LotSelector.jsx';
import QuickActionsPopup from '../components/QuickActionsPopup.jsx';
import AiAssistantPopup from '../components/AiAssistantPopup.jsx';
import FloatingActionButtons from '../components/FloatingActionButtons.jsx';
import MobileLevyView from '../components/MobileLevyView.jsx';

// Levy Fund Breakdown Data
const LEVY_FUNDS = [
  {
    id: 'general',
    name: 'General Fund',
    amount: 1800,
    percentage: 55.6,
    color: '#0d9488', // Teal
    bgLight: 'rgba(13, 148, 136, 0.12)',
    icon: Wallet,
    description: 'Day-to-day administration, cleaning, power & water',
  },
  {
    id: 'sinking',
    name: 'Sinking Fund',
    amount: 900,
    percentage: 27.8,
    color: '#0284c7', // Sky Blue
    bgLight: 'rgba(2, 132, 199, 0.12)',
    icon: Landmark,
    description: 'Capital expenditure, repainting, major roof & structural repairs',
  },
  {
    id: 'reserve',
    name: 'Reserve Fund',
    amount: 360,
    percentage: 11.1,
    color: '#f59e0b', // Amber
    bgLight: 'rgba(245, 158, 11, 0.12)',
    icon: PiggyBank,
    description: 'Emergency provisions and long-term asset renewals',
  },
  {
    id: 'maintenance',
    name: 'Maintenance Fund',
    amount: 180,
    percentage: 5.5,
    color: '#be185d', // Maroon / Rose
    bgLight: 'rgba(190, 24, 93, 0.12)',
    icon: Wrench,
    description: 'Preventive service contracts, lift & HVAC servicing',
  },
];

// Payment History Records
const PAYMENT_HISTORY = [
  {
    id: 'INV-2026-0152',
    dueDate: '20 May 2026',
    amount: '$810.00',
    paidDate: '20 May 2026',
    status: 'Paid',
    method: 'Online Banking',
  },
  {
    id: 'INV-2026-0144',
    dueDate: '20 Apr 2026',
    amount: '$810.00',
    paidDate: '20 Apr 2026',
    status: 'Paid',
    method: 'Credit Card',
  },
  {
    id: 'INV-2026-0136',
    dueDate: '20 Mar 2026',
    amount: '$810.00',
    paidDate: '20 Mar 2026',
    status: 'Paid',
    method: 'Online Banking',
  },
  {
    id: 'INV-2026-0128',
    dueDate: '20 Feb 2026',
    amount: '$810.00',
    paidDate: '20 Feb 2026',
    status: 'Paid',
    method: 'Credit Card',
  },
  {
    id: 'INV-2026-0120',
    dueDate: '20 Jan 2026',
    amount: '$810.00',
    paidDate: '20 Jan 2026',
    status: 'Paid',
    method: 'Direct Debit',
  },
  {
    id: 'INV-2025-0112',
    dueDate: '20 Dec 2025',
    amount: '$790.00',
    paidDate: '20 Dec 2025',
    status: 'Paid',
    method: 'Online Banking',
  },
];

// Upcoming Payment Plan
const UPCOMING_PAYMENTS = [
  {
    id: 'INV-2026-0160',
    dueDate: '20 Aug 2026',
    amount: '$810.00',
    paidDate: 'Scheduled',
    status: 'Pending',
    method: 'Direct Debit',
  },
  {
    id: 'INV-2026-0168',
    dueDate: '20 Nov 2026',
    amount: '$810.00',
    paidDate: 'Scheduled',
    status: 'Scheduled',
    method: 'Direct Debit',
  },
  {
    id: 'INV-2027-0176',
    dueDate: '20 Feb 2027',
    amount: '$810.00',
    paidDate: 'Scheduled',
    status: 'Scheduled',
    method: 'Direct Debit',
  },
  {
    id: 'INV-2027-0184',
    dueDate: '20 May 2027',
    amount: '$810.00',
    paidDate: 'Scheduled',
    status: 'Scheduled',
    method: 'Direct Debit',
  },
];

const LevyOverviewPage = ({ onLogout }) => {
  const currentUser = authService.getUser() || {
    name: 'Portal Resident',
    role: 'Resident Owner',
    unit: '101',
    email: 'resident@intellistrata.com',
  };

  // Shared Property & Lot Selection
  const {
    selectedProperty,
    selectedLot,
    setSelectedProperty,
    setSelectedLot,
    properties,
  } = usePortalSelection();

  // Navigation State
  const [navItems] = useState(() =>
    BASE_NAV_ITEMS.map((item) => {
      if (item.id === 'levy') {
        return {
          ...item,
          label: 'My Levy',
          active: true,
          children: ['Levy Overview'],
          activeChild: 'Levy Overview',
        };
      }
      return { ...item, active: false };
    })
  );
  const [expandedNav, setExpandedNav] = useState({ levy: true });
  const [activeChildNav, setActiveChildNav] = useState('Levy Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Table Tabs & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [activePaymentsTab, setActivePaymentsTab] = useState('history'); // 'history' | 'upcoming'
  const [timeRange, setTimeRange] = useState('This Year');
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Popups & FABs state
  const [activePopup, setActivePopup] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const popupRef = useRef(null);
  const fabGroupRef = useRef(null);
  const aiChatEndRef = useRef(null);

  // Toast Helper
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

  // Handlers for Property & Lot
  const handleSelectProperty = useCallback(
    (prop) => {
      setSelectedProperty(prop);
      showToast(`Switched to ${prop.name}`, 'success');
    },
    [setSelectedProperty, showToast]
  );

  const handleSelectLot = useCallback(
    (lot) => {
      setSelectedLot(lot);
      showToast(`Selected ${lot}`, 'info');
    },
    [setSelectedLot, showToast]
  );

  // Navigation handlers
  const toggleNavExpanded = (id) =>
    setExpandedNav((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleNavClick = (item) => {
    if (item.id === 'home') {
      try {
        f7.views.main.router.navigate('/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/';
      }
    } else if (item.id === 'levy') {
      // Already on levy page
    } else if (item.id === 'invoices') {
      try {
        f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/invoices/';
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
    } else if (item.id === 'committee') {
      try {
        f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/committee/decisions/';
      }
    } else if (item.id === 'payments') {
      try {
        f7.views.main.router.navigate('/payment-plan/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/payment-plan/';
      }
    } else {
      showToast(`${item.label} coming soon`);
    }
  };

  const handleChildNavClick = (child) => {
    if (child === 'Levy Overview' || child === 'My Levy') {
      setActiveChildNav('Levy Overview');
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
    } else if (child === 'Invoice Approval' || child === 'All Invoices') {
      try {
        f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/invoices/';
      }
    } else if (child === 'Committee Decisions') {
      try {
        f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/committee/decisions/';
      }
    } else {
      setActiveChildNav(child);
      showToast(`${child} coming soon`);
    }
  };

  // Logout Handler
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

  // Click outside to close popup
  useEffect(() => {
    const handleClickOutside = (e) => {
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

  // AI assistant submit
  const handleAiSubmit = () => {
    if (!aiInput.trim()) return;
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: aiInput.trim(),
      time: 'Just now',
    };
    setAiMessages((prev) => [...prev, userMsg]);
    const promptText = aiInput.trim().toLowerCase();
    setAiInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      let reply =
        'Your current total levy due is $3,240.00 across General, Sinking, Reserve, and Maintenance funds.';
      if (promptText.includes('due') || promptText.includes('when')) {
        reply = 'The next scheduled levy installment of $810.00 is due on 20 Aug 2026.';
      } else if (promptText.includes('sinking') || promptText.includes('capital')) {
        reply =
          'The Sinking Fund is allocated 27.8% ($900.00) of your levy to support long-term capital replacements and structural works.';
      } else if (promptText.includes('statement') || promptText.includes('invoice')) {
        reply =
          'You can download your official statement anytime via the "Download Statement" button at the top right of this page.';
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

  // Compute donut chart stroke arcs (radius = 70, circumference = ~439.82)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const totalAmount = 3240;
  const segmentGap = 4; // Flat spacing between segments (no curved ends)

  let cumulativePercent = 0;
  const donutSegments = LEVY_FUNDS.map((fund) => {
    const arcLength = (fund.percentage / 100) * circumference;
    const strokeDasharray = `${Math.max(0, arcLength - segmentGap)} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference + segmentGap / 2);
    cumulativePercent += fund.percentage;
    return {
      ...fund,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const displayedPayments = useMemo(() => {
    let list = activePaymentsTab === 'history' ? PAYMENT_HISTORY : UPCOMING_PAYMENTS;
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.dueDate.toLowerCase().includes(q) ||
          p.amount.toLowerCase().includes(q) ||
          (p.paidDate && p.paidDate.toLowerCase().includes(q)) ||
          p.status.toLowerCase().includes(q) ||
          p.method.toLowerCase().includes(q)
      );
    }
    return showAllPayments ? list : list.slice(0, 4);
  }, [activePaymentsTab, showAllPayments, searchTerm]);

  return (
    <Page name="levy-overview" noNavbar noToolbar className="invoice-page">
      <div className="invoice-app-shell">
        {/* ===== SIDEBAR ===== */}
        <AppSidebar
          isOpen={isSidebarOpen}
          navItems={navItems}
          expandedNav={expandedNav}
          activeChildNav={activeChildNav}
          activeNavId="levy"
          onToggleExpand={toggleNavExpanded}
          onNavClick={handleNavClick}
          onChildNavClick={handleChildNavClick}
          onLogout={handleLogout}
          onLogoClick={() => showToast('Intellistrata Portal')}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* ===== MAIN AREA ===== */}
        <div className="invoice-main-area">
          {/* Top Header Navbar */}
          <AppNavbar
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            onSearchClear={() => setSearchTerm('')}
            searchPlaceholder="Search levies, invoices, notices..."
            selectedProperty={selectedProperty}
            properties={properties}
            onSelectProperty={handleSelectProperty}
            notificationCount={3}
            currentUser={currentUser}
            onProfileClick={() => {
              try { f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/profile/'; }
            }}
            onLogout={handleLogout}
            onMobileMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
          />

          {/* Main Content Area */}
          <main className="invoice-content-area">
            {/* DESKTOP EXPERIENCE (> 900px) */}
            <div className="levy-desktop-view">
              {/* Breadcrumb Navigation */}
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
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                My Levy
              </a>
              <span className="sep">›</span>
              <span className="current">Levy Overview</span>
            </nav>

            {/* Title Row */}
            <div className="invoice-page-title-row">
              <div>
                <h1 className="invoice-page-title">Levy Overview</h1>
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
                lots={
                  selectedProperty?.lots || [
                    'All Lots',
                    'Lot A-01',
                    'Lot A-02',
                    'Lot A-03',
                    'Lot B-01',
                    'Lot B-02',
                  ]
                }
                propertyName={selectedProperty?.name || 'Green Valley Residence'}
                onSelectLot={handleSelectLot}
              />
            </div>

            {/* Levy Dashboard Main Container */}
            <div className="levy-content-container">

            {/* Top 3 Cards in the Same Line: Total Due, Next Payment, Levy Breakdown */}
            <div className="levy-top-row">
              {/* Card 1: Total Levy Due */}
              <div className="levy-kpi-card">
                <div className="levy-kpi-icon-wrap teal">
                  <Wallet size={24} />
                </div>
                <div className="levy-kpi-body">
                  <div className="levy-kpi-label">Total Levy Due</div>
                  <div className="levy-kpi-value">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <div className="levy-kpi-badge-due">Due in 15 days</div>
                </div>
              </div>

              {/* Card 2: Next Payment */}
              <div className="levy-kpi-card">
                <div className="levy-kpi-icon-wrap blue">
                  <Calendar size={24} />
                </div>
                <div className="levy-kpi-body">
                  <div className="levy-kpi-label">Next Payment</div>
                  <div className="levy-kpi-value">20 Aug 2026</div>
                  <div className="levy-kpi-subtext">$810.00</div>
                </div>
              </div>

              {/* Card 3: Levy Breakdown Section */}
              <div className="levy-card levy-breakdown-card">
                <div className="levy-card-header">
                  <h3 className="levy-card-title">Levy Breakdown</h3>
                  <div className="levy-time-dropdown-wrap">
                    <select
                      className="levy-select-time"
                      value={timeRange}
                      onChange={(e) => {
                        setTimeRange(e.target.value);
                        showToast(`Viewing breakdown for ${e.target.value}`);
                      }}
                    >
                      <option value="This Year">This Year</option>
                      <option value="Last Year">Last Year</option>
                      <option value="All Time">All Time</option>
                    </select>
                  </div>
                </div>

                <div className="levy-breakdown-content">
                  {/* SVG Donut Chart with Flat Non-Curved Segment Edges */}
                  <div className="levy-chart-container">
                    <svg
                      className="levy-donut-svg"
                      viewBox="0 0 200 200"
                      width="100%"
                      height="100%"
                    >
                      {/* Background track */}
                      <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="18"
                      />

                      {/* Donut Segments with flat edges (strokeLinecap="butt") */}
                      {donutSegments.map((segment) => {
                        const isHovered = hoveredSegment === segment.id;
                        return (
                          <circle
                            key={segment.id}
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={isHovered ? 21 : 17}
                            strokeDasharray={segment.strokeDasharray}
                            strokeDashoffset={segment.strokeDashoffset}
                            strokeLinecap="butt"
                            className="levy-donut-segment"
                            style={{
                              transform: 'rotate(-90deg)',
                              transformOrigin: '100px 100px',
                              transition: 'all 0.25s ease',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={() => setHoveredSegment(segment.id)}
                            onMouseLeave={() => setHoveredSegment(null)}
                            onClick={() => {
                              showToast(
                                `${segment.name}: $${segment.amount.toLocaleString()} (${segment.percentage}%)`
                              );
                            }}
                          />
                        );
                      })}

                      {/* Center Total Text */}
                      <text
                        x="100"
                        y="92"
                        textAnchor="middle"
                        className="levy-donut-center-label"
                      >
                        Total
                      </text>
                      <text
                        x="100"
                        y="114"
                        textAnchor="middle"
                        className="levy-donut-center-value"
                      >
                        ${totalAmount.toLocaleString()}
                      </text>
                    </svg>
                  </div>

                  {/* Fund Breakdown List */}
                  <div className="levy-breakdown-list">
                    {LEVY_FUNDS.map((fund) => {
                      const isHovered = hoveredSegment === fund.id;
                      return (
                        <div
                          key={fund.id}
                          className={`levy-breakdown-row ${isHovered ? 'highlighted' : ''}`}
                          onMouseEnter={() => setHoveredSegment(fund.id)}
                          onMouseLeave={() => setHoveredSegment(null)}
                        >
                          <div className="levy-fund-left">
                            <span
                              className="levy-fund-dot"
                              style={{ background: fund.color }}
                            />
                            <span className="levy-fund-name">{fund.name}</span>
                          </div>
                          <div className="levy-fund-right">
                            <span className="levy-fund-amount">
                              ${fund.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="levy-fund-pct">{fund.percentage}%</span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="levy-breakdown-divider" />

                    {/* Total Row */}
                    <div className="levy-breakdown-total-row">
                      <span className="levy-total-label">Total</span>
                      <span className="levy-total-amount">
                        ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payments Table Card */}
            <div className="levy-card levy-payments-card">
              {/* Card Header: Title + Download Statement Action */}
              <div className="levy-card-header payments-header">
                <div className="levy-payments-header-title-wrap">
                  <h3 className="levy-card-title">Payments</h3>
                </div>
                <button
                  type="button"
                  className="levy-btn-download-statement"
                  onClick={() => {
                    showToast(`Downloading Levy Statement for ${selectedLot} (PDF)...`);
                  }}
                  aria-label="Download Statement"
                >
                  <ArrowDownToLine size={14} />
                  <span className="levy-download-btn-text">Download Statement</span>
                </button>
              </div>

              {/* Payments Tab Strip with View All Toggle */}
              <div className="levy-payments-tab-strip" role="tablist">
                <div className="levy-payments-tabs-left">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activePaymentsTab === 'history'}
                    className={`levy-tab-btn ${
                      activePaymentsTab === 'history' ? 'active' : ''
                    }`}
                    onClick={() => setActivePaymentsTab('history')}
                  >
                    <span>Payment History</span>
                    <span className="levy-tab-count">{PAYMENT_HISTORY.length}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activePaymentsTab === 'upcoming'}
                    className={`levy-tab-btn ${
                      activePaymentsTab === 'upcoming' ? 'active' : ''
                    }`}
                    onClick={() => setActivePaymentsTab('upcoming')}
                  >
                    <span>Upcoming Payment Plan</span>
                    <span className="levy-tab-count">{UPCOMING_PAYMENTS.length}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="levy-btn-view-all"
                  onClick={() => setShowAllPayments((prev) => !prev)}
                >
                  {showAllPayments ? 'Show Less' : 'View All'}
                </button>
              </div>
              <div className="levy-table-responsive">
                <table className="levy-table">
                  <thead>
                    <tr>
                      <th>Invoice No.</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>{activePaymentsTab === 'history' ? 'Paid Date' : 'Status Date'}</th>
                      <th>Status</th>
                      <th>Payment Method</th>
                      <th className="th-action">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="td-inv-no">
                          <strong>{p.id}</strong>
                        </td>
                        <td>{p.dueDate}</td>
                        <td className="td-amount">{p.amount}</td>
                        <td>{p.paidDate}</td>
                        <td>
                          <span
                            className={`levy-status-pill ${
                              p.status.toLowerCase() === 'paid'
                                ? 'paid'
                                : p.status.toLowerCase() === 'pending'
                                ? 'pending'
                                : 'scheduled'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td>{p.method}</td>
                        <td className="td-action">
                          <button
                            type="button"
                            className="levy-btn-receipt"
                            onClick={() =>
                              showToast(`Downloading Receipt for ${p.id} (PDF)...`)
                            }
                            title="Download Receipt"
                            aria-label={`Download Receipt for ${p.id}`}
                          >
                            <FileText size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List — hidden on desktop */}
              <div className="levy-mobile-list">
                {displayedPayments.length === 0 ? (
                  <div className="levy-mobile-empty">No payments found.</div>
                ) : (
                  displayedPayments.map((p) => (
                    <div key={p.id} className="levy-mobile-payment-card">
                      {/* Top: Invoice ID + Status badge */}
                      <div className="levy-mobile-card-top">
                        <strong className="levy-mobile-inv-id">{p.id}</strong>
                        <span
                          className={`levy-status-pill ${
                            p.status.toLowerCase() === 'paid'
                              ? 'paid'
                              : p.status.toLowerCase() === 'pending'
                              ? 'pending'
                              : 'scheduled'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>

                      {/* Meta grid: Due date, Amount, Paid/Status date, Method */}
                      <div className="levy-mobile-card-meta">
                        <div className="levy-mobile-meta-item">
                          <span className="levy-mobile-meta-label">Due Date</span>
                          <span className="levy-mobile-meta-value">{p.dueDate}</span>
                        </div>
                        <div className="levy-mobile-meta-item">
                          <span className="levy-mobile-meta-label">Amount</span>
                          <span className="levy-mobile-meta-value levy-mobile-amount">{p.amount}</span>
                        </div>
                        <div className="levy-mobile-meta-item">
                          <span className="levy-mobile-meta-label">
                            {activePaymentsTab === 'history' ? 'Paid Date' : 'Status Date'}
                          </span>
                          <span className="levy-mobile-meta-value">{p.paidDate}</span>
                        </div>
                        <div className="levy-mobile-meta-item">
                          <span className="levy-mobile-meta-label">Method</span>
                          <span className="levy-mobile-meta-value">{p.method}</span>
                        </div>
                      </div>

                      {/* Footer: receipt button */}
                      <div className="levy-mobile-card-footer">
                        <button
                          type="button"
                          className="levy-mobile-receipt-btn"
                          onClick={() => showToast(`Downloading Receipt for ${p.id} (PDF)...`)}
                          aria-label={`Download Receipt for ${p.id}`}
                        >
                          <FileText size={14} />
                          <span>Download Receipt</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE EXPERIENCE (<= 900px) */}
        <MobileLevyView
          selectedProperty={selectedProperty}
          selectedLot={selectedLot}
          properties={properties}
          onSelectProperty={handleSelectProperty}
          onSelectLot={handleSelectLot}
          totalAmount={totalAmount}
          levyFunds={LEVY_FUNDS}
          donutSegments={donutSegments}
          paymentHistory={PAYMENT_HISTORY}
          upcomingPayments={UPCOMING_PAYMENTS}
          showToast={showToast}
          onNavigate={(path) => {
            try {
              f7.views.main.router.navigate(path, { animate: false, reloadCurrent: true });
            } catch (e) {
              window.location.href = path;
            }
          }}
        />
      </main>
      </div>
    </div>

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
            const key =
              typeof actionKey === 'string'
                ? actionKey
                : actionKey?.id || actionKey?.key;
            if (key === 'download-statement' || key === 'export') {
              showToast('Exporting complete levy summary to PDF...');
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
          promptQuestion="How can I help you with your Levies & Payments?"
          suggestions={[
            'What is my total levy due?',
            'When is the next payment due?',
            'Explain the Sinking Fund allocation',
            'How do I download my payment receipts?',
          ]}
        />
      )}
    </Page>
  );
};

export default LevyOverviewPage;
