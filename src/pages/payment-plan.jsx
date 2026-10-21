import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Page, f7 } from 'framework7-react';
import {
  CreditCard,
  Calendar,
  Landmark,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Download,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  ChevronRight,
  TrendingUp,
  Receipt,
  Eye,
  X,
  Check,
} from 'lucide-react';
import { authService } from '../js/services/auth.js';
import { usePortalSelection } from '../js/services/portal-selection.js';
import { NAV_ITEMS as BASE_NAV_ITEMS } from '../js/data/invoice-data.js';
import {
  MOCK_PAYMENT_PLANS,
  DEFAULT_EMPTY_PLAN,
  PAYMENT_PLAN_FREQUENCIES,
  PAYMENT_METHODS,
  formatCurrency,
} from '../js/data/payment-plan-data.js';
import AppSidebar from '../components/AppSidebar.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
import LotSelector from '../components/LotSelector.jsx';
import FloatingActionButtons from '../components/FloatingActionButtons.jsx';
import QuickActionsPopup from '../components/QuickActionsPopup.jsx';
import AiAssistantPopup from '../components/AiAssistantPopup.jsx';
import MobilePaymentPlanView from '../components/MobilePaymentPlanView.jsx';

const PaymentPlanPage = ({ onLogout }) => {
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navbarSearch, setNavbarSearch] = useState('');
  const [expandedNav, setExpandedNav] = useState({ payments: true });

  const [navItems] = useState(() =>
    BASE_NAV_ITEMS.map((item) => ({
      ...item,
      active: item.id === 'payments',
    }))
  );

  // Current effective lot for the Payment Plan
  const effectiveLot = useMemo(() => {
    if (selectedLot && selectedLot !== 'All Lots') {
      return selectedLot;
    }
    if (selectedProperty?.lots) {
      const realLots = selectedProperty.lots.filter((l) => l !== 'All Lots');
      if (realLots.length > 0) return realLots[0];
    }
    return 'Lot A-03';
  }, [selectedLot, selectedProperty]);

  // Payment plans state (allows interactive updates in session)
  const [plansByProperty, setPlansByProperty] = useState(MOCK_PAYMENT_PLANS);

  // Current active plan for the selected property & effective lot
  const currentPlan = useMemo(() => {
    const propId = selectedProperty?.id || 'prop-1';
    const propPlans = plansByProperty[propId] || {};
    return propPlans[effectiveLot] || DEFAULT_EMPTY_PLAN;
  }, [selectedProperty, effectiveLot, plansByProperty]);

  // Modals state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Apply Form State
  const [applyForm, setApplyForm] = useState({
    targetAmount: '3500.00',
    frequency: 'Fortnightly',
    installmentAmount: '350.00',
    startDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Direct Debit (Bank Account)',
    reason: 'Temporary cash flow adjustment for strata quarterly building levies.',
    termsAccepted: true,
  });

  // Make Payment Form State
  const [payForm, setPayForm] = useState({
    amount: '350.00',
    method: 'Credit Card (Visa •••• 4242)',
    memo: 'Early payment for next scheduled installment',
  });

  // Toast feedback helper
  const showToast = useCallback((msg, type = 'info') => {
    try {
      f7.toast
        .create({
          text: msg,
          closeTimeout: 3000,
          position: 'bottom',
          cssClass: type === 'success' ? 'toast-success' : 'toast-info',
        })
        .open();
    } catch {
      // Fallback
    }
  }, []);

  // Floating Action Buttons & Popups State
  const [activePopup, setActivePopup] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const popupRef = useRef(null);
  const fabGroupRef = useRef(null);
  const aiChatEndRef = useRef(null);

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

  const handleAiSuggestion = (query) => {
    const userMsg = { id: Date.now(), sender: 'user', text: query, time: 'Just now' };
    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    setTimeout(() => {
      let replyText = '';
      if (query.includes('balance') || query.includes('outstanding')) {
        replyText = currentPlan.hasPlan
          ? `Your remaining payment plan balance for ${effectiveLot} is ${formatCurrency(currentPlan.dueAmount)}, with ${formatCurrency(currentPlan.amountPaid)} paid to date.`
          : `There is currently no active payment plan registered for ${effectiveLot}. You can apply for a payment plan using the "Apply for Payment Plan" button.`;
      } else if (query.includes('due') || query.includes('next installment')) {
        replyText = currentPlan.hasPlan
          ? `Your next installment of ${formatCurrency(currentPlan.installmentAmount || 350)} is scheduled for ${currentPlan.nextPaymentDate} via ${currentPlan.autoDebit ? 'Direct Debit' : 'Manual Payment'}.`
          : `No installment is currently scheduled. Once a payment plan is established, regular installments will show here.`;
      } else if (query.includes('apply')) {
        setIsApplyModalOpen(true);
        setActivePopup(null);
        replyText = `I have opened the Payment Plan application form for you. Please review the details and submit when ready.`;
      } else if (query.includes('direct debit')) {
        replyText = `Your payment plan is configured for automated bank direct debit (•••• 4821). To modify banking details, please contact your Strata Manager.`;
      } else {
        replyText = `Here is your payment plan summary for ${effectiveLot} at ${selectedProperty?.name || 'Parkside Residences'}: Agreed Amount: ${formatCurrency(currentPlan.agreedAmount || 0)}, Balance: ${formatCurrency(currentPlan.dueAmount || 0)}, Next Date: ${currentPlan.nextPaymentDate || 'N/A'}.`;
      }

      setAiMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: replyText, time: 'Just now' },
      ]);
      setIsAiTyping(false);
    }, 450);
  };

  const handleAiSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!aiInput.trim()) return;

    const query = aiInput.trim();
    setAiInput('');
    const userMsg = { id: Date.now(), sender: 'user', text: query, time: 'Just now' };
    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let replyText = '';
      if (lower.includes('apply') || lower.includes('new plan')) {
        setIsApplyModalOpen(true);
        setActivePopup(null);
        replyText = 'Opening the Payment Plan application form for you...';
      } else if (lower.includes('pay') || lower.includes('card')) {
        setIsPayModalOpen(true);
        setActivePopup(null);
        replyText = 'Opening the Make Installment Payment form for you...';
      } else if (lower.includes('balance') || lower.includes('due') || lower.includes('owe')) {
        replyText = `Current status for ${effectiveLot}: ${currentPlan.hasPlan ? `Balance due is ${formatCurrency(currentPlan.dueAmount)}.` : 'No active payment plan found. Outstanding balance can be set up in a plan anytime.'}`;
      } else if (lower.includes('receipt') || lower.includes('statement') || lower.includes('download')) {
        showToast('Downloading payment plan statement (PDF)...', 'success');
        replyText = 'Initiated download for your payment plan agreement & receipts.';
      } else {
        replyText = `Regarding "${query}": Your account for ${selectedProperty?.name || 'Parkside Residences'} (${effectiveLot}) is up to date. You can make an installment payment, apply for a tailored plan, or view past receipts anytime.`;
      }

      setAiMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: replyText, time: 'Just now' },
      ]);
      setIsAiTyping(false);
    }, 450);
  };

  // Handle Apply Form Submit
  const handleApplySubmit = (e) => {
    e.preventDefault();
    const propId = selectedProperty?.id || 'prop-1';
    const agreedAmt = parseFloat(applyForm.targetAmount) || 3500.0;
    const instAmt = parseFloat(applyForm.installmentAmount) || 350.0;
    const totalInst = Math.ceil(agreedAmt / instAmt);

    const newPlan = {
      hasPlan: true,
      status: 'Pending Approval',
      statusType: 'pending',
      statusLabel: 'PENDING APPROVAL',
      agreedAmount: agreedAmt,
      amountPaid: 0.0,
      dueAmount: agreedAmt,
      paidOnTime: 'Pending',
      frequency: applyForm.frequency,
      planStarted: `Proposed ${applyForm.startDate}`,
      planEnds: 'Under Review',
      installmentAmount: instAmt,
      nextPaymentDate: 'Pending Committee Review',
      nextPaymentAmount: instAmt,
      totalInstallments: totalInst,
      completedInstallments: 0,
      paymentMethod: applyForm.paymentMethod,
      levyReference: `LEV-2026-REQ-${effectiveLot}`,
      agreementId: `PP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      termsAgreedDate: new Date().toLocaleDateString('en-AU'),
      notice: `Payment plan application submitted for ${effectiveLot}. Awaiting Owners Corporation Committee approval.`,
      history: [],
    };

    setPlansByProperty((prev) => ({
      ...prev,
      [propId]: {
        ...(prev[propId] || {}),
        [effectiveLot]: newPlan,
      },
    }));

    setIsApplyModalOpen(false);
    showToast(`Payment plan application for ${effectiveLot} submitted successfully!`, 'success');
  };

  // Handle Make Extra Payment Submit
  const handleMakePaymentSubmit = (e) => {
    e.preventDefault();
    const propId = selectedProperty?.id || 'prop-1';
    const payAmt = parseFloat(payForm.amount) || 350.0;

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentDate: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
      receiptNo: `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      amount: payAmt,
      paidLevy: `Admin & Sinking Fund (Extra Payment)`,
      status: 'Completed',
      method: payForm.method.split(' ')[0] || 'Direct Debit',
      reference: `EXT-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    setPlansByProperty((prev) => {
      const currentPropPlans = prev[propId] || {};
      const targetPlan = currentPropPlans[effectiveLot] || DEFAULT_EMPTY_PLAN;

      const updatedPaid = (targetPlan.amountPaid || 0) + payAmt;
      const updatedDue = Math.max(0, (targetPlan.dueAmount || payAmt) - payAmt);
      const isNowCompleted = updatedDue <= 0 && targetPlan.agreedAmount > 0;

      const updatedPlan = {
        ...targetPlan,
        hasPlan: true,
        amountPaid: updatedPaid,
        dueAmount: updatedDue,
        status: isNowCompleted ? 'Completed' : (targetPlan.status === 'No Plan' ? 'Active' : targetPlan.status),
        statusType: isNowCompleted ? 'completed' : 'active',
        statusLabel: isNowCompleted ? 'COMPLETED' : 'ACTIVE',
        history: [newTxn, ...(targetPlan.history || [])],
        completedInstallments: (targetPlan.completedInstallments || 0) + 1,
      };

      return {
        ...prev,
        [propId]: {
          ...currentPropPlans,
          [effectiveLot]: updatedPlan,
        },
      };
    });

    setIsPayModalOpen(false);
    showToast(`Payment of ${formatCurrency(payAmt)} processed successfully!`, 'success');
  };

  // Navigation Handlers
  const handleNavClick = (item) => {
    if (item.id === 'payments') {
      // Already on payments
    } else if (item.id === 'home') {
      try {
        f7.views.main.router.navigate('/home/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/home/';
      }
    } else if (item.id === 'invoices') {
      try {
        f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/invoices/';
      }
    } else if (item.id === 'levy') {
      try {
        f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/levy/';
      }
    } else if (item.id === 'maintenance') {
      try {
        f7.views.main.router.navigate('/maintenance/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/maintenance/';
      }
    } else if (item.id === 'committee') {
      try {
        f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/committee/decisions/';
      }
    } else if (item.id === 'documents') {
      try {
        f7.views.main.router.navigate('/documents/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/documents/';
      }
    } else if (item.id === 'profile') {
      try {
        f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/profile/';
      }
    } else {
      showToast(`${item.label} section coming soon`);
    }
  };

  const handleChildNavClick = (child) => {
    if (child === 'Committee Decisions') {
      try {
        f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/committee/decisions/';
      }
    } else if (child === 'Invoice Approval' || child === 'All Invoices') {
      try {
        f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/invoices/';
      }
    } else if (child === 'Levy Overview' || child === 'My Levy') {
      try {
        f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/levy/';
      }
    } else if (child === 'Report Issues') {
      try {
        f7.views.main.router.navigate('/report-issues/', { animate: false, reloadCurrent: true });
      } catch {
        window.location.href = '/report-issues/';
      }
    } else {
      showToast(`${child} coming soon`);
    }
  };

  const handleToggleExpand = (id) => {
    setExpandedNav((prev) => ({ ...prev, [id]: !prev[id] }));
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

  // Progress percentage calculation
  const progressPct = useMemo(() => {
    if (!currentPlan.hasPlan || !currentPlan.agreedAmount || currentPlan.agreedAmount <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((currentPlan.amountPaid / currentPlan.agreedAmount) * 100));
  }, [currentPlan]);

  return (
    <Page className="payment-plan-page">
      <div className="payment-plan-app-shell">
        {/* Sidebar */}
        <AppSidebar
          isOpen={isSidebarOpen}
          navItems={navItems}
          expandedNav={expandedNav}
          activeNavId="payments"
          onToggleExpand={handleToggleExpand}
          onNavClick={handleNavClick}
          onChildNavClick={handleChildNavClick}
          onLogout={handleLogoutClick}
          onLogoClick={() => showToast('Intellistrata Portal')}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="payment-plan-main-area" id="payment-plan-main-area">
          {/* Top Navbar */}
          <AppNavbar
            searchTerm={navbarSearch}
            onSearchChange={(e) => setNavbarSearch(e.target.value)}
            onSearchClear={() => setNavbarSearch('')}
            searchPlaceholder="Search payment plans, transactions, receipts..."
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

          {/* Scrollable Content Container */}
          <div className="payment-plan-content-area">
            <div className="payment-plan-container">
              {/* DESKTOP EXPERIENCE (> 900px) */}
              <div className="payment-plan-desktop-view">
                {/* Breadcrumb & Title Bar (Matching other portal pages) */}
                <div className="payment-plan-title-row">
                <div>
                  <nav className="payment-plan-breadcrumbs" aria-label="Breadcrumb">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          f7.views.main.router.navigate('/home/', { animate: false, reloadCurrent: true });
                        } catch {
                          window.location.href = '/home/';
                        }
                      }}
                    >
                      Home
                    </button>
                    <span>&bull;</span>
                    <span>Payment Plan</span>
                  </nav>
                  <h1 className="payment-plan-page-title">
                    <span>Payment Plan</span>
                  </h1>
                </div>

                {/* Header Actions: LotSelector + Status Badge + Actions */}
                <div className="payment-plan-header-actions">
                  <LotSelector
                    selectedLot={effectiveLot}
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
                    onSelectLot={(lot) => {
                      setSelectedLot(lot);
                      showToast(`Selected ${lot}`, 'info');
                    }}
                  />

                  {/* Status Pill */}
                  <span className={`payment-plan-status-pill ${currentPlan.statusType || 'none'}`}>
                    <span className="payment-plan-status-dot" />
                    <span>{currentPlan.statusLabel || 'NO PAYMENT PLAN'}</span>
                  </span>

                  {/* Action buttons */}
                  {currentPlan.hasPlan && currentPlan.statusType === 'active' ? (
                    <button
                      type="button"
                      className="payment-plan-btn-pay"
                      onClick={() => setIsPayModalOpen(true)}
                    >
                      <DollarSign size={16} />
                      <span>Make Payment</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="payment-plan-btn-apply"
                      onClick={() => setIsApplyModalOpen(true)}
                    >
                      <Plus size={16} />
                      <span>Apply for Payment Plan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Main White Card Wrapper */}
              <div className="payment-plan-card-wrapper">

                {/* Notice Alert Banner (as in screenshot: "No payment plan exist." or Active details) */}
                <div className={`payment-plan-notice-card ${currentPlan.hasPlan ? 'active-plan' : 'no-plan'}`}>
                  <div className="payment-plan-notice-left">
                    <AlertCircle size={18} className={`payment-plan-notice-icon ${!currentPlan.hasPlan ? 'muted' : ''}`} />
                    <span>{currentPlan.notice}</span>
                  </div>
                  {!currentPlan.hasPlan && (
                    <button
                      type="button"
                      className="payment-plan-notice-link"
                      onClick={() => setIsApplyModalOpen(true)}
                    >
                      Request a Plan &rarr;
                    </button>
                  )}
                </div>

                {/* 4 KPI Metric Summary Cards (Agreed Amount, Due Amount, Amount Paid, Paid On Time) */}
                <div className="payment-plan-metrics-grid">
                  {/* 1. Agreed Amount */}
                  <div className="payment-plan-metric-card agreed">
                    <div className="payment-plan-metric-header">
                      <span className="payment-plan-metric-label">Agreed Amount</span>
                      <div className="payment-plan-metric-icon-wrap">
                        <FileText size={16} />
                      </div>
                    </div>
                    <h3 className="payment-plan-metric-val">{formatCurrency(currentPlan.agreedAmount)}</h3>
                    <p className="payment-plan-metric-sub">
                      {currentPlan.hasPlan ? `${currentPlan.totalInstallments} scheduled installments` : 'No agreement active'}
                    </p>
                  </div>

                  {/* 2. Due Amount */}
                  <div className="payment-plan-metric-card due">
                    <div className="payment-plan-metric-header">
                      <span className="payment-plan-metric-label">Due Amount</span>
                      <div className="payment-plan-metric-icon-wrap">
                        <Clock size={16} />
                      </div>
                    </div>
                    <h3 className="payment-plan-metric-val">{formatCurrency(currentPlan.dueAmount)}</h3>
                    <p className="payment-plan-metric-sub">
                      {currentPlan.hasPlan && currentPlan.dueAmount > 0
                        ? `Next: ${formatCurrency(currentPlan.nextPaymentAmount)} on ${currentPlan.nextPaymentDate}`
                        : 'No pending installments'}
                    </p>
                  </div>

                  {/* 3. Amount Paid */}
                  <div className="payment-plan-metric-card paid">
                    <div className="payment-plan-metric-header">
                      <span className="payment-plan-metric-label">Amount Paid</span>
                      <div className="payment-plan-metric-icon-wrap">
                        <TrendingUp size={16} />
                      </div>
                    </div>
                    <h3 className="payment-plan-metric-val">{formatCurrency(currentPlan.amountPaid)}</h3>
                    <p className="payment-plan-metric-sub">
                      {currentPlan.hasPlan
                        ? `${currentPlan.completedInstallments} of ${currentPlan.totalInstallments} paid`
                        : '$0.00 settled'}
                    </p>
                  </div>

                  {/* 4. Paid On Time */}
                  <div className="payment-plan-metric-card ontime">
                    <div className="payment-plan-metric-header">
                      <span className="payment-plan-metric-label">Paid On Time</span>
                      <div className="payment-plan-metric-icon-wrap">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                    <h3 className="payment-plan-metric-val">{currentPlan.paidOnTime}</h3>
                    <p className="payment-plan-metric-sub">
                      {currentPlan.paidOnTime.includes('Yes') ? 'Zero dishonour notices' : 'Standard schedule'}
                    </p>
                  </div>
                </div>

                {/* Overall Progress Section */}
                <div className="payment-plan-progress-card">
                  <div className="payment-plan-progress-header">
                    <div className="payment-plan-progress-title">
                      <TrendingUp size={18} />
                      <span>Overall Progress</span>
                    </div>
                    <span className="payment-plan-progress-pct">{progressPct}%</span>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="payment-plan-progress-bar-track" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className="payment-plan-progress-bar-fill"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="payment-plan-progress-caption-row">
                    <span className="payment-plan-progress-caption-main">
                      Paid {formatCurrency(currentPlan.amountPaid)} of {formatCurrency(currentPlan.agreedAmount)}
                    </span>
                    {currentPlan.hasPlan && currentPlan.dueAmount > 0 && (
                      <span className="payment-plan-progress-caption-next">
                        <Calendar size={13} />
                        Next instalment: {formatCurrency(currentPlan.nextPaymentAmount)} on {currentPlan.nextPaymentDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2-Column Content Grid: Payment Status & Payment History */}
                <div className="payment-plan-content-grid">
                  {/* Left Column: Payment Status Card */}
                  <div className="payment-plan-inner-card">
                    <div className="payment-plan-inner-card-header">
                      <h3 className="payment-plan-inner-card-title">
                        <AlertCircle size={18} />
                        <span>Payment Status</span>
                      </h3>
                      <span className={`payment-plan-status-pill ${currentPlan.statusType || 'none'}`} style={{ padding: '3px 10px', fontSize: 11 }}>
                        {currentPlan.statusLabel}
                      </span>
                    </div>

                    <div className="payment-plan-inner-card-body">
                      <div className="payment-plan-detail-list">
                        <div className="payment-plan-detail-item">
                          <span className="payment-plan-detail-key">Plan Status</span>
                          <span className="payment-plan-detail-val">
                            <span className="payment-plan-status-dot" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                            <span>{currentPlan.statusLabel}</span>
                          </span>
                        </div>

                        <div className="payment-plan-detail-item">
                          <span className="payment-plan-detail-key">Frequency</span>
                          <span className="payment-plan-detail-val">{currentPlan.frequency}</span>
                        </div>

                        <div className="payment-plan-detail-item">
                          <span className="payment-plan-detail-key">Plan Started</span>
                          <span className="payment-plan-detail-val">{currentPlan.planStarted}</span>
                        </div>

                        <div className="payment-plan-detail-item">
                          <span className="payment-plan-detail-key">Plan Ends</span>
                          <span className="payment-plan-detail-val">{currentPlan.planEnds}</span>
                        </div>

                        {currentPlan.hasPlan && (
                          <>
                            <div className="payment-plan-detail-item">
                              <span className="payment-plan-detail-key">Installment Amount</span>
                              <span className="payment-plan-detail-val" style={{ color: 'var(--color-primary, #0d9488)', fontWeight: 700 }}>
                                {formatCurrency(currentPlan.installmentAmount)}
                              </span>
                            </div>

                            <div className="payment-plan-detail-item">
                              <span className="payment-plan-detail-key">Payment Method</span>
                              <span className="payment-plan-detail-val">{currentPlan.paymentMethod}</span>
                            </div>

                            <div className="payment-plan-detail-item">
                              <span className="payment-plan-detail-key">Levy Reference</span>
                              <span className="payment-plan-detail-val" style={{ fontSize: 12.5 }}>
                                {currentPlan.levyReference}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Payment History Card */}
                  <div className="payment-plan-inner-card">
                    <div className="payment-plan-inner-card-header">
                      <h3 className="payment-plan-inner-card-title">
                        <Clock size={18} />
                        <span>Payment History</span>
                      </h3>
                      {currentPlan.history && currentPlan.history.length > 0 && (
                        <button
                          type="button"
                          className="payment-plan-receipt-btn"
                          onClick={() => showToast('Payment statement exported to PDF!', 'success')}
                        >
                          <Download size={13} />
                          <span>Export PDF</span>
                        </button>
                      )}
                    </div>

                    <div className="payment-plan-inner-card-body" style={{ padding: 0 }}>
                      {currentPlan.history && currentPlan.history.length > 0 ? (
                        <div className="payment-plan-history-table-wrap">
                          <table className="payment-plan-history-table">
                            <thead>
                              <tr>
                                <th>Payment Date</th>
                                <th>Amount</th>
                                <th>Paid Levy</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Receipt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentPlan.history.map((item) => (
                                <tr key={item.id}>
                                  <td>
                                    <div style={{ fontWeight: 600 }}>{item.paymentDate}</div>
                                    <span className="payment-plan-ref-pill">{item.receiptNo}</span>
                                  </td>
                                  <td className="payment-plan-amount-cell">
                                    {formatCurrency(item.amount)}
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 500 }}>{item.paidLevy}</div>
                                    <div style={{ fontSize: 11, color: 'var(--color-slate-400, #94a3b8)' }}>{item.method}</div>
                                  </td>
                                  <td>
                                    <span className="payment-plan-history-status-pill">
                                      <CheckCircle2 size={12} />
                                      <span>{item.status}</span>
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      className="payment-plan-receipt-btn"
                                      title="View Receipt"
                                      onClick={() => setSelectedReceipt(item)}
                                    >
                                      <Receipt size={13} />
                                      <span>View</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="payment-plan-empty-history">
                          <div className="payment-plan-empty-icon-wrap">
                            <Receipt size={28} />
                          </div>
                          <h4 className="payment-plan-empty-title">No Payment History Recorded</h4>
                          <p className="payment-plan-empty-desc">
                            There are no installment transactions recorded for {effectiveLot} under an active payment agreement.
                          </p>
                          <button
                            type="button"
                            className="payment-plan-btn-apply"
                            style={{ marginTop: 8 }}
                            onClick={() => setIsApplyModalOpen(true)}
                          >
                            <Plus size={15} />
                            <span>Request Payment Arrangement</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Meta Row */}
                <div className="payment-plan-footer-row">
                  <span>Last updated: {new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="payment-plan-footer-secure">
                    <ShieldCheck size={14} />
                    <span>Secure payment plan &bull; Encrypted with 256-bit bank-grade SSL</span>
                  </span>
                </div>
              </div>
              </div>

              {/* MOBILE EXPERIENCE (<= 900px) */}
              <MobilePaymentPlanView
                selectedProperty={selectedProperty}
                effectiveLot={effectiveLot}
                properties={properties}
                onSelectProperty={(prop) => {
                  setSelectedProperty(prop);
                  showToast(`Switched to ${prop.name}`, 'success');
                }}
                currentPlan={currentPlan}
                progressPct={progressPct}
                onApply={() => setIsApplyModalOpen(true)}
                onPay={() => setIsPayModalOpen(true)}
                onSelectReceipt={(receipt) => setSelectedReceipt(receipt)}
                onSelectLot={(lot) => {
                  setSelectedLot(lot);
                  showToast(`Selected ${lot}`, 'info');
                }}
                showToast={showToast}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Popup */}
      {activePopup === 'quickActions' && (
        <QuickActionsPopup
          popupRef={popupRef}
          onClose={() => setActivePopup(null)}
          title="Payment Plan Actions"
          actions={[
            {
              key: 'apply',
              label: 'Apply for Payment Plan',
              iconClass: 'check-icon',
              icon: <Plus size={18} color="#059669" />,
            },
            {
              key: 'pay',
              label: 'Make Installment Payment',
              iconClass: 'clock-icon',
              icon: <CreditCard size={18} color="#0d9488" />,
            },
            {
              key: 'export',
              label: 'Download Agreement (PDF)',
              iconClass: 'export-icon',
              icon: <Download size={18} color="#2563eb" />,
            },
            {
              key: 'documents',
              label: 'View Strata Documents',
              iconClass: 'docs-icon',
              icon: <FileText size={18} color="#7c3aed" />,
            },
          ]}
          onAction={(actionKey) => {
            const key = typeof actionKey === 'string' ? actionKey : actionKey?.key || actionKey?.id;
            setActivePopup(null);
            if (key === 'apply' || key === 'approve') {
              setIsApplyModalOpen(true);
            } else if (key === 'pay' || key === 'pending') {
              setIsPayModalOpen(true);
            } else if (key === 'export') {
              showToast('Downloading Executed Agreement (PDF)...', 'success');
            } else if (key === 'documents') {
              try {
                f7.views.main.router.navigate('/documents/', { animate: false, reloadCurrent: true });
              } catch (e) {
                window.location.href = '/documents/';
              }
            } else if (key === 'overdue') {
              showToast(`Current Plan Status: ${currentPlan.status || 'No Active Plan'}`, 'info');
            } else {
              showToast(`Quick Action: ${key}`, 'info');
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
          onInputChange={setAiInput}
          onSubmit={handleAiSubmit}
          onSuggestion={handleAiSuggestion}
          aiChatEndRef={aiChatEndRef}
          onClearChat={() => setAiMessages([])}
          promptQuestion="How can I assist with your payment plan?"
          suggestions={[
            'What is my outstanding balance?',
            'When is my next installment due?',
            'How do I apply for a payment plan?',
            'Can I change my direct debit details?',
          ]}
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

      {/* ======================================================
          MODAL 1: Apply for Payment Plan (Portalled to document.body)
          ====================================================== */}
      {isApplyModalOpen && createPortal(
        <div
          className="payment-plan-modal-overlay"
          onClick={() => setIsApplyModalOpen(false)}
        >
          <div
            className="payment-plan-modal-box wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-plan-modal-header">
              <h3 className="payment-plan-modal-title">
                <CreditCard size={18} />
                <span>Apply for Strata Payment Plan — {effectiveLot}</span>
              </h3>
              <button
                type="button"
                className="payment-plan-modal-close-btn"
                onClick={() => setIsApplyModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit}>
              <div className="payment-plan-modal-body">
                <div className="payment-plan-notice-card active-plan" style={{ margin: 0 }}>
                  <div className="payment-plan-notice-left">
                    <ShieldCheck size={18} className="payment-plan-notice-icon" />
                    <span>
                      Payment plans allow strata owners experiencing temporary hardship to pay overdue levies in manageable installments.
                    </span>
                  </div>
                </div>

                <div className="payment-plan-form-grid-2">
                  <div className="payment-plan-form-group">
                    <label className="payment-plan-form-label">
                      Outstanding Amount to Cover ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="payment-plan-form-input"
                      value={applyForm.targetAmount}
                      onChange={(e) => setApplyForm({ ...applyForm, targetAmount: e.target.value })}
                      placeholder="e.g. 3500.00"
                    />
                    <span className="payment-plan-form-hint">Total levy amount to schedule into plan</span>
                  </div>

                  <div className="payment-plan-form-group">
                    <label className="payment-plan-form-label">
                      Payment Frequency *
                    </label>
                    <select
                      className="payment-plan-form-select"
                      value={applyForm.frequency}
                      onChange={(e) => setApplyForm({ ...applyForm, frequency: e.target.value })}
                    >
                      {PAYMENT_PLAN_FREQUENCIES.map((freq) => (
                        <option key={freq.id} value={freq.label}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                    <span className="payment-plan-form-hint">How often you propose to make payments</span>
                  </div>
                </div>

                <div className="payment-plan-form-grid-2">
                  <div className="payment-plan-form-group">
                    <label className="payment-plan-form-label">
                      Proposed Installment Amount ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="payment-plan-form-input"
                      value={applyForm.installmentAmount}
                      onChange={(e) => setApplyForm({ ...applyForm, installmentAmount: e.target.value })}
                      placeholder="e.g. 350.00"
                    />
                    <span className="payment-plan-form-hint">
                      Estimated ~{Math.ceil((parseFloat(applyForm.targetAmount) || 0) / (parseFloat(applyForm.installmentAmount) || 1))} installments
                    </span>
                  </div>

                  <div className="payment-plan-form-group">
                    <label className="payment-plan-form-label">
                      Preferred Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      className="payment-plan-form-input"
                      value={applyForm.startDate}
                      onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    />
                    <span className="payment-plan-form-hint">When you wish the first installment to be processed</span>
                  </div>
                </div>

                <div className="payment-plan-form-group">
                  <label className="payment-plan-form-label">
                    Preferred Payment Method *
                  </label>
                  <select
                    className="payment-plan-form-select"
                    value={applyForm.paymentMethod}
                    onChange={(e) => setApplyForm({ ...applyForm, paymentMethod: e.target.value })}
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.label}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="payment-plan-form-group">
                  <label className="payment-plan-form-label">
                    Reason / Additional Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    className="payment-plan-form-textarea"
                    value={applyForm.reason}
                    onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                    placeholder="Provide any context for the committee to consider..."
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="terms-check"
                    required
                    checked={applyForm.termsAccepted}
                    onChange={(e) => setApplyForm({ ...applyForm, termsAccepted: e.target.checked })}
                    style={{ marginTop: 3 }}
                  />
                  <label htmlFor="terms-check" style={{ fontSize: 12.5, color: 'var(--color-slate-600, #475569)', cursor: 'pointer' }}>
                    I acknowledge that interest may still accrue according to Owners Corporation Act regulations until all arrears are fully discharged.
                  </label>
                </div>
              </div>

              <div className="payment-plan-modal-footer">
                <button
                  type="button"
                  className="payment-plan-btn-cancel"
                  onClick={() => setIsApplyModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="payment-plan-btn-submit">
                  Submit Plan Application
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================
          MODAL 2: Make Extra Payment (Portalled to document.body)
          ====================================================== */}
      {isPayModalOpen && createPortal(
        <div
          className="payment-plan-modal-overlay"
          onClick={() => setIsPayModalOpen(false)}
        >
          <div
            className="payment-plan-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-plan-modal-header">
              <h3 className="payment-plan-modal-title">
                <DollarSign size={18} />
                <span>Make a Payment — {effectiveLot}</span>
              </h3>
              <button
                type="button"
                className="payment-plan-modal-close-btn"
                onClick={() => setIsPayModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMakePaymentSubmit}>
              <div className="payment-plan-modal-body">
                <div className="payment-plan-form-group">
                  <label className="payment-plan-form-label">
                    Payment Amount ($AUD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="payment-plan-form-input"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  />
                  <span className="payment-plan-form-hint">
                    Current balance due: {formatCurrency(currentPlan.dueAmount)}
                  </span>
                </div>

                <div className="payment-plan-form-group">
                  <label className="payment-plan-form-label">
                    Payment Method *
                  </label>
                  <select
                    className="payment-plan-form-select"
                    value={payForm.method}
                    onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                  >
                    <option value="Credit Card (Visa •••• 4242)">Credit Card (Visa •••• 4242)</option>
                    <option value="Direct Debit (CommBank •••• 8291)">Direct Debit (CommBank •••• 8291)</option>
                    <option value="Apple Pay / Google Pay">Apple Pay / Google Pay</option>
                  </select>
                </div>

                <div className="payment-plan-form-group">
                  <label className="payment-plan-form-label">
                    Payment Note / Description
                  </label>
                  <input
                    type="text"
                    className="payment-plan-form-input"
                    value={payForm.memo}
                    onChange={(e) => setPayForm({ ...payForm, memo: e.target.value })}
                  />
                </div>
              </div>

              <div className="payment-plan-modal-footer">
                <button
                  type="button"
                  className="payment-plan-btn-cancel"
                  onClick={() => setIsPayModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="payment-plan-btn-submit">
                  Pay {formatCurrency(parseFloat(payForm.amount) || 0)} Now
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================
          MODAL 3: View Receipt (Portalled to document.body)
          ====================================================== */}
      {selectedReceipt && createPortal(
        <div
          className="payment-plan-modal-overlay"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="payment-plan-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-plan-modal-header">
              <h3 className="payment-plan-modal-title">
                <Receipt size={18} />
                <span>Official Strata Payment Receipt</span>
              </h3>
              <button
                type="button"
                className="payment-plan-modal-close-btn"
                onClick={() => setSelectedReceipt(null)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="payment-plan-modal-body">
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <span className="payment-plan-history-status-pill" style={{ fontSize: 13, padding: '4px 14px' }}>
                  <CheckCircle2 size={15} />
                  <span>Payment Confirmed</span>
                </span>
                <h2 style={{ fontSize: 28, fontWeight: 800, margin: '12px 0 2px', color: 'var(--color-slate-900, #0f172a)' }}>
                  {formatCurrency(selectedReceipt.amount)}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-slate-500, #64748b)', margin: 0 }}>
                  Processed on {selectedReceipt.paymentDate}
                </p>
              </div>

              <div className="payment-plan-detail-list" style={{ borderTop: '1px solid var(--color-slate-100, #f1f5f9)', paddingTop: 14 }}>
                <div className="payment-plan-detail-item">
                  <span className="payment-plan-detail-key">Receipt Number</span>
                  <span className="payment-plan-detail-val" style={{ fontFamily: 'monospace' }}>
                    {selectedReceipt.receiptNo}
                  </span>
                </div>
                <div className="payment-plan-detail-item">
                  <span className="payment-plan-detail-key">Transaction Ref</span>
                  <span className="payment-plan-detail-val" style={{ fontFamily: 'monospace' }}>
                    {selectedReceipt.reference}
                  </span>
                </div>
                <div className="payment-plan-detail-item">
                  <span className="payment-plan-detail-key">Levy Account</span>
                  <span className="payment-plan-detail-val">{selectedReceipt.paidLevy}</span>
                </div>
                <div className="payment-plan-detail-item">
                  <span className="payment-plan-detail-key">Payment Method</span>
                  <span className="payment-plan-detail-val">{selectedReceipt.method}</span>
                </div>
                <div className="payment-plan-detail-item">
                  <span className="payment-plan-detail-key">Property & Lot</span>
                  <span className="payment-plan-detail-val">{selectedProperty?.name} — {effectiveLot}</span>
                </div>
              </div>
            </div>

            <div className="payment-plan-modal-footer">
              <button
                type="button"
                className="payment-plan-btn-cancel"
                onClick={() => setSelectedReceipt(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="payment-plan-btn-submit"
                onClick={() => {
                  showToast('Receipt PDF downloaded to device!', 'success');
                  setSelectedReceipt(null);
                }}
              >
                <Download size={14} style={{ marginRight: 4 }} />
                Download PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Page>
  );
};

export default PaymentPlanPage;
